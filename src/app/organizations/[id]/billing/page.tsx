'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission, updateOrganization, getOrganizationMembers } from '@/lib/firebase/organizationService';
import { Organization, SubscriptionPlan } from '@/lib/types/organization';
import { NotificationService } from '@/lib/firebase/notificationService';

/**
 * OrganizationBilling Component
 * 
 * Manages subscription plans and billing for organizations. Allows admin users to:
 * - View current subscription details
 * - Compare available plans (Free, Starter, Professional, Enterprise)
 * - Upgrade/downgrade plans with team size and billing cycle configuration
 * - Apply volume discounts based on team size
 * - Handle plan change notifications to organization members
 */
export default function OrganizationBilling() {
  const { id } = useParams();
  // Core organization and UI state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Subscription configuration state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('free');
  const [teamSize, setTeamSize] = useState(300); // Default team size for pricing calculations
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annually'
  
  const { user } = useAuth();
  // Handle dynamic route parameter (can be string or array)
  const organizationId = Array.isArray(id) ? id[0] : id;

  /**
   * Fetches organization billing data and initializes component state
   * - Verifies user has admin permissions for billing management
   * - Loads current subscription details
   * - Sets team size based on existing subscription or active member count
   */
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Verify user has admin permissions to manage billing
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'admin');
        
        if (!permission) {
          setError('You do not have permission to manage billing for this organization.');
          setIsLoading(false);
          return;
        }
        
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        if (orgData) {
          setSelectedPlan(orgData.plan);
          // Use existing team size or calculate from active members
          if (orgData.subscriptionDetails?.teamSize) {
            setTeamSize(orgData.subscriptionDetails.teamSize);
          } else {
            const members = await getOrganizationMembers(organizationId);
            const activeMembers = members.filter(member => member.status === 'active');
            // Set minimum team size based on plan limits
            setTeamSize(Math.max(activeMembers.length, orgData.plan === 'free' ? 15 : 50));
          }
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
        setError('Failed to load billing data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [user, organizationId]);

  /**
   * Handles subscription plan updates with validation and member notifications
   * - Validates plan constraints (free plan user limits)
   * - Ensures team size doesn't exceed active member count
   * - Updates organization subscription details
   * - Sends notifications to all active members about plan changes
   */
  const handleUpdatePlan = async () => {
    if (!organization || !organizationId) return;
    
    // Get current active members for validation
    const currentMembers = await getOrganizationMembers(organizationId);
    const activeMembers = currentMembers.filter(member => member.status === 'active');
    
    // Validate free plan user limit
    if (selectedPlan === 'free' && teamSize > 15) {
      setError('Free plan is limited to 15 users. Please reduce team size or choose a different plan.');
      return;
    }
    
    // Ensure team size accommodates current active members
    if (activeMembers.length > teamSize) {
      setError(`Cannot set team size to ${teamSize}. You currently have ${activeMembers.length} active members. Please remove members first or increase the team size.`);
      return;
    }
    
    setIsUpdating(true);
    try {
      // Calculate subscription pricing details with discounts
      const subscriptionDetails = {
        teamSize,
        billingCycle,
        pricePerUser: selectedPlan === 'starter' ? parseFloat(calculatePrice(basePrices.starter)) : 
                     selectedPlan === 'professional' ? parseFloat(calculatePrice(basePrices.pro)) : 0,
        totalPrice: selectedPlan === 'free' ? 0 : 
                   selectedPlan === 'enterprise' ? 0 : // Enterprise pricing is custom
                   parseFloat(calculatePrice(selectedPlan === 'starter' ? basePrices.starter : basePrices.pro)) * teamSize,
        subscribedAt: new Date().toISOString(),
        discount: getCurrentDiscount() // Volume discount based on team size
      };

      await updateOrganization(organizationId, {
        plan: selectedPlan,
        subscriptionDetails,
        updatedAt: new Date().toISOString()
      });

      const isDowngradeChange = isDowngrade(organization.plan, selectedPlan);
      const changeType = isDowngradeChange ? 'downgraded' : 'upgraded';
      
      // Send plan change notifications to all active organization members
      try {
        const members = await getOrganizationMembers(organizationId);
        const activeMembers = members.filter(member => member.status === 'active');
        
        // Create notification promises for all active members
        const notificationPromises = activeMembers.map(member => 
          NotificationService.createNotification(
            member.userId,
            `Organization Plan ${changeType.charAt(0).toUpperCase() + changeType.slice(1)}`,
            `Your organization's plan has been ${changeType} to ${selectedPlan}. ${isDowngradeChange ? 'Some features may no longer be available.' : 'You now have access to additional features!'}`,
            isDowngradeChange ? 'plan_downgrade' : 'plan_upgrade',
            organizationId,
            `/organizations/${organizationId}/billing`,
            {
              previousPlan: organization.plan,
              newPlan: selectedPlan,
              organizationId: organizationId
            }
          )
        );
        
        // Send all notifications concurrently
        await Promise.all(notificationPromises);
      } catch (notificationError) {
        console.warn('Failed to send notifications to some members:', notificationError);
      }

      setOrganization({
        ...organization,
        plan: selectedPlan,
        subscriptionDetails
      });
      
      setSuccessMessage(`Successfully ${changeType} to ${selectedPlan} plan!`);
      setError(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error updating plan:', error);
      setError('Failed to update plan. Please try again.');
      setSuccessMessage(null);
    } finally {
      setIsUpdating(false);
    }
  };

  // Base monthly pricing per user (in EUR) before discounts
  const basePrices = {
    starter: 7.49,
    pro: 15
  };

  /**
   * Calculates discounted price per user based on team size and billing cycle
   * Volume discounts: 5% (20+ users), 10% (50+), 15% (100+), 20% (300+), 25% (500+)
   * Annual billing discount: 17% off monthly price
   */
  const calculatePrice = (basePrice: number) => {
    let discount = 0;
    
    // Apply volume discounts based on team size tiers
    if (teamSize > 500) {
      discount = 0.25; // 25% discount for 500+ users
    } else if (teamSize > 300) {
      discount = 0.20; // 20% discount for 300+ users
    } else if (teamSize > 100) {
      discount = 0.15; // 15% discount for 100+ users
    } else if (teamSize > 50) {
      discount = 0.10; // 10% discount for 50+ users
    } else if (teamSize > 20) {
      discount = 0.05; // 5% discount for 20+ users
    }
    
    // Additional discount for annual billing
    const annualDiscount = billingCycle === 'annually' ? 0.17 : 0;
    
    // Apply both volume and annual discounts
    const discountedPrice = basePrice * (1 - discount) * (1 - annualDiscount);
    return discountedPrice.toFixed(2);
  };

  /**
   * Returns the current volume discount percentage based on team size
   * Used for displaying discount information in the UI
   */
  const getCurrentDiscount = () => {
    if (teamSize > 500) return 25;
    if (teamSize > 300) return 20;
    if (teamSize > 100) return 15;
    if (teamSize > 50) return 10;
    if (teamSize > 20) return 5;
    return 0;
  };

  /**
   * Returns feature list for each subscription plan
   * Used to display plan capabilities in the pricing cards
   */
  const getPlanFeatures = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free':
        return [
          'Up to 15 users',
          'Limited automation workflows',
          'Basic analytics',
          '4 GB storage',
          'Community support'
        ];
      case 'starter':
        return [
          'Unlimited Users',
          'Basic automation workflows',
          'Standard analytics',
          '250 GB storage',
          'Email support'
        ];
      case 'professional':
        return [
          'Unlimited users',
          'Advanced automation workflows',
          'AI-powered analytics',
          'Unlimited Storage',
          'Priority support'
        ];
      case 'enterprise':
        return [
          'Everything in Pro plan',
          'Custom AI model training',
          'Dedicated account manager',
          'Custom integrations',
          '24/7 phone support',
          'On-premise deployment'
        ];
      default:
        return [];
    }
  };

  /**
   * Returns formatted price string for a given plan
   * Uses current subscription price if viewing the active plan,
   * otherwise calculates price based on current team size and billing cycle
   */
  const getPlanPrice = (plan: SubscriptionPlan) => {
    // Show actual subscription price for current plan
    if (organization?.subscriptionDetails && organization.plan === plan) {
      if (plan === 'free') return '€0';
      if (plan === 'enterprise') return 'Custom';
      return `€${organization.subscriptionDetails.pricePerUser.toFixed(2)}`;
    }
    
    // Calculate price for plan selection
    switch (plan) {
      case 'free': return '€0';
      case 'starter': return `€${calculatePrice(basePrices.starter)}`;
      case 'professional': return `€${calculatePrice(basePrices.pro)}`;
      case 'enterprise': return 'Custom';
      default: return '€0';
    }
  };

  /**
   * Returns the pricing unit text for display (e.g., "/month per user")
   */
  const getPlanPriceUnit = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free': return '/forever';
      case 'starter': return '/month per user';
      case 'professional': return '/month per user';
      case 'enterprise': return '';
      default: return '';
    }
  };

  /**
   * Returns numeric order for plan comparison (used to determine upgrades vs downgrades)
   */
  const getPlanOrder = (plan: SubscriptionPlan): number => {
    switch (plan) {
      case 'free': return 0;
      case 'starter': return 1;
      case 'professional': return 2;
      case 'enterprise': return 3;
      default: return 0;
    }
  };

  /**
   * Determines if a plan change is a downgrade (affects notification messaging)
   */
  const isDowngrade = (currentPlan: SubscriptionPlan, newPlan: SubscriptionPlan): boolean => {
    return getPlanOrder(newPlan) < getPlanOrder(currentPlan);
  };

  // Loading state with spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state or organization not found
  if (error || !organization) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error || 'Organization not found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error || "The organization you're looking for doesn't exist or you don't have permission to view it."}
        </p>
        <Link 
          href="/organizations"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your organization's subscription plan and billing information
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Current Plan</h2>
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{organization.plan} Plan</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {organization.subscriptionDetails ? 
                `${getPlanPrice(organization.plan)} per user/month (${organization.subscriptionDetails.teamSize} users)` :
                `${getPlanPrice(organization.plan)} per month`
              }
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Features:</h4>
          <ul className="space-y-2">
            {getPlanFeatures(organization.plan).map((feature, index) => (
              <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Available Plans</h2>
        
        {/* Team Size Selector */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="team-size" className="text-lg font-medium text-gray-700 dark:text-gray-300">Team size:</label>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1 rounded-full shadow-sm">
                    <input 
                      type="number" 
                      id="team-size-input" 
                      min="1" 
                      max="1000" 
                      value={teamSize} 
                      onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                      className="w-16 text-center border-none focus:ring-0 focus:outline-none bg-transparent text-gray-700 dark:text-gray-300"
                    />
                    <span className="text-gray-600 dark:text-gray-400">users</span>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="range" 
                    id="team-size" 
                    min="1" 
                    max="1000" 
                    value={teamSize} 
                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="relative mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="absolute left-0">1</span>
                    <span className="absolute -translate-x-1/2 left-1/4">250</span>
                    <span className="absolute -translate-x-1/2 left-1/2">500</span>
                    <span className="absolute -translate-x-1/2 left-3/4">750</span>
                    <span className="absolute -translate-x-full left-full">1000</span>
                  </div>
                </div>
                {getCurrentDiscount() > 0 && (
                  <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                    {getCurrentDiscount()}% team size discount applied!
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <label className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Bill me:</label>
                <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex items-center justify-center px-4 py-2 rounded-full transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    Monthly
                  </button>
                  
                  <button
                    onClick={() => setBillingCycle('annually')}
                    className={`flex items-center justify-center px-4 py-2 rounded-full transition-all ${billingCycle === 'annually' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    Annually
                  </button>
                </div>
                {billingCycle === 'annually' && (
                  <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400 text-center">
                    SAVE UP TO 17%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Free Plan */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border transition-all hover:shadow-lg relative flex flex-col h-full ${
            selectedPlan === 'free' ? 'border-gray-500 ring-2 ring-gray-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-500 rounded-t-xl"></div>
            <h3 className="text-xl font-bold mb-4 mt-4 text-gray-900 dark:text-white">Free</h3>
            <div className="mb-6">
               <span className="text-4xl font-bold text-gray-900 dark:text-white">{getPlanPrice('free')}</span>
               <span className="text-gray-500 dark:text-gray-400">{getPlanPriceUnit('free')}</span>
             </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for individuals and small projects to get started.</p>
            <ul className="space-y-3 mb-8 flex-grow">
              {getPlanFeatures('free').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={teamSize > 15 ? undefined : () => setSelectedPlan('free')} 
              className={`w-full font-medium py-3 px-6 rounded-full transition-all mt-auto ${
                teamSize > 15
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : selectedPlan === 'free' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-white text-gray-600 border border-gray-600 hover:bg-gray-50'
              }`}
              disabled={teamSize > 15}
            >
              {teamSize > 15 ? 'Not Available' : organization.plan === 'free' ? 'Current Plan' : 'Select Plan'}
            </button>
            {teamSize > 15 && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Free plan is limited to 15 users
              </p>
            )}
          </div>

          {/* Starter Plan */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border transition-all hover:shadow-lg relative flex flex-col h-full ${
            selectedPlan === 'starter' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-2 bg-blue-500 rounded-t-xl"></div>
            <h3 className="text-xl font-bold mb-4 mt-4 text-gray-900 dark:text-white">Starter</h3>
            <div className="mb-6">
               <span className="text-4xl font-bold text-gray-900 dark:text-white">{getPlanPrice('starter')}</span>
               <span className="text-gray-500 dark:text-gray-400">{getPlanPriceUnit('starter')}</span>
             </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for small teams just getting started with automation.</p>
            <ul className="space-y-3 mb-8 flex-grow">
              {getPlanFeatures('starter').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setSelectedPlan('starter')} 
              className={`w-full font-medium py-3 px-6 rounded-full transition-all mt-auto ${
                selectedPlan === 'starter' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {organization.plan === 'starter' ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>

          {/* Professional Plan */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border transition-all hover:shadow-lg relative flex flex-col h-full ${
            selectedPlan === 'professional' ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-xl"></div>
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold uppercase py-1 px-3 rounded-full">Popular</span>
            </div>
            <h3 className="text-xl font-bold mb-4 mt-4 text-gray-900 dark:text-white">Professional</h3>
            <div className="mb-6">
               <span className="text-4xl font-bold text-gray-900 dark:text-white">{getPlanPrice('professional')}</span>
               <span className="text-gray-500 dark:text-gray-400">{getPlanPriceUnit('professional')}</span>
             </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">For growing teams that need advanced features and more customization.</p>
            <ul className="space-y-3 mb-8 flex-grow">
              {getPlanFeatures('professional').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setSelectedPlan('professional')} 
              className={`w-full font-medium py-3 px-6 rounded-full transition-all mt-auto ${
                selectedPlan === 'professional' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
              }`}
            >
              {organization.plan === 'professional' ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border transition-all hover:shadow-lg relative flex flex-col h-full ${
            selectedPlan === 'enterprise' ? 'border-green-500 ring-2 ring-green-500' : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-2 bg-green-500 rounded-t-xl"></div>
            <h3 className="text-xl font-bold mb-4 mt-4 text-gray-900 dark:text-white">Enterprise</h3>
            <div className="mb-6">
               <span className="text-4xl font-bold text-gray-900 dark:text-white">{getPlanPrice('enterprise')}</span>
               <span className="text-gray-500 dark:text-gray-400">{getPlanPriceUnit('enterprise')}</span>
             </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">For large organizations with custom requirements and dedicated support.</p>
            <ul className="space-y-3 mb-8 flex-grow">
              {getPlanFeatures('enterprise').map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setSelectedPlan('enterprise')} 
              className={`w-full font-medium py-3 px-6 rounded-full transition-all mt-auto ${
                selectedPlan === 'enterprise' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
              }`}
            >
              {organization.plan === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
            </button>
          </div>
        </div>

        {/* Update Plan Button */}
        {selectedPlan !== organization.plan && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              {isDowngrade(organization.plan, selectedPlan) ? 'Downgrade to' : 'Upgrade to'} {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan
            </h3>
            <p className="text-blue-700 dark:text-blue-200 mb-4">
              {selectedPlan === 'free' ? 
                'You will switch to the free plan with limited features.' :
                selectedPlan === 'enterprise' ?
                'Contact our sales team for custom enterprise pricing.' :
                `You will be charged ${getPlanPrice(selectedPlan)} per user/month for ${teamSize} users (${billingCycle} billing).`
              }
            </p>
            <button
              onClick={handleUpdatePlan}
              disabled={isUpdating || (selectedPlan === 'free' && teamSize > 15)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Updating...' : `${isDowngrade(organization.plan, selectedPlan) ? 'Downgrade to' : 'Upgrade to'} ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`}
            </button>
            {selectedPlan === 'free' && teamSize > 15 && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                Cannot select free plan with more than 15 users. Please reduce team size to 15 or less.
              </p>
            )}
          </div>
        )}
      </div>


    </div>
  );
}