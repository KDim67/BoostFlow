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
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const userOrgs = await getUserOrganizations(user.uid);
        setOrganizations(userOrgs);
        
        if (userOrgs.length === 1) {
          router.push(`/organizations/${userOrgs[0].id}`);
        }
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
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-amber-100 text-amber-800';
      case 'admin': return 'bg-green-100 text-green-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your organizations and their projects</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create Organization'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Organization</h2>
          <form onSubmit={handleCreateOrganization}>
            <div className="mb-4">
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                id="orgName"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="orgPlan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subscription Plan
              </label>
              <select
                id="orgPlan"
                value={newOrgPlan}
                onChange={(e) => setNewOrgPlan(e.target.value as SubscriptionPlan)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isCreating || !newOrgName}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {isCreating ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        </div>
      )}

      {organizations.length === 0 && !isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Organizations Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't belong to any organizations yet. Create your first organization to get started.
          </p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Organization
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Link
              href={`/organizations/${org.id}`}
              key={org.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="w-12 h-12 rounded-full mr-4" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-semibold text-lg">
                      {org.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                  <div className="flex space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(org.userRole)}`}>
                      {org.userRole}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPlanBadgeColor(org.plan)}`}>
                      {org.plan}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <div>Projects: {org.projectCount || 0}</div>
                <div>Members: {org.memberCount || 1}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}