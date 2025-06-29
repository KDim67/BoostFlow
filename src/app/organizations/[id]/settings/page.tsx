'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission, updateOrganization, getOrganizationMembers, updateOrganizationMembership } from '@/lib/firebase/organizationService';
import { Organization, OrganizationMembership } from '@/lib/types/organization';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import ImageCropper, { getCroppedImg } from '@/components/ui/ImageCropper';

/**
 * OrganizationSettings Component
 * 
 * Provides a comprehensive settings interface for organization owners to:
 * - Update organization profile information (name, description, logo, website, email)
 * - Transfer ownership to another member
 * - Delete the organization (with confirmation)
 * - Manage organization branding with logo upload and cropping
 * 
 * Security: Only organization owners can access these settings
 * Features: Real-time validation, image cropping, confirmation modals for destructive actions
 */

export default function OrganizationSettings() {
  const { id } = useParams();
  
  // Core organization data and UI state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form data for organization profile updates
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    email: '',
    notificationSettings: {}
  });
  
  // Organization members data for ownership transfer
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  
  // Ownership transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  
  // Organization deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Image upload and cropping state
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // External hooks and services
  const { user } = useAuth();
  const { uploading, uploadOrganizationLogo } = useFileUpload();
  
  // Extract organization ID from URL params (handle both string and array cases)
  const organizationId = Array.isArray(id) ? id[0] : id;

  /**
   * Main data fetching effect
   * 
   * Handles:
   * 1. Permission verification (owner-only access)
   * 2. Organization data loading
   * 3. Form data initialization
   * 4. Members data loading for ownership transfer
   * 
   * Security: Validates user has 'owner' permission before allowing access
   */
  useEffect(() => {
    const fetchSettingsData = async () => {
      // Early return if user not authenticated or no organization ID
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Only organization owners can access settings
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'owner');
        
        if (!permission) {
          setError('You do not have permission to manage settings for this organization. Only organization owners can access settings.');
          setIsLoading(false);
          return;
        }
        
        // Fetch organization data and populate form
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        if (orgData) {
          // Initialize form data with current organization values
          setFormData({
            name: orgData.name || '',
            description: orgData.description || '',
            logoUrl: orgData.logoUrl || '',
            website: orgData.website || '',
            email: orgData.email || '',
            notificationSettings: orgData.notificationSettings || {}
          });
        }

        // Load organization members for ownership transfer functionality
        const membersData = await getOrganizationMembers(organizationId);
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching settings data:', error);
        setError('Failed to load settings data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettingsData();
  }, [user, organizationId]);

  /**
   * Handles form input changes for basic organization fields
   * Supports text inputs, textareas, selects, and checkboxes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  /**
   * Handles notification settings changes
   * Updates nested notification settings object while preserving other settings
   */
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [name]: checked
      }
    }));
  };

  /**
   * Handles logo file selection and initiates the cropping workflow
   * Creates a preview URL and opens the image cropper modal
   */
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a preview URL for the selected image
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setShowImageCropper(true);
  };

  /**
   * Handles the completion of image cropping
   * 
   * Workflow:
   * 1. Converts cropped area to blob
   * 2. Creates a new File object
   * 3. Uploads to storage
   * 4. Updates local state and dispatches global event
   * 5. Cleans up temporary resources
   */
  const handleCropComplete = async (croppedAreaPixels: any) => {
    if (!selectedImage || !organizationId) return;

    try {
      // Get the cropped image as a blob
      const croppedImageBlob = await getCroppedImg(selectedImage, croppedAreaPixels, 0);

      // Convert blob to file
      const croppedFile = new File([croppedImageBlob], 'organization-logo.jpg', {
        type: 'image/jpeg'
      });

      // Upload the cropped image
      const result = await uploadOrganizationLogo(croppedFile, organizationId, {
        onSuccess: (result) => {
          // Update form data with new logo URL
          setFormData(prev => ({
            ...prev,
            logoUrl: result.url
          }));
          // Update organization state
          if (organization) {
            setOrganization({
              ...organization,
              logoUrl: result.url
            });
          }
          // Dispatch event to update organization logo across the app
          window.dispatchEvent(new CustomEvent('organizationLogoUpdated', {
            detail: { organizationId, logoUrl: result.url }
          }));
          setShowImageCropper(false);
          setSelectedImage(null);
          // Clean up the preview URL
          if (selectedImage) {
            URL.revokeObjectURL(selectedImage);
          }
        },
        onError: (error) => {
          console.error('Logo upload failed:', error);
          setError('Failed to upload logo. Please try again.');
          setShowImageCropper(false);
          setSelectedImage(null);
        }
      });
    } catch (error) {
      console.error('Logo crop/upload error:', error);
      setError('Failed to process logo. Please try again.');
      setShowImageCropper(false);
      setSelectedImage(null);
    }
  };

  /**
   * Handles cancellation of image cropping
   * Cleans up temporary preview URL and resets state
   */
  const handleCropCancel = () => {
    setShowImageCropper(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      // Handle logo removal if logoUrl was cleared
      if (organization?.logoUrl && !formData.logoUrl) {
        const response = await fetch(`/api/upload/organization-logo/remove`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizationId }),
        });

        if (!response.ok) {
          throw new Error('Failed to remove organization logo');
        }

        // Dispatch event to update organization logo across the app
        window.dispatchEvent(new CustomEvent('organizationLogoUpdated', {
          detail: { organizationId, logoUrl: '' }
        }));
      }

      // Update organization data in database
      await updateOrganization(organizationId, {
        name: formData.name,
        description: formData.description
      });

      // Update local organization state to reflect changes immediately
      if (organization) {
        setOrganization({
          ...organization,
          name: formData.name,
          description: formData.description,
          logoUrl: formData.logoUrl
        });
      }

      // Show success message and auto-hide after 5 seconds
      setSuccessMessage('Organization settings saved successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error saving organization settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles ownership transfer to another organization member
   * 
   * Critical security operation that:
   * 1. Validates both current owner and new owner memberships exist
   * 2. Demotes current owner to admin role
   * 3. Promotes selected member to owner role
   * 4. Updates local state to reflect changes
   * 
   */
  const handleTransferOwnership = async () => {
    if (!selectedNewOwner || !organizationId || !user) return;

    setIsTransferring(true);
    setError(null);

    try {
      // Find current owner and new owner memberships
      const currentOwnerMembership = members.find(m => m.userId === user.uid && m.role === 'owner');
      const newOwnerMembership = members.find(m => m.userId === selectedNewOwner);

      // Validate both memberships exist before proceeding
      if (!currentOwnerMembership || !newOwnerMembership) {
        throw new Error('Invalid ownership transfer');
      }

      // Perform the role swap, current owner becomes admin, selected member becomes owner
      await updateOrganizationMembership(currentOwnerMembership.id, { role: 'admin' });
      await updateOrganizationMembership(newOwnerMembership.id, { role: 'owner' });

      // Update local members state to reflect the role changes
      const updatedMembers = members.map(member => {
        if (member.id === currentOwnerMembership.id) {
          return { ...member, role: 'admin' as const };
        }
        if (member.id === newOwnerMembership.id) {
          return { ...member, role: 'owner' as const };
        }
        return member;
      });

      setMembers(updatedMembers);
      setShowTransferModal(false);
      setSelectedNewOwner('');
      setSuccessMessage('Ownership transferred successfully!');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error transferring ownership:', error);
      setError('Failed to transfer ownership. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  /**
   * Handles permanent deletion of the organization
   * 
   */
  const handleDeleteOrganization = async () => {
    if (!user || !organizationId || !organization) return;
    if (deleteConfirmText !== organization.name) {
      setError('Organization name does not match. Please type the exact name.');
      return;
    }

    setIsDeleting(true);
    try {
      // Get the user's ID token for authentication
      const token = await user.getIdToken();
      
      // Call the delete API endpoint
      const response = await fetch('/api/organizations/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }
      
      setSuccessMessage('Organization deleted successfully!');
      setShowDeleteModal(false);

      // Redirect to organizations list after brief delay
      setTimeout(() => {
        window.location.href = '/organizations';
      }, 2000);
    } catch (error) {
      console.error('Error deleting organization:', error);
      setError('Failed to delete organization. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Filters organization members to find those eligible for ownership transfer
   * 
   * Criteria:
   * - Must have 'active' status
   * - Cannot be current owner
   * - Cannot be the current user (can't transfer to self)
   */
  const getEligibleMembers = () => {
    return members.filter(member =>
      member.status === 'active' &&
      member.role !== 'owner' &&
      member.userId !== user?.uid
    );
  };

  /**
   * Gets a user-friendly display name for a member
   * Falls back through displayName -> email -> 'Unknown User'
   */
  const getDisplayName = (member: OrganizationMembership) => {
    return member.userProfile?.displayName || member.userProfile?.email || 'Unknown User';
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
      {/* Settings Header */}
      <div className={`rounded-xl p-8 shadow-lg border ${
        organization?.logoUrl 
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-blue-100 dark:border-gray-600'
      }`}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Organization Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Manage your organization's profile, security, and configuration
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <nav className="-mb-px flex space-x-1 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-4 rounded-t-lg transition-all duration-200 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} font-medium`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-4 px-4 rounded-t-lg transition-all duration-200 ${activeTab === 'advanced' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} font-medium`}
            >
              Advanced
            </button>
          </nav>
        </div>

        <div className="p-8">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Organization Profile</h2>
                <p className="text-gray-600 dark:text-gray-400">Update your organization's basic information and branding.</p>
              </div>
              
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-green-700 dark:text-green-300 font-medium">{successMessage}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      required
                      placeholder="Enter organization name"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="Describe your organization"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Organization Logo
                    </label>
                    <div className="space-y-4">
                      {/* Current Logo Preview */}
                      {formData.logoUrl && (
                        <div className="flex items-center space-x-4">
                          <img
                            src={formData.logoUrl}
                            alt="Organization logo"
                            className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                          />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Current logo</p>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove logo
                            </button>
                          </div>
                        </div>
                      )}

                      {/* File Upload */}
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          id="logoUpload"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <label
                          htmlFor="logoUpload"
                          className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            uploading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </label>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 5MB
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSaving ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}



          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Advanced Settings</h2>
                <p className="text-gray-600 dark:text-gray-400">Configure advanced options and manage organization lifecycle.</p>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-6">
                  These actions are destructive and cannot be undone. Please proceed with extreme caution.
                </p>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(true)}
                    className="w-full sm:w-auto px-6 py-3 border-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 font-medium"
                  >
                    Transfer Ownership
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full sm:w-auto px-6 py-3 border-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 font-medium ml-0 sm:ml-3"
                  >
                    Delete Organization
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Transfer Ownership
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Select a member to transfer ownership to. This action cannot be undone.
              </p>

              <div className="mb-6">
                <label htmlFor="newOwner" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Owner
                </label>
                <select
                  id="newOwner"
                  value={selectedNewOwner}
                  onChange={(e) => setSelectedNewOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a member...</option>
                  {getEligibleMembers().map((member) => (
                    <option key={member.id} value={member.userId}>
                      {getDisplayName(member)} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedNewOwner('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransferOwnership}
                  disabled={!selectedNewOwner || isTransferring}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTransferring ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Transferring...
                    </span>
                  ) : 'Transfer Ownership'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Organization Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                Delete Organization
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This action cannot be undone. This will permanently delete the organization, all its projects, and remove all members.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Please type <strong>{organization?.name}</strong> to confirm:
              </p>

              <div className="mb-6">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type organization name here"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOrganization}
                  disabled={deleteConfirmText !== organization?.name || isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : 'Delete Organization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showImageCropper && selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          cropShape="round"
          title="Crop Organization Logo"
        />
      )}
    </div>
  );
}