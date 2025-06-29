'use client';

import { useState, useRef } from 'react';
import { useFileUpload } from '@/lib/hooks/useFileUpload';

/**
 * Props interface for the DocumentUploadModal component
 * Defines the required properties for document upload functionality
 */
interface DocumentUploadModalProps {
  isOpen: boolean; // Controls modal visibility
  onClose: () => void; // Callback to close the modal
  projectId: string; // Target project identifier
  organizationId: string; // Organization context for the upload
  folders: string[]; // Available folder options for document organization
  onUploadSuccess: (document: any) => void; // Callback fired when upload completes successfully
}

/**
 * Modal component for uploading documents to a project
 * Supports both drag-and-drop and click-to-select file upload methods
 * Organizes documents into folders within the project structure
 */
export default function DocumentUploadModal({
  isOpen,
  onClose,
  projectId,
  organizationId,
  folders,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  // Default folder selection - 'General' is the fallback folder
  const [selectedFolder, setSelectedFolder] = useState('General');
  // Tracks drag-and-drop UI state for visual feedback
  const [dragActive, setDragActive] = useState(false);
  // Reference to hidden file input for programmatic file selection
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Custom hook providing upload functionality and progress tracking
  const { uploading, progress, uploadProjectDocument } = useFileUpload();

  /**
   * Handles file selection and initiates upload process
   * Supports both drag-and-drop and file input selection
   * @param files - FileList from input or drag event
   */
  const handleFileSelect = async (files: FileList | null) => {
    // Early return if no files selected
    if (!files || files.length === 0) return;

    // Only process the first file (single file upload)
    const file = files[0];
    
    try {
      // Upload document with project context and folder organization
      await uploadProjectDocument(
        file,
        projectId,
        organizationId,
        selectedFolder,
        {
          onSuccess: (result) => {
            // Notify parent component of successful upload
            onUploadSuccess(result.document);
            // Close modal after successful upload
            onClose();
          },
          onError: (error) => {
            console.error('Upload error:', error);
            // Show user-friendly error message
            alert(`Upload failed: ${error}`);
          },
        }
      );
    } catch (error) {
      // Handle any unexpected errors during upload process
      console.error('Upload error:', error);
    }
  };

  /**
   * Handles drag events for drag-and-drop functionality
   * Manages visual feedback during drag operations
   * @param e - React drag event
   */
  const handleDrag = (e: React.DragEvent) => {
    // Prevent default browser behavior for file drops
    e.preventDefault();
    e.stopPropagation();
    
    // Update drag state based on event type for visual feedback
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handles file drop events when user drops files onto the drop zone
   * Extracts files from drag event and initiates upload process
   * @param e - React drag event containing dropped files
   */
  const handleDrop = (e: React.DragEvent) => {
    // Prevent default browser behavior
    e.preventDefault();
    e.stopPropagation();
    // Reset drag state after drop
    setDragActive(false);
    
    // Process dropped files if any exist
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Upload Document
          </h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Folder Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Folder
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className="text-gray-600 dark:text-gray-400">
              {uploading ? (
                <div>
                  <p className="text-sm font-medium">Uploading...</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1">{progress}%</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">
                    Drop files here or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs mt-1">Maximum file size: 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}