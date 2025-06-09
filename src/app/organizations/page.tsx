'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/useAuth';
import { getUserOrganizations, createOrganization } from '@/lib/firebase/organizationService';
import { Organization, OrganizationWithDetails, SubscriptionPlan } from '@/lib/types/organization';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState<SubscriptionPlan>('free');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'plan' | 'members' | 'projects'>('name');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;
      
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

    fetchOrganizations();
  }, [user, router]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsCreating(true);
      setError(null);
      
      const orgId = await createOrganization(user, {
        name: newOrgName,
        plan: newOrgPlan
      });
      
      router.push(`/organizations/${orgId}`);
    } catch (error) {
      console.error('Error creating organization:', error);
      setError('Failed to create organization. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getPlanBadgeColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'starter': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'professional': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'enterprise': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'admin': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'member': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'starter': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'professional': 
         return (
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
           </svg>
         );
      case 'enterprise': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default: 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  const filteredAndSortedOrganizations = organizations
    .filter(org => org.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'plan': return a.plan.localeCompare(b.plan);
        case 'members': return (b.memberCount || 0) - (a.memberCount || 0);
        case 'projects': return (b.projectCount || 0) - (a.projectCount || 0);
        default: return 0;
      }
    });

  if (isLoading) {
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
              
              <div className="space-y-2">
                <label htmlFor="orgPlan" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Subscription Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(['free', 'starter', 'professional', 'enterprise'] as SubscriptionPlan[]).map((plan) => {
                    const getPlanBorderColor = (planType: string, isSelected: boolean) => {
                      if (isSelected) {
                        switch (planType) {
                          case 'free': return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
                          case 'starter': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
                          case 'professional': return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
                          case 'enterprise': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
                          default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
                        }
                      }
                      return 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500';
                    };
                    
                    const getPlanTopBorder = (planType: string) => {
                      switch (planType) {
                        case 'free': return 'border-t-4 border-t-gray-500';
                        case 'starter': return 'border-t-4 border-t-blue-500';
                        case 'professional': return 'border-t-4 border-t-purple-500';
                        case 'enterprise': return 'border-t-4 border-t-green-500';
                        default: return 'border-t-4 border-t-gray-500';
                      }
                    };
                    
                    const getCheckmarkColor = (planType: string) => {
                      switch (planType) {
                        case 'free': return 'text-gray-500';
                        case 'starter': return 'text-blue-500';
                        case 'professional': return 'text-purple-500';
                        case 'enterprise': return 'text-green-500';
                        default: return 'text-blue-500';
                      }
                    };
                    
                    return (
                      <label
                        key={plan}
                        className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                          getPlanBorderColor(plan, newOrgPlan === plan)
                        } ${getPlanTopBorder(plan)}`}
                      >
                        <input
                          type="radio"
                          name="orgPlan"
                          value={plan}
                          checked={newOrgPlan === plan}
                          onChange={(e) => setNewOrgPlan(e.target.value as SubscriptionPlan)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-2xl ${
                            plan === 'free' ? 'text-gray-500' :
                            plan === 'starter' ? 'text-blue-500' :
                            plan === 'professional' ? 'text-purple-500' :
                            plan === 'enterprise' ? 'text-green-500' :
                            'text-gray-500'
                          }`}>{getPlanIcon(plan)}</span>
                          {newOrgPlan === plan && (
                            <svg className={`w-5 h-5 ${getCheckmarkColor(plan)}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">{plan}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {plan === 'free' && 'Perfect for getting started'}
                          {plan === 'starter' && 'Great for small teams'}
                          {plan === 'professional' && 'Advanced features'}
                          {plan === 'enterprise' && 'Full enterprise suite'}
                        </span>
                      </label>
                    );
                  })}
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
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getRoleBadgeColor(org.userRole)} transition-all`}>
                          {org.userRole}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getPlanBadgeColor(org.plan)} transition-all flex items-center gap-1`}>
                          {getPlanIcon(org.plan)}
                          {org.plan}
                        </span>
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