import { useState, useEffect } from 'react';
import { Document } from '@/lib/services/automation/documentService';

interface DocumentPreviewProps {
  document: Document;
  height?: string;
  width?: string;
}

export default function DocumentPreview({
  document,
  height = '500px',
  width = '100%'
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!document) {
      setError('No document provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Use the URL from the document if available
    if (document.url) {
      setPreviewUrl(document.url);
      setLoading(false);
    } else {
      setError('Document URL not available');
      setLoading(false);
    }
  }, [document]);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="text-center p-6">
            <svg className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No preview available</p>
        </div>
      );
    }

    // Render based on document type
    if (document.type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          <img 
            src={previewUrl} 
            alt={document.name} 
            className="max-h-full max-w-full object-contain"
            onError={() => setError('Failed to load image')}
          />
        </div>
      );
    }
    
    if (document.type === 'application/pdf') {
      return (
        <iframe 
          src={previewUrl} 
          className="w-full h-full rounded-lg border-0"
          title={document.name}
        />
      );
    }

    // For other document types, show a generic preview with download option
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center max-w-md">
          <svg className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{document.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {document.type} • {(document.size / 1024).toFixed(2)} KB
          </p>
          <a 
            href={previewUrl} 
            download={document.name}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      style={{ height, width }}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {document?.name || 'Document Preview'}
        </h3>
      </div>
      <div className="h-[calc(100%-57px)] w-full">
        {renderPreview()}
      </div>
    </div>
  );
}