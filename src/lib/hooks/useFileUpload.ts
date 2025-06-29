import { useState } from 'react';
import { useAuth } from '@/lib/firebase/useAuth';

/**
 * Configuration options for file upload operations
 * Provides callback functions for handling upload lifecycle events
 */
interface UploadOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

/**
 * Custom React hook for handling file uploads to different endpoints
 * Manages upload state, progress tracking, and authentication
 * 
 * @returns Object containing upload state and upload functions
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false); // Tracks if any upload is in progress
  const [progress, setProgress] = useState(0); // Upload progress percentage (0-100)
  const { user } = useAuth(); // Current authenticated user

  /**
   * Uploads a profile picture for the current user
   * 
   * @param file - The image file to upload
   * @param options - Optional callbacks for upload events
   * @returns Promise resolving to upload result or undefined on error
   */
  const uploadProfilePicture = async (file: File, options?: UploadOptions) => {
    // Ensure user is authenticated before proceeding
    if (!user) {
      options?.onError?.('User not authenticated');
      return;
    }

    // Initialize upload state
    setUploading(true);
    setProgress(0);

    try {
      // Prepare multipart form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Get fresh authentication token for API request
      const token = await user.getIdToken();
      
      // Send file to profile picture upload endpoint
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      // Check if upload was successful
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Mark upload as complete and notify success
      setProgress(100);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      // Handle and propagate upload errors
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options?.onError?.(errorMessage);
      throw error;
    } finally {
      // Reset upload state regardless of success/failure
      setUploading(false);
      // Clear progress after a brief delay for UX
      setTimeout(() => setProgress(0), 1000);
    }
  };

  /**
   * Uploads a document to a specific project within an organization
   * 
   * @param file - The document file to upload
   * @param projectId - ID of the target project
   * @param organizationId - ID of the organization containing the project
   * @param folder - Optional folder path within the project
   * @param options - Optional callbacks for upload events
   * @returns Promise resolving to upload result or undefined on error
   */
  const uploadProjectDocument = async (
    file: File,
    projectId: string,
    organizationId: string,
    folder?: string,
    options?: UploadOptions
  ) => {
    // Ensure user is authenticated before proceeding
    if (!user) {
      options?.onError?.('User not authenticated');
      return;
    }

    // Initialize upload state
    setUploading(true);
    setProgress(0);

    try {
      // Prepare form data with file and project metadata
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('organizationId', organizationId);
      // Add optional folder path if specified
      if (folder) {
        formData.append('folder', folder);
      }

      // Get fresh authentication token for API request
      const token = await user.getIdToken();
      
      // Send file to project documents upload endpoint
      const response = await fetch('/api/upload/project-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setProgress(100);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options?.onError?.(errorMessage);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  /**
   * Uploads a logo image for an organization
   * 
   * @param file - The logo image file to upload
   * @param organizationId - ID of the target organization
   * @param options - Optional callbacks for upload events
   * @returns Promise resolving to upload result or undefined on error
   */
  const uploadOrganizationLogo = async (file: File, organizationId: string, options?: UploadOptions) => {
    // Ensure user is authenticated before proceeding
    if (!user) {
      options?.onError?.('User not authenticated');
      return;
    }

    // Initialize upload state
    setUploading(true);
    setProgress(0);

    try {
      // Prepare form data with logo file and organization ID
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);

      // Get fresh authentication token for API request
      const token = await user.getIdToken();
      
      // Send file to organization logo upload endpoint
      const response = await fetch('/api/upload/organization-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setProgress(100);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      options?.onError?.(errorMessage);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  // Return hook interface with state and upload functions
  return {
    uploading, // Boolean indicating if any upload is in progress
    progress, // Current upload progress (0-100)
    uploadProfilePicture, // Function to upload user profile pictures
    uploadProjectDocument, // Function to upload project documents
    uploadOrganizationLogo, // Function to upload organization logos
  };
}