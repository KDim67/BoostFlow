'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, getOrganizationMembers, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getUserProfile, UserProfile } from '@/lib/firebase/userProfileService';
import { Organization, OrganizationMembership } from '@/lib/types/organization';
import OrganizationProjects from './projects/page';
import OrganizationIntegrations from '@/components/dashboard/OrganizationIntegrations';
import OrganizationMembers from './members/page';
import OrganizationSettings from './settings/page';
import OrganizationBilling from './billing/page';

function MembersRedirect({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  
  useEffect(() => {
    router.replace(`/organizations/${organizationId}/members`);
  }, [router, organizationId]);
  
  return (
    <div className="text-center py-8">
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Redirecting to the dedicated Members page...
      </p>
    </div>
  );
}

export default function OrganizationPage() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<{[key: string]: UserProfile}>({});
  const [activeTab, setActiveTab] = useState('projects');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const organizationId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        setHasPermission(permission);
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        const membersData = await getOrganizationMembers(organizationId);
        setMembers(membersData);
        
        const profilePromises = membersData.map(member => getUserProfile(member.userId));
        const profiles = await Promise.all(profilePromises);
        
        const profileMap: {[key: string]: UserProfile} = {};
        membersData.forEach((member, index) => {
          if (profiles[index]) {
            profileMap[member.userId] = profiles[index];
          }
        });
        setMemberProfiles(profileMap);
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setError('Failed to load organization data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizationData();
  }, [user, organizationId]);

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

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
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
      </div>
    );
  }

  return (
    <div>
        {/* Organization Tabs */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-4 px-1 ${activeTab === 'projects' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-4 px-1 ${activeTab === 'members' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 px-1 ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`pb-4 px-1 ${activeTab === 'integrations' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Integrations
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`pb-4 px-1 ${activeTab === 'billing' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'} font-medium`}
            >
              Billing
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'projects' && (
          <OrganizationProjects />
        )}

        {activeTab === 'members' && (
          <OrganizationMembers/>
        )}

        {activeTab === 'integrations' && organizationId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <OrganizationIntegrations 
              currentUser={user?.uid || ''}
              organizationId={organizationId}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <OrganizationSettings/>
        )}

        {activeTab === 'billing' && (
          <OrganizationBilling/>
        )}
    </div>
  );
}