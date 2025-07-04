'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';
import { getUserOrganizations, createOrganization } from '@/lib/firebase/organizationService';
import { Organization, OrganizationWithDetails, SubscriptionPlan } from '@/lib/types/organization';
import Badge from '@/components/Badge';

/**
 * Organizations management page component
 * Allows users to view, create, and manage their organizations with subscription plans
 */
export default function OrganizationsPage() {
  // Organization data and UI state
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // New organization form state
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState<SubscriptionPlan>('free');
  const [teamSize, setTeamSize] = useState(15); // Default to free plan limit
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Organization list filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'plan' | 'members' | 'projects'>('name');
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Base pricing per user per month in EUR
  const basePrices = {
    starter: 7.49,
    pro: 15
  };

  /**
   * Calculates the final price per user with volume and billing cycle discounts
   * @param basePrice - Base price per user per month
   * @returns Formatted price string with 2 decimal places
   */
  const calculatePrice = (basePrice: number) => {
    let discount = 0;
    
    // Volume-based discount tiers
    if (teamSize > 500) {
      discount = 0.25; // 25% discount for enterprise teams
    } else if (teamSize > 300) {
      discount = 0.20; // 20% discount for large teams
    } else if (teamSize > 100) {
      discount = 0.15; // 15% discount for medium teams
    } else if (teamSize > 50) {
      discount = 0.10; // 10% discount for growing teams
    } else if (teamSize > 20) {
      discount = 0.05; // 5% discount for small teams
    }
    
    // Annual billing discount (17% off)
    const annualDiscount = billingCycle === 'annually' ? 0.17 : 0;
    
    // Apply both discounts multiplicatively
    const discountedPrice = basePrice * (1 - discount) * (1 - annualDiscount);
    return discountedPrice.toFixed(2);
  };

  /**
   * Gets the current volume discount percentage for display purposes
   * @returns Discount percentage as integer (0-25)
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
   * Returns the feature list for each subscription plan
   * @param plan - The subscription plan type
   * @returns Array of feature strings for the plan
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
   * Gets the formatted price string for a subscription plan
   * @param plan - The subscription plan type
   * @returns Formatted price string with currency symbol
   */
  const getPlanPrice = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free': return '€0';
      case 'starter': return `€${calculatePrice(basePrices.starter)}`;
      case 'professional': return `€${calculatePrice(basePrices.pro)}`;
      case 'enterprise': return 'Custom'; // Enterprise pricing is negotiated
      default: return '€0';
    }
  };

  /**
   * Gets the pricing unit text for display (e.g., "/month per user")
   * @param plan - The subscription plan type
   * @returns Unit text string for the plan
   */
  const getPlanPriceUnit = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free': return '/forever';
      case 'starter': return '/month per user';
      case 'professional': return '/month per user';
      case 'enterprise': return ''; // No unit for custom pricing
      default: return '';
    }
  };

  // Fetch user's organizations when authentication is complete
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const userOrgs = await getUserOrganizations(user.uid);
        setOrganizations(userOrgs);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setError('Failed to load organizations. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch when auth loading is complete to avoid unnecessary calls
    if (!authLoading) {
      fetchOrganizations();
    }
  }, [user, authLoading, router]);

  // Enforce free plan team size limit when plan changes
  useEffect(() => {
    if (newOrgPlan === 'free') {
      setTeamSize(Math.min(teamSize, 15)); // Free plan limited to 15 users
    }
  }, [newOrgPlan]);

  /**
   * Handles organization creation form submission
   * Validates plan limits, calculates pricing, and creates the organization
   */
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate free plan team size limit
    if (newOrgPlan === 'free' && teamSize > 15) {
      setError('Free plan is limited to 15 users. Please reduce team size or choose a different plan.');
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      
      // Calculate subscription details with current pricing and discounts
      const subscriptionDetails = {
        teamSize,
        billingCycle,
        pricePerUser: newOrgPlan === 'starter' ? parseFloat(calculatePrice(basePrices.starter)) : 
                     newOrgPlan === 'professional' ? parseFloat(calculatePrice(basePrices.pro)) : 0,
        totalPrice: newOrgPlan === 'free' ? 0 : 
                   newOrgPlan === 'enterprise' ? 0 : // Enterprise pricing is custom
                   parseFloat(calculatePrice(newOrgPlan === 'starter' ? basePrices.starter : basePrices.pro)) * teamSize,
        subscribedAt: new Date().toISOString(),
        discount: getCurrentDiscount()
      };
      
      // Create organization and redirect to its page
      const orgId = await createOrganization(user, {
        name: newOrgName,
        plan: newOrgPlan,
        subscriptionDetails
      });
      
      router.push(`/organizations/${orgId}`);
    } catch (error) {
      console.error('Error creating organization:', error);
      setError('Failed to create organization. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };





  // Filter organizations by search term and sort by selected criteria
  const filteredAndSortedOrganizations = organizations
    .filter(org => org.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name); // Alphabetical sort
        case 'plan': return a.plan.localeCompare(b.plan); // Plan type sort
        case 'members': return (b.memberCount || 0) - (a.memberCount || 0); // Descending member count
        case 'projects': return (b.projectCount || 0) - (a.projectCount || 0); // Descending project count
        default: return 0;
      }
    });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading your organizations...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            You need to be logged in to view your organizations. Please sign in to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Organizations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
                Manage your organizations and collaborate on projects with your team
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showCreateForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
              </svg>
              {showCreateForm ? 'Cancel' : 'Create Organization'}
            </button>
          </div>

          {/* Search and Filter Bar */}
          {organizations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="name">Name</option>
                    <option value="plan">Plan</option>
                    <option value="members">Members</option>
                    <option value="projects">Projects</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Create Organization Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Create New Organization
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Set up a new organization to start collaborating with your team</p>
            </div>
            
            <form onSubmit={handleCreateOrganization} className="p-6 space-y-6">
              <div className="space-y-2">
                <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter your organization name"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose a name that represents your team or company</p>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Your Plan</h3>
                
                {/* Team Size Selector */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-sm">
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
                          type="button"
                          onClick={() => setBillingCycle('monthly')}
                          className={`flex items-center justify-center px-4 py-2 rounded-full transition-all ${
                            billingCycle === 'monthly' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          Monthly
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setBillingCycle('annually')}
                          className={`flex items-center justify-center px-4 py-2 rounded-full transition-all ${
                            billingCycle === 'annually' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'
                          }`}
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

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Free Plan */}
                  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border transition-all hover:shadow-lg relative flex flex-col h-full ${
                    newOrgPlan === 'free' ? 'border-gray-500 ring-2 ring-gray-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                      type="button"
                      onClick={teamSize > 15 ? undefined : () => setNewOrgPlan('free')} 
                      className={`w-full font-medium py-3 px-6 rounded-full transition-all mt-auto ${
                        teamSize > 15
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : newOrgPlan === 'free' 
                            ? 'bg-gray-600 text-white' 
                            : 'bg-white text-gray-600 border border-gray-600 hover:bg-gray-50'
                      }`}
                      disabled={teamSize > 15}
                    >
                      {teamSize > 15 ? 'Not Available' : newOrgPlan === 'free' ? 'Selected' : 'Select Plan'}
                    </button>
                    {teamSize > 15 && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        Free plan is limited to 15 users
                      </p>
                    )}
                  </div>

                  {/* Starter Plan */}
                  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border transition-all hover:shadow-lg relative flex flex-col h-full ${
                    newOrgPlan === 'starter' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
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
                      type="button"
                      onClick={() => setNewOrgPlan('starter')} 
                      className={`w-full font-medium py-3 px-6 rounded-full transition-all mt-auto ${
                        newOrgPlan === 'starter' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {newOrgPlan === 'starter' ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>

                  {/* Professional Plan */}
                  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border transition-all hover:shadow-lg relative flex flex-col h-full ${
                    newOrgPlan === 'professional' ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
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
                      type="button"
                      onClick={() => setNewOrgPlan('professional')} 
                      className={`w-full font-medium py-3 px-6 rounded-full transition-all mt-auto ${
                        newOrgPlan === 'professional' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                      }`}
                    >
                      {newOrgPlan === 'professional' ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border transition-all hover:shadow-lg relative flex flex-col h-full ${
                    newOrgPlan === 'enterprise' ? 'border-green-500 ring-2 ring-green-500' : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
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
                      type="button"
                      onClick={() => setNewOrgPlan('enterprise')} 
                      className={`w-full font-medium py-3 px-6 rounded-full transition-all mt-auto ${
                        newOrgPlan === 'enterprise' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
                      }`}
                    >
                      {newOrgPlan === 'enterprise' ? 'Selected' : 'Contact Sales'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500/25"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newOrgName.trim()}
                  className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:scale-100 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Organization
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Organizations Grid */}
        {filteredAndSortedOrganizations.length === 0 && !isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                {searchTerm ? 'No matching organizations' : 'No Organizations Found'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {searchTerm 
                  ? `No organizations match "${searchTerm}". Try adjusting your search terms.`
                  : "You don't belong to any organizations yet. Create your first organization to start collaborating with your team."
                }
              </p>
              {!showCreateForm && !searchTerm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Organization
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedOrganizations.map((org) => (
              <Link
                href={`/organizations/${org.id}`}
                key={org.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:scale-105 hover:border-blue-300 dark:hover:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {org.logoUrl ? (
                      <img 
                        src={org.logoUrl} 
                        alt={org.name} 
                        className="w-14 h-14 rounded-xl object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-300 dark:group-hover:ring-blue-600 transition-all" 
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-300 dark:group-hover:ring-blue-600 transition-all">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                          {org.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {org.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          type="role" 
                          value={org.userRole} 
                          size="sm" 
                        />
                        <Badge 
                          type="plan" 
                          value={org.plan} 
                          variant="with-icon" 
                          size="sm" 
                        />
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{org.projectCount || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{org.memberCount || 1}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Members</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}