import { useState } from 'react';
import { DocumentChange, getDocumentHistory } from '@/lib/services/collaboration/documentCollaborationService';

interface DocumentVersionHistoryProps {
  documentId: string;
  onVersionSelect?: (version: number) => void;
}

export default function DocumentVersionHistory({
  documentId,
  onVersionSelect
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await getDocumentHistory(documentId);
      setVersions(history);
    } catch (err) {
      console.error('Error loading document history:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version: number) => {
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };

  const toggleVersionExpand = (versionId: string) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  // Load history when component mounts
  useState(() => {
    loadVersionHistory();
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Version History</h3>
        <button
          onClick={loadVersionHistory}
          disabled={loading}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="p-6">
        {versions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading version history...' : 'No version history available'}
          </p>
        ) : (
          <ul className="space-y-4">
            {versions.map((version) => (
              <li key={version.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="p-3 bg-gray-50 dark:bg-gray-900/30 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleVersionExpand(version.id)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Version {version.version} by {version.author}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(version.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVersionSelect(version.version);
                      }}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View
                    </button>
                    <svg 
                      className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedVersion === version.id ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {expandedVersion === version.id && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Changes:</h4>
                    <ul className="space-y-2">
                      {version.changes.map((change, index) => (
                        <li key={index} className="text-sm text-gray-800 dark:text-gray-200">
                          <span className="font-medium">{change.type}:</span> 
                          {change.type === 'insert' && (
                            <span> Added content at position {change.position}</span>
                          )}
                          {change.type === 'delete' && (
                            <span> Removed {change.length} characters at position {change.position}</span>
                          )}
                          {change.type === 'replace' && (
                            <span> Replaced {change.length} characters at position {change.position}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}