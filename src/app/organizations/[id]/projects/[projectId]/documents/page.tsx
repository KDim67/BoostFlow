'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { where } from 'firebase/firestore';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { getDocument, getDocuments, deleteDocument } from '@/lib/firebase/firestoreService';
import { Organization } from '@/lib/types/organization';
import DocumentUploadModal from '@/components/modals/DocumentUploadModal';

// Document interface representing a file uploaded to the project
interface Document {
  id: string;           // Unique document identifier
  name: string;         // Original filename
  type: string;         // File extension/type (pdf, docx, etc.)
  size: string;         // Human-readable file size
  uploadedBy: string;   // User ID who uploaded the document
  uploadedAt: string;   // Upload timestamp
  folder?: string;      // Optional folder organization
  url?: string;         // Optional direct download URL
}

// Project interface for basic project information
interface Project {
  id: string;           // Unique project identifier
  name: string;         // Project display name
  organizationId: string; // Parent organization ID
}

/**
 * ProjectDocumentsPage - Main component for managing project documents
 * Handles document viewing, uploading, downloading, and organization
 * Requires user authentication and organization permissions
 */
export default function ProjectDocumentsPage() {
  // Extract route parameters from Next.js dynamic routing
  const { id, projectId } = useParams();
  
  // Core data state
  const [organization, setOrganization] = useState<Organization | null>(null); // Current organization data
  const [project, setProject] = useState<Project | null>(null);               // Current project data
  const [documents, setDocuments] = useState<Document[]>([]);                 // List of project documents
  
  // Document organization state
  const [folders, setFolders] = useState<string[]>(['General', 'Contracts', 'Design', 'Reports']); // Available folders
  const [selectedFolder, setSelectedFolder] = useState<string>('All');        // Currently selected folder filter
  const [searchTerm, setSearchTerm] = useState('');                          // Document search query
  
  // UI state management
  const [isLoading, setIsLoading] = useState(true);                          // Loading indicator
  const [error, setError] = useState<string | null>(null);                   // Error message display
  const [showUploadModal, setShowUploadModal] = useState(false);             // Upload modal visibility
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);       // New folder modal visibility
  const [newFolderName, setNewFolderName] = useState('');                    // New folder name input
  
  // Authentication and navigation
  const { user } = useAuth();   // Current authenticated user
  const router = useRouter();   // Next.js router for navigation
  
  // Normalize route parameters (handle both string and array formats)
  const organizationId = Array.isArray(id) ? id[0] : id;
  const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;

  /**
   * Fetches all documents for the current project from Firestore
   * Filters by projectId and organizationId for security
   * Formats the data for UI consumption
   */
  const fetchDocuments = async () => {
    try {
      // Query Firestore for documents belonging to this specific project and organization
      const docs = await getDocuments('project-documents', [
        where('projectId', '==', projectIdString),
        where('organizationId', '==', organizationId)
      ]);
      
      // Transform raw Firestore data into UI-friendly format
      const formattedDocs = docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        uploadedBy: doc.uploadedBy,
        uploadedAt: new Date(doc.uploadedAt).toLocaleDateString(), // Convert timestamp to readable date
        folder: doc.folder || 'General', // Default to 'General' if no folder specified
        url: doc.url
      }));
      
      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  /**
   * Main effect hook that initializes the page data
   * Handles authentication, permission checking, and data loading
   * Runs when user, organizationId, or projectIdString changes
   */
  useEffect(() => {
    const fetchProjectData = async () => {
      // Early return if required data is missing
      if (!user || !organizationId || !projectIdString) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user has at least viewer permission for this organization
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'viewer');
        
        if (!permission) {
          setError('You do not have permission to view this organization.');
          setIsLoading(false);
          return;
        }
        
        // Fetch organization data
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        
        // Fetch project data and validate it exists
        const projectData = await getDocument('projects', projectIdString);
        
        if (!projectData) {
          setError('Project not found');
          setIsLoading(false);
          return;
        }
        
        // Security check: ensure project belongs to the current organization
        if (projectData.organizationId !== organizationId) {
          setError('This project does not belong to the selected organization');
          setIsLoading(false);
          return;
        }
        
        setProject(projectData as Project);
        
        // Load all documents for this project
        await fetchDocuments();
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Failed to load project data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [user, organizationId, projectIdString]); // Re-run when these change

  /**
   * Returns appropriate SVG icon based on file type
   * Uses color coding: PDF (red), Word (blue), Excel (green), Figma (purple), default (gray)
   * @param type - File extension or type string
   * @returns JSX.Element - SVG icon component
   */
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return (
          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'word':
      case 'docx':
        return (
          <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'excel':
      case 'xlsx':
        return (
          <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'figma':
        return (
          <svg className="h-8 w-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-8 w-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  /**
   * Filters documents based on search term and selected folder
   * Combines text search (case-insensitive) with folder filtering
   */
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'All' || doc.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  /**
   * Creates a new folder if the name is valid and doesn't already exist
   * Validates input and updates the folders list
   */
  const handleCreateFolder = () => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders([...folders, newFolderName.trim()]);
      setNewFolderName('');
      setShowNewFolderModal(false);
    }
  };

  /**
   * Callback function executed when a document is successfully uploaded
   * Adds the new document to the beginning of the list and closes the modal
   * @param document - The newly uploaded document object
   */
  const handleUploadSuccess = (document: any) => {
    setDocuments(prev => [document, ...prev]);
    setShowUploadModal(false);
  };

  /**
   * Handles secure document download with authentication
   * Creates a temporary download link and triggers browser download
   * @param document - Document object to download
   */
  const handleDownload = async (document: Document) => {
    try {
      // Ensure user is authenticated before allowing download
      if (!user) {
        setError('You must be logged in to download documents');
        return;
      }

      // Get Firebase authentication token for API authorization
      const token = await user.getIdToken();
      
      // Call secure download API with authentication
      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download document');
      }

      // Convert response to blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name; // Use original filename
      window.document.body.appendChild(a);
      a.click(); // Trigger download
      
      // Clean up
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document. Please try again.');
    }
  };

  /**
   * Handles document deletion with user confirmation
   * Calls secure delete API and updates local state on success
   * @param document - Document object to delete
   */
  const handleDelete = async (document: Document) => {
    // Show confirmation dialog to prevent accidental deletions
    if (!confirm(`Are you sure you want to delete "${document.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Get authentication token for API call
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // Call secure delete API
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove document from local state after successful deletion
      setDocuments(prev => prev.filter(doc => doc.id !== document.id));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state if there's an error or required data is missing
  if (error || !organization || !project) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error || 'Project not found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The project you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link 
          href={`/organizations/${organizationId}/projects`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Documents</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and organize all project-related documents
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Folder
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Folder
              </label>
              <select 
                value={selectedFolder} 
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Folders</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Documents
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by document name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Documents ({filteredDocuments.length})
          </h3>
        </div>
        
        {filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Folder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(document.type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {document.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                        {document.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.folder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.uploadedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {document.uploadedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleDownload(document)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 p-1"
                          title="Download"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(document)}
                          className="text-red-600 dark:text-red-400 hover:text-red-500 p-1"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || selectedFolder !== 'All' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by uploading your first document.'}
            </p>
            {!searchTerm && selectedFolder === 'All' && (
              <div className="mt-6">
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Document
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        projectId={projectIdString || ''}
        organizationId={organizationId || ''}
        folders={folders}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Folder</h3>
                <button 
                  onClick={() => setShowNewFolderModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    onClick={() => setShowNewFolderModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateFolder}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}