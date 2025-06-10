import { useState } from 'react';
import { useAuth } from '@/lib/firebase/useAuth';

interface UploadOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const uploadProfilePicture = async (file: File, options?: UploadOptions) => {
    if (!user) {
      options?.onError?.('User not authenticated');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = await user.getIdToken();
      
      const response = await fetch('/api/upload/profile-picture', {
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

  const uploadProjectDocument = async (
    file: File,
    projectId: string,
    organizationId: string,
    folder?: string,
    options?: UploadOptions
  ) => {
    if (!user) {
      options?.onError?.('User not authenticated');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('organizationId', organizationId);
      if (folder) {
        formData.append('folder', folder);
      }

      const token = await user.getIdToken();
      
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

  const uploadOrganizationLogo = async (file: File, organizationId: string, options?: UploadOptions) => {
    if (!user) {
      options?.onError?.('User not authenticated');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);

      const token = await user.getIdToken();
      
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

  return {
    uploading,
    progress,
    uploadProfilePicture,
    uploadProjectDocument,
    uploadOrganizationLogo,
  };
}