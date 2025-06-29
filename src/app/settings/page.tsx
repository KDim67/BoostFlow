'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/firebase/useAuth';
import { sendVerificationEmail } from '@/lib/firebase/authService';
import { getUserProfile, updateUserProfile, UserProfile } from '@/lib/firebase/userProfileService';
import { updatePassword, updateProfile, updateEmail, verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import PersonalIntegrations from '@/components/dashboard/PersonalIntegrations';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import ImageCropper, { getCroppedImg } from '@/components/ui/ImageCropper';

/**
 * Interface defining the structure of form data for user settings
 * Includes personal information, security settings, and preferences
 */
interface SettingsFormData {
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  newEmail: string;
  websiteNotifications: boolean;
  profilePicture: string;
}

/**
 * Main settings page component that provides user account management functionality
 * Includes tabs for account info, security settings, notifications, and integrations
 */
export default function SettingsPage() {
  // Authentication state and navigation
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // UI state management
  const [activeTab, setActiveTab] = useState('account'); // Currently active settings tab
  const [loading, setLoading] = useState(true); // Initial page loading state
  const [saving, setSaving] = useState(false); // General saving state for forms
  
  // User data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // File upload functionality
  const fileInputRef = useRef<HTMLInputElement>(null); // Reference to hidden file input
  const { uploading, uploadProfilePicture } = useFileUpload();
  
  // Form data state
  const [formData, setFormData] = useState<SettingsFormData>({
    displayName: '',
    email: '',
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: '',
    websiteNotifications: true,
    profilePicture: ''
  });
  
  // UI feedback and loading states
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Image cropping functionality
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Temporary image URL for cropping

  /**
   * Effect hook to handle authentication state and load user profile data
   * Redirects to login if user is not authenticated, otherwise fetches profile
   */
  useEffect(() => {
    // Redirect to login if authentication is complete but no user found
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Wait for authentication to complete before proceeding
    if (!user) {
      return; // Still loading, don't fetch profile yet
    }

    /**
     * Fetches user profile data from the database and populates form fields
     * Handles both Firebase Auth user data and custom profile data
     */
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
          // Populate form with existing profile data, using fallbacks for missing fields
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

  /**
   * Generic handler for updating form field values
   * @param field - The form field to update
   * @param value - The new value (string or boolean)
   */
  const handleInputChange = (field: keyof SettingsFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handles profile picture file selection and initiates the cropping process
   * Creates a temporary object URL for the image cropper component
   */
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create object URL for the selected image to display in cropper
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setShowImageCropper(true);

    // Reset file input to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handles the completion of image cropping and uploads the processed image
   * Converts cropped area to blob, uploads to storage, and updates user profile
   * @param croppedAreaPixels - Pixel coordinates of the cropped area
   */
  const handleCropComplete = async (croppedAreaPixels: any) => {
    try {
      if (!selectedImage) return;

      // Convert the cropped area to a blob for upload
      const croppedImageBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const croppedFile = new File([croppedImageBlob], 'profile-picture.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload the cropped image with success/error callbacks
      const result = await uploadProfilePicture(croppedFile, {
        onSuccess: async (result) => {
          // Update local form state with new image URL
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

      // Clean up cropper state and temporary image URL
      setShowImageCropper(false);
      setSelectedImage(null);
      URL.revokeObjectURL(selectedImage); // Prevent memory leaks
    } catch (error) {
      console.error('Crop error:', error);
      setMessage({ type: 'error', text: 'Failed to process image' });
    }
  };

  /**
   * Handles cancellation of the image cropping process
   * Cleans up temporary image URL and resets cropper state
   */
  const handleCropCancel = () => {
    setShowImageCropper(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage); // Clean up memory
      setSelectedImage(null);
    }
  };

  /**
   * Removes the user's profile picture from both storage and database
   * Makes API call to delete file from MinIO storage and updates profile
   */
  const handleRemoveProfilePicture = async () => {
    if (!user) return;

    try {
      // Optimistically update UI first
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

  /**
   * Handles saving account information (name, display name, profile picture)
   * Updates both Firebase Auth profile and custom user profile in database
   */
  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // Update Firebase Auth profile with display name
      await updateProfile(user, {
        displayName: formData.displayName
      });

      // Update custom user profile in database with additional fields
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
      setSaving(false); // Fixed: should be setSaving, not setPasswordLoading
    }
  };

  /**
   * Handles password change with validation and error handling
   * Validates password match and length before attempting update
   */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side validation: ensure passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    // Client-side validation: enforce minimum password length
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setPasswordLoading(true);
    setMessage(null);

    try {
      // Update password in Firebase Auth
      await updatePassword(user, formData.newPassword);
      
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setMessage({ type: 'success', text: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      // Handle specific Firebase Auth errors with user-friendly messages
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Please log out and log back in before changing your password' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update password' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  /**
   * Handles saving notification preferences to user profile
   * Updates nested settings object in the database
   */
  const handleNotificationsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // Update nested settings structure in user profile
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

  /**
   * Sends email verification to the current user's email address
   * Used when user's email is not yet verified
   */
  const handleSendVerificationEmail = async () => {
    if (!user) return;

    setSendingVerification(true);
    setMessage(null);

    try {
      await sendVerificationEmail(user);
      setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      setMessage({ type: 'error', text: 'Failed to send verification email. Please try again.' });
    } finally {
      setSendingVerification(false);
    }
  };

  /**
   * Handles email address change with reauthentication and verification
   * Requires current password and sends verification email to new address
   * Email is only updated after user clicks verification link
   */
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields are present
    if (!user || !formData.newEmail || !formData.currentPassword) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setChangingEmail(true);
    setMessage(null);

    try {
      // Reauthenticate user before changing email
      const credential = EmailAuthProvider.credential(user.email!, formData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Use verifyBeforeUpdateEmail to send verification email first
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://boostflow.me'}/auth-handler/auth/action`,
        handleCodeInApp: true, // Handle verification in the app
      };
      
      await verifyBeforeUpdateEmail(user, formData.newEmail, actionCodeSettings);

      // Clear form fields after successful verification email send
      setFormData(prev => ({
        ...prev,
        newEmail: '',
        currentPassword: ''
      }));

      setMessage({ 
        type: 'success', 
        text: `Verification email sent to ${formData.newEmail}! Please check your inbox and click the verification link to complete the email change. Your email will be updated automatically after verification.` 
      });
    } catch (error: any) {
      console.error('Error updating email:', error);
      
      // Handle specific Firebase Auth errors with user-friendly messages
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'Current password is incorrect' });
      } else if (error.code === 'auth/email-already-in-use') {
        setMessage({ type: 'error', text: 'This email is already in use by another account' });
      } else if (error.code === 'auth/invalid-email') {
        setMessage({ type: 'error', text: 'Please enter a valid email address' });
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Please log out and log back in before changing your email' });
      } else if (error.code === 'auth/too-many-requests') {
        setMessage({ type: 'error', text: 'Too many failed attempts. Please try again later.' });
      } else {
        setMessage({ type: 'error', text: `Failed to send verification email: ${error.message || 'Please try again.'}` });
      }
    } finally {
      setChangingEmail(false);
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
                        To change your email address, go to the Security tab
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
              <div className="space-y-8">
                {/* Email Verification Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Email Verification
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Current Email: {user?.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Status: {user?.emailVerified ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">✓ Verified</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 font-medium">⚠ Not Verified</span>
                          )}
                        </p>
                      </div>
                      {!user?.emailVerified && (
                        <button
                          type="button"
                          onClick={handleSendVerificationEmail}
                          disabled={sendingVerification}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingVerification ? 'Sending...' : 'Send Verification Email'}
                        </button>
                      )}
                    </div>
                    {!user?.emailVerified && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Important:</strong> Please verify your email address to ensure account security and receive important notifications.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Change Email Section */}
                <form onSubmit={handleEmailChange} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Change Email Address
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          New Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.newEmail}
                          onChange={(e) => handleInputChange('newEmail', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter current password to confirm"
                        />
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> After changing your email, you'll need to verify the new address before you can use it to sign in.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={changingEmail || !formData.newEmail || !formData.currentPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingEmail ? 'Updating...' : 'Update Email'}
                    </button>
                  </div>
                </form>

                {/* Change Password Section */}
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
                      disabled={passwordLoading || !formData.newPassword || !formData.confirmPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
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