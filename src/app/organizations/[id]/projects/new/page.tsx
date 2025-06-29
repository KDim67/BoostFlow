'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { createDocument } from '@/lib/firebase/firestoreService';
import { Organization } from '@/lib/types/organization';

/**
 * NewProjectPage Component
 * 
 * A comprehensive project creation page that allows users to:
 * - Create new projects within an organization
 * - Use AI-powered project generation for automated setup
 * - Set project details including dates, budget, and client information
 * - Automatically assign team members (organization owner and project creator)
 * 
 * Features:
 * - Permission-based access control
 * - AI integration for project suggestions
 * - Form validation and error handling
 */
export default function NewProjectPage() {
  // Extract organization ID from URL parameters
  const { id } = useParams();
  
  // State management for component data and UI states
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data fetch
  const [isSubmitting, setIsSubmitting] = useState(false); // Form submission state
  const [error, setError] = useState<string | null>(null); // Error message display
  
  // AI-related state management
  const [aiPrompt, setAiPrompt] = useState(''); // User input for AI project generation
  const [isGenerating, setIsGenerating] = useState(false); // AI generation loading state
  const [showAiSection, setShowAiSection] = useState(false); // Toggle AI section visibility
  
  // Form data state with default values
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning', // Default status for new projects
    startDate: '',
    dueDate: '',
    client: '',
    budget: '',
  });
  
  // Authentication and navigation hooks
  const { user } = useAuth();
  const router = useRouter();
  
  // Handle array or string organization ID from URL params
  const organizationId = Array.isArray(id) ? id[0] : id;

  /**
   * Effect hook to fetch organization data and verify user permissions
   * Runs when user or organizationId changes
   */
  useEffect(() => {
    const fetchOrganizationData = async () => {
      // Early return if required data is missing
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user has minimum 'member' permission to create projects
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'member');
        
        if (!permission) {
          setError('You do not have permission to create projects in this organization.');
          setIsLoading(false);
          return;
        }
        
        // Fetch organization details for display
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setError('Failed to load organization data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizationData();
  }, [user, organizationId]);

  /**
   * Generic form input handler for all form fields
   * Updates formData state with new values while preserving other fields
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * AI-powered project generation function
   * Sends user prompt to AI service and populates form with generated suggestions
   * 
   * Side effects:
   * - Updates form data with AI suggestions
   * - Hides AI section and clears prompt on success
   * - Shows error message on failure
   */
  const generateProjectWithAI = async () => {
    // Validate that prompt is not empty
    if (!aiPrompt.trim()) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Call AI project generator API with user prompt and organization context
      const response = await fetch('/api/ai/project-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          organizationName: organization?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate project');
      }

      const suggestion = await response.json();

      // Update form with AI-generated suggestions, preserving existing values as fallback
      setFormData(prev => ({
        ...prev,
        name: suggestion.name || '',
        description: suggestion.description || '',
        status: suggestion.suggestedStatus || 'planning'
      }));

      // Clean up AI section after successful generation
      setShowAiSection(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating project:', error);
      setError('Failed to generate project with AI. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Form submission handler for project creation
   * 
   * Process:
   * 1. Creates the project document in Firestore
   * 2. Automatically adds organization owner as Project Manager (if different from creator)
   * 3. Adds project creator as Project Lead
   * 4. Redirects to the newly created project page
   * 
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required dependencies
    if (!user || !organization) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Prepare project data with metadata
      const projectData = {
        ...formData,
        organizationId,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: 0, // Initialize project progress
      };
      
      // Create project document and get generated ID
      const projectId = await createDocument('projects', projectData);
      
      // Automatically set up initial team members
      if (organizationId && projectId) {
        try {
          // Dynamic imports to reduce initial bundle size
          const { getOrganizationMembers } = await import('@/lib/firebase/organizationService');
          const { createDocument: createTeamDocument } = await import('@/lib/firebase/firestoreService');
          const { serverTimestamp } = await import('firebase/firestore');

          const orgMembers = await getOrganizationMembers(organizationId);
          const owner = orgMembers.find(member => member.role === 'owner');

          // Add organization owner as Project Manager
          if (owner && owner.userId !== user.uid) {
            const ownerTeamData = {
              name: owner.userProfile?.displayName || owner.userProfile?.email || 'Organization Owner',
              email: owner.userProfile?.email || '',
              photoURL: owner.userProfile?.photoURL,
              role: 'Project Manager', // Owner gets manager role by default
              organizationId,
              projectId,
              userId: owner.userId,
              createdBy: user.uid,
              createdAt: serverTimestamp(),
            };
            await createTeamDocument('team', ownerTeamData);
          }

          // Add project creator as Project Lead
          const creatorTeamData = {
            name: user.displayName || user.email || 'Project Creator',
            email: user.email || '',
            photoURL: user.photoURL,
            role: 'Project Lead', // Creator gets lead role by default
            organizationId,
            projectId,
            userId: user.uid,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
          };
          await createTeamDocument('team', creatorTeamData);

        } catch (teamError) {
          // Non-critical error: project created successfully but team setup failed
          console.error('Error adding automatic team members:', teamError);
          // Continue with redirect despite team setup failure
        }
      }

      // Navigate to the newly created project page
      router.push(`/organizations/${organizationId}/projects/${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
      setIsSubmitting(false); // Re-enable form on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
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
          The organization you're looking for doesn't exist or you don't have permission to create projects in it.
        </p>
        <Link 
          href={`/organizations/${organizationId}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Organization
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Create New Project
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Add a new project to {organization.name}
        </p>
      </div>

      {/* AI Generation Section */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  AI Project Generator
                </h2>
                <p className="text-purple-100 text-sm">
                  Let AI help you create the perfect project structure
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAiSection(!showAiSection)}
              className={`bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-purple-600 shadow-md hover:shadow-lg ${showAiSection ? 'ring-2 ring-white/30' : ''}`}
              aria-label={showAiSection ? 'Hide AI Generator' : 'Show AI Generator'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <span className="font-medium">{showAiSection ? 'Hide Generator' : 'Use AI Generator'}</span>
            </button>
          </div>
        </div>

        {showAiSection && (
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    AI-Powered Project Creation
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Describe your project idea and our AI will generate a comprehensive project name, description, and initial structure for you.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Describe your project idea
              </label>
              <textarea
                id="aiPrompt"
                value={aiPrompt}
                onChange={(e) => {
                  const value = e.target.value;
                  // Enforce 500 character limit for AI prompt
                  if (value.length <= 500) {
                    setAiPrompt(value);
                  }
                }}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                placeholder="e.g., 'A mobile app for tracking fitness goals with social features and gamification elements' or 'Website redesign for an e-commerce platform to improve user experience and conversion rates'"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Be as detailed as possible for better AI suggestions
                </p>
                <span className={`text-xs ${aiPrompt.length > 400 ? 'text-red-600 dark:text-red-400' : aiPrompt.length > 50 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {aiPrompt.length}/500 characters
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={generateProjectWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Generating Project...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter project name"
            />
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Describe the project"
            />
          </div>

          {/* Project Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Project Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                min={formData.startDate || undefined} // Prevent due date before start date
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Client and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client
              </label>
              <input
                type="text"
                id="client"
                name="client"
                value={formData.client}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Client name or organization"
              />
            </div>
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget
              </label>
              <input
                type="text"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Project budget"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Link
              href={`/organizations/${organizationId}/projects`}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}