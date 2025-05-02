import { useState } from 'react';
import { uploadDocument, Document } from '@/lib/services/automation/documentService';

interface DocumentUploadProps {
  onUploadComplete?: (document: Document) => void;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  projectId?: string;
}

export default function DocumentUpload({
  onUploadComplete,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  projectId
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      setFile(null);
      return;
    }
    
    // Validate file size
    if (maxSize > 0 && selectedFile.size > maxSize) {
      setError(`File is too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      // Add metadata if projectId is provided
      const metadata: Record<string, any> = {};
      if (projectId) {
        metadata.projectId = projectId;
      }
      
      const uploadedDocument = await uploadDocument(file, metadata);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(uploadedDocument);
      }
      
      // Reset the form
      setFile(null);
      if (document.getElementById('file-upload') as HTMLInputElement) {
        (document.getElementById('file-upload') as HTMLInputElement).value = '';
      }
      
    } catch (err) {
      setError('An error occurred during upload. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Document</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:border-gray-600">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {allowedTypes.join(', ')} (Max: {maxSize / (1024 * 1024)}MB)
              </p>
            </div>
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              disabled={uploading}
              accept={allowedTypes.join(',')}
            />
          </label>
        </div>
        
        {file && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              disabled={uploading}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        {uploading && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-2.5 px-5 text-sm font-medium text-white rounded-lg transition-colors ${!file || uploading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-md'}`}
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </div>
  );
}