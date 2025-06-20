'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/firebase/useAuth';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/firebase/userProfileService';
import { updatePassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import PersonalIntegrations from '@/components/dashboard/PersonalIntegrations';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import ImageCropper, { getCroppedImg } from '@/components/ui/ImageCropper';

interface SettingsFormData {
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  websiteNotifications: boolean;
  profilePicture: string;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadProfilePicture } = useFileUpload();
  const [formData, setFormData] = useState<SettingsFormData>({
    displayName: '',
    email: '',
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    websiteNotifications: true,
    profilePicture: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!user) {
      return; // Still loading, don't fetch profile yet
    }

    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
          setFormData(prev => ({
            ...prev,
            displayName: profile.displayName || '',
            email: profile.email || '',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            profilePicture: profile.profilePicture || '',
            websiteNotifications: profile.settings?.notifications?.website ?? true,
          }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setMessage({ type: 'error', text: 'Failed to load user profile' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, router]);

  const handleInputChange = (field: keyof SettingsFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create object URL for the selected image
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setShowImageCropper(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedAreaPixels: any) => {
    try {
      if (!selectedImage) return;

      const croppedImageBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const croppedFile = new File([croppedImageBlob], 'profile-picture.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const result = await uploadProfilePicture(croppedFile, {
        onSuccess: async (result) => {
          setFormData(prev => ({ ...prev, profilePicture: result.url }));

          // Update the user profile in the database
          if (user) {
            try {
              await updateUserProfile(user.uid, {
                profilePicture: result.url,
              });

              // Trigger navbar refresh by dispatching a custom event
              window.dispatchEvent(new CustomEvent('profilePictureUpdated', {
                detail: { profilePicture: result.url }
              }));

              setMessage({ type: 'success', text: 'Profile picture updated successfully' });
            } catch (error) {
              console.error('Error updating profile picture in database:', error);
              setMessage({ type: 'error', text: 'Failed to save profile picture' });
            }
          }
        },
        onError: (error) => {
          setMessage({ type: 'error', text: error });
        },
      });

      setShowImageCropper(false);
      setSelectedImage(null);
      URL.revokeObjectURL(selectedImage);
    } catch (error) {
      console.error('Crop error:', error);
      setMessage({ type: 'error', text: 'Failed to process image' });
    }
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user) return;

    try {
      setFormData(prev => ({ ...prev, profilePicture: '' }));

      // Call API to remove profile picture and delete file from MinIO
      const token = await user.getIdToken();
      const response = await fetch('/api/upload/profile-picture/remove', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove profile picture');
      }

      // Trigger navbar refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', {
        detail: { profilePicture: '' }
      }));

      setMessage({ type: 'success', text: 'Profile picture removed' });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setMessage({ type: 'error', text: 'Failed to remove profile picture' });
    }
  };





  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateProfile(user, {
        displayName: formData.displayName
      });

      await updateUserProfile(user.uid, {
        displayName: formData.displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        profilePicture: formData.profilePicture,
      });

      setMessage({ type: 'success', text: 'Account information updated successfully' });
    } catch (error) {
      console.error('Error updating account:', error);
      setMessage({ type: 'error', text: 'Failed to update account information' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await updatePassword(user, formData.newPassword);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setMessage({ type: 'success', text: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Please log out and log back in before changing your password' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update password' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateUserProfile(user.uid, {
        settings: {
          notifications: {
            website: formData.websiteNotifications
          }
        }
      });
      setMessage({ type: 'success', text: 'Notification preferences updated successfully' });
    } catch (error) {
      console.error('Error updating notifications:', error);
      setMessage({ type: 'error', text: 'Failed to update notification preferences' });
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account preferences and security settings
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'account', label: 'Account' },
                { id: 'security', label: 'Security' },
                { id: 'notifications', label: 'Notifications' },
                { id: 'integrations', label: 'Integrations' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <form onSubmit={handleAccountSave} className="space-y-6">
                <div>

                  
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg ring-4 ring-white dark:ring-gray-800 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                        {formData.profilePicture ? (
                          <img
                            src={formData.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />

                    </div>
                    
                    <div className="mt-4 text-center">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formData.displayName || `${formData.firstName} ${formData.lastName}`.trim() || 'User'}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formData.email}
                      </p>
                    </div>
                    
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {uploading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        disabled={!formData.profilePicture || uploading}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> If you haven't logged in recently, you may need to log out and log back in before changing your password.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !formData.newPassword || !formData.confirmPassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleNotificationsSave} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Website Notifications
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Show notification tab in the navigation bar
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.websiteNotifications}
                          onChange={(e) => handleInputChange('websiteNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div>
                <PersonalIntegrations currentUser={user?.uid || ''} />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showImageCropper && selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          cropShape="round"
          title="Crop Profile Picture"
        />
      )}
    </div>
  );
}