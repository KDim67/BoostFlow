'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission, getOrganizationMembers } from '@/lib/firebase/organizationService';
import { queryDocuments, createDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { where, serverTimestamp } from 'firebase/firestore';
import { Organization, OrganizationMembership } from '@/lib/types/organization';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  photoURL?: string;
  organizationId: string;
  projectId: string;
  userId: string;
  createdBy: string;
  createdAt: any;
}

export default function OrganizationProjectsTeam() {
  const { id, projectId } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const organizationId = Array.isArray(id) ? id[0] : id;
  const currentProjectId = Array.isArray(projectId) ? projectId[0] : projectId;

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        const teamData = await queryDocuments('team', [
          where('organizationId', '==', organizationId),
          where('projectId', '==', currentProjectId)
        ]);
        setTeamMembers(teamData as TeamMember[]);
        
        const orgMembers = await getOrganizationMembers(organizationId);
        setOrganizationMembers(orgMembers);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setError('Failed to load team data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [user, organizationId]);

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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Team Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Team
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your team members and collaborators within {organization.name}
        </p>
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Team Members</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite Team Member
            </button>
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No team members yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Invite team members to collaborate on your projects</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite Team Member
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {teamMembers.map((member) => (
              <li key={member.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {member.photoURL ? (
                      <img 
                        src={member.photoURL} 
                        alt={member.name} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</h4>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
                        try {
                          await deleteDocument('team', member.id);
                          setTeamMembers(teamMembers.filter(m => m.id !== member.id));
                        } catch (error) {
                          console.error('Error removing team member:', error);
                        }
                      }
                    }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite Team Member Modal */}
      {isModalOpen && (
        <InviteTeamMemberModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          organizationId={organizationId}
          projectId={currentProjectId}
          organizationMembers={organizationMembers}
          existingTeamMembers={teamMembers}
          onMemberInvited={(newMember) => {
            setTeamMembers([...teamMembers, newMember]);
          }} 
        />
      )}
    </div>
  );
}

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | undefined;
  projectId: string | undefined;
  organizationMembers: OrganizationMembership[];
  existingTeamMembers: TeamMember[];
  onMemberInvited: (member: TeamMember) => void;
}

function InviteTeamMemberModal({ isOpen, onClose, organizationId, projectId, organizationMembers, existingTeamMembers, onMemberInvited }: InviteTeamMemberModalProps) {
  if (!organizationId || !projectId) return null;
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [role, setRole] = useState('Developer');
  const [customRole, setCustomRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const availableMembers = organizationMembers.filter(orgMember => 
    !existingTeamMembers.some(teamMember => teamMember.userId === orgMember.userId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedMemberId) return;
    
    try {
      setIsSubmitting(true);
      
      const selectedMember = organizationMembers.find(m => m.userId === selectedMemberId);
      if (!selectedMember) return;
      
      const memberData = {
        name: selectedMember.userProfile?.displayName || selectedMember.userProfile?.email || 'Unknown',
        email: selectedMember.userProfile?.email || '',
        photoURL: selectedMember.userProfile?.photoURL,
        role: role === 'Custom' ? customRole : role,
        organizationId,
        projectId,
        userId: selectedMember.userId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      };
      
      await createDocument('team', memberData);
      
      setSelectedMemberId('');
      setRole('Developer');
      setCustomRole('');
      onClose();
      
      onMemberInvited({
        id: `temp-${Date.now()}`,
        ...memberData,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding team member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Team Member</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="member" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Organization Member</label>
            <select
              id="member"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Choose a member...</option>
              {availableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.userProfile?.displayName || member.userProfile?.email || 'Unknown'} 
                  ({member.userProfile?.email}) - {member.role}
                </option>
              ))}
            </select>
            {availableMembers.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                All organization members are already part of this project team.
              </p>
            )}
          </div>
          
          <div>
             <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Role</label>
             <select
               id="role"
               value={role}
               onChange={(e) => setRole(e.target.value)}
               required
               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
             >
               <option value="Developer">Developer</option>
               <option value="Designer">Designer</option>
               <option value="Project Manager">Project Manager</option>
               <option value="QA Engineer">QA Engineer</option>
               <option value="DevOps Engineer">DevOps Engineer</option>
               <option value="Business Analyst">Business Analyst</option>
               <option value="Scrum Master">Scrum Master</option>
               <option value="Product Owner">Product Owner</option>
               <option value="Custom">Custom Role</option>
             </select>
           </div>
           
           {role === 'Custom' && (
             <div>
               <label htmlFor="customRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Role Name</label>
               <input
                 type="text"
                 id="customRole"
                 value={customRole}
                 onChange={(e) => setCustomRole(e.target.value)}
                 required
                 placeholder="Enter custom role name"
                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
               />
             </div>
           )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
               type="submit"
               disabled={isSubmitting || !selectedMemberId || availableMembers.length === 0 || (role === 'Custom' && !customRole.trim())}
               className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isSubmitting ? 'Adding Member...' : 'Add to Team'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}