'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission, updateOrganization } from '@/lib/firebase/organizationService';
import { Organization, SubscriptionPlan } from '@/lib/types/organization';

export default function OrganizationBilling() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('free');
  const [teamSize, setTeamSize] = useState(300);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { user } = useAuth();
  const organizationId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
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

  const handleUpdatePlan = async () => {
    if (!organization || !organizationId) return;
    
    setIsUpdating(true);
    try {
      const subscriptionDetails = {
        teamSize,
        billingCycle,
        pricePerUser: selectedPlan === 'starter' ? parseFloat(calculatePrice(basePrices.starter)) : 
                     selectedPlan === 'professional' ? parseFloat(calculatePrice(basePrices.pro)) : 0,
        totalPrice: selectedPlan === 'free' ? 0 : 
                   selectedPlan === 'enterprise' ? 0 : 
                   parseFloat(calculatePrice(selectedPlan === 'starter' ? basePrices.starter : basePrices.pro)) * teamSize,
        subscribedAt: new Date().toISOString(),
        discount: getCurrentDiscount()
      };

      await updateOrganization(organizationId, {
        plan: selectedPlan,
        subscriptionDetails,
        updatedAt: new Date().toISOString()
      });

      setOrganization({
        ...organization,
        plan: selectedPlan,
        subscriptionDetails
      });
      
      setSuccessMessage(`Successfully ${isDowngrade(organization.plan, selectedPlan) ? 'downgraded' : 'upgraded'} to ${selectedPlan} plan!`);
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

  const basePrices = {
    starter: 7.49,
    pro: 15
  };

  const calculatePrice = (basePrice: number) => {
    let discount = 0;
    
    if (teamSize > 500) {
      discount = 0.25;
    } else if (teamSize > 300) {
      discount = 0.20;
    } else if (teamSize > 100) {
      discount = 0.15;
    } else if (teamSize > 50) {
      discount = 0.10;
    } else if (teamSize > 20) {
      discount = 0.05;
    }
    
    const annualDiscount = billingCycle === 'annually' ? 0.17 : 0;
    
    const discountedPrice = basePrice * (1 - discount) * (1 - annualDiscount);
    return discountedPrice.toFixed(2);
  };

  const getCurrentDiscount = () => {
    if (teamSize > 500) return 25;
    if (teamSize > 300) return 20;
    if (teamSize > 100) return 15;
    if (teamSize > 50) return 10;
    if (teamSize > 20) return 5;
    return 0;
  };

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

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (organization?.subscriptionDetails && organization.plan === plan) {
      if (plan === 'free') return '€0';
      if (plan === 'enterprise') return 'Custom';
      return `€${organization.subscriptionDetails.pricePerUser.toFixed(2)}`;
    }
    
    switch (plan) {
      case 'free': return '€0';
      case 'starter': return `€${calculatePrice(basePrices.starter)}`;
      case 'professional': return `€${calculatePrice(basePrices.pro)}`;
      case 'enterprise': return 'Custom';
      default: return '€0';
    }
  };

  const getPlanPriceUnit = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free': return '/forever';
      case 'starter': return '/month per user';
      case 'professional': return '/month per user';
      case 'enterprise': return '';
      default: return '';
    }
  };

  const getPlanOrder = (plan: SubscriptionPlan): number => {
    switch (plan) {
      case 'free': return 0;
      case 'starter': return 1;
      case 'professional': return 2;
      case 'enterprise': return 3;
      default: return 0;
    }
  };

  const isDowngrade = (currentPlan: SubscriptionPlan, newPlan: SubscriptionPlan): boolean => {
    return getPlanOrder(newPlan) < getPlanOrder(currentPlan);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error || 'Organization not found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The organization you're looking for doesn't exist or you don't have permission to view it.
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
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1 mt-1">
                    <span>1</span>
                    <span>250</span>
                    <span>500</span>
                    <span>750</span>
                    <span>1000</span>
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
                Cannot downgrade to free plan with more than 15 users. Please reduce team size first.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Payment Methods</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Add or update your payment methods to manage your subscription.
        </p>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Add Payment Method
        </button>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Billing History</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No billing history available yet.</p>
        </div>
      </div>
    </div>
  );
}