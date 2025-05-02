import { useState, useEffect } from 'react';
import UserAvatar from './UserAvatar';
import {
  CollaborationDocument,
  DocumentComment,
  DocumentChange,
  createDocument,
  getDocument,
  updateDocument,
  lockDocument,
  unlockDocument,
  addComment,
  resolveComment,
  addCommentReply,
  getDocumentHistory
} from '@/lib/services/collaboration/documentCollaborationService';
import DocumentVersionHistory from './DocumentVersionHistory';

interface DocumentCollaborationProps {
  documentId?: string;
  initialContent?: string;
  currentUser: string;
  collaborators?: string[];
  readOnly?: boolean;
}

export default function DocumentCollaboration({
  documentId,
  initialContent = '',
  currentUser,
  collaborators = [],
  readOnly = false
}: DocumentCollaborationProps) {
  const [document, setDocument] = useState<CollaborationDocument | null>(null);
  const [content, setContent] = useState(initialContent);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [newReply, setNewReply] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isViewingVersion, setIsViewingVersion] = useState(false);
  const [versionContent, setVersionContent] = useState<string>('');
  // Load document if documentId is provided
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    } else {
      // Reset state for new document
      setDocument(null);
      setContent(initialContent);
      setComments([]);
      setIsLocked(false);
      setError(null);
    }
  }, [documentId, initialContent]);

  const loadDocument = async (id: string) => {
    try {
      setError(null);
      const doc = await getDocument(id);
      if (doc) {
        setDocument(doc);
        setContent(doc.content);
        setComments(doc.comments);
        setIsLocked(doc.isLocked);
        setSelectedVersion(null);
        setIsViewingVersion(false);
      } else {
        setError('Document not found');
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load document');
    }
  };
  
  const handleVersionSelect = async (version: number) => {
    try {
      setError(null);
      if (!document) return;
      
      // In a real implementation, this would fetch the specific version from the server
      // For now, we'll simulate it by getting the history and finding the right version
      const history = await getDocumentHistory(document.id);
      const versionChange = history.find(change => change.version === version);
      
      if (versionChange) {
        // In a real implementation, we would reconstruct the document content at this version
        // For now, we'll just show a simulated version
        setSelectedVersion(version);
        setIsViewingVersion(true);
        
        // Simulate the content of this version (in a real app, this would be fetched from the server)
        const simulatedContent = `This is a simulation of document version ${version}\n\n` +
          `Created by ${versionChange.author} on ${new Date(versionChange.timestamp).toLocaleString()}\n\n` +
          `In a real implementation, this would show the actual document content at version ${version}.`;
        
        setVersionContent(simulatedContent);
      } else {
        setError(`Version ${version} not found`);
      }
    } catch (err) {
      console.error('Error loading document version:', err);
      setError('Failed to load document version');
    }
  };
  
  const exitVersionView = () => {
    setSelectedVersion(null);
    setIsViewingVersion(false);
    setVersionContent('');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      if (!document) {
        // Create new document
        const newDoc = await createDocument({
          name: 'Untitled Document',
          content,
          createdBy: currentUser,
          collaborators: [currentUser, ...collaborators]
        });
        setDocument(newDoc);
        setComments(newDoc.comments || []);
        setIsLocked(newDoc.isLocked || false);
      } else {
        // Update existing document
        const change = {
          id: `change-${Date.now()}`,
          documentId: document.id,
          author: currentUser,
          timestamp: new Date(),
          changes: [
            {
              type: 'replace' as const,
              position: 0,
              content: content,
              length: document.content.length
            }
          ],
          version: document.version + 1
        };
        
        const updatedDoc = await updateDocument(document.id, change);
        if (updatedDoc) {
          setDocument(updatedDoc);
          setComments(updatedDoc.comments || comments);
          setIsLocked(updatedDoc.isLocked || isLocked);
        } else {
          throw new Error('Failed to update document');
        }
      }
    } catch (err) {
      console.error('Error saving document:', err);
      setError(typeof err === 'string' ? err : (err instanceof Error ? err.message : 'Failed to save document'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLock = async () => {
    if (!document) return;
    
    try {
      setError(null);
      if (isLocked && document.lockedBy === currentUser) {
        // Unlock document
        const success = await unlockDocument(document.id, currentUser);
        if (success) {
          setIsLocked(false);
          setDocument({
            ...document,
            isLocked: false,
            lockedBy: undefined
          });
        }
      } else if (!isLocked) {
        // Lock document
        const success = await lockDocument(document.id, currentUser);
        if (success) {
          setIsLocked(true);
          setDocument({
            ...document,
            isLocked: true,
            lockedBy: currentUser
          });
        }
      }
    } catch (err) {
      console.error('Error toggling document lock:', err);
      setError('Failed to lock/unlock document');
    }
  };

  const handleAddComment = async () => {
    if (!document || !newComment.trim()) return;
    
    try {
      setError(null);
      const comment = await addComment({
        documentId: document.id,
        content: newComment,
        author: currentUser
      });
      
      if (comment) {
        setComments([...comments, comment]);
        setNewComment('');
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(typeof err === 'string' ? err : (err instanceof Error ? err.message : 'Failed to add comment'));
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      setError(null);
      const success = await resolveComment(commentId);
      if (success) {
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, resolved: true } : c
        ));
      }
    } catch (err) {
      console.error('Error resolving comment:', err);
      setError('Failed to resolve comment');
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!newReply.trim()) return;
    
    try {
      setError(null);
      const reply = await addCommentReply({
        commentId,
        content: newReply,
        author: currentUser
      });
      
      setComments(comments.map(c => 
        c.id === commentId ? { 
          ...c, 
          replies: [...(c.replies || []), reply] 
        } : c
      ));
      setNewReply('');
      setSelectedCommentId(null);
    } catch (err) {
      console.error('Error adding reply:', err);
      setError('Failed to add reply');
    }
  };

  const canEdit = !readOnly && (!isLocked || (document?.lockedBy === currentUser));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Document Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {document?.name || 'New Document'}
          {documentId && !document && !error && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>}
          {isViewingVersion && selectedVersion && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
              Version {selectedVersion}
            </span>
          )}
        </h3>
        <div className="flex space-x-2">
          {isViewingVersion ? (
            <button
              onClick={exitVersionView}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            >
              Return to Current Version
            </button>
          ) : (
            <>
              {document && (
                <button
                  onClick={handleLock}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${isLocked ? (document.lockedBy === currentUser ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 cursor-not-allowed') : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}
                  disabled={isLocked && document.lockedBy !== currentUser}
                >
                  {isLocked ? (document.lockedBy === currentUser ? 'Unlock' : `Locked by ${document.lockedBy}`) : 'Lock for Editing'}
                </button>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => document && setShowVersionHistory(prev => !prev)}
                  disabled={!document}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canEdit || isSaving}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${!canEdit || isSaving ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md'}`}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Version History Panel */}
      {showVersionHistory && document && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <DocumentVersionHistory 
            documentId={document.id} 
            onVersionSelect={handleVersionSelect} 
          />
        </div>
      )}
      
      {/* Document Content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isViewingVersion ? (
            <div className="relative">
              <textarea
                value={versionContent}
                readOnly
                className="w-full h-96 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white"
              />
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Viewing historical version
                </span>
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={handleContentChange}
              disabled={!canEdit}
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              placeholder="Enter document content here..."
            />
          )}
        </div>
        {/* Comments Section */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Comments</h4>
          
          {/* Comment List */}
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
            ) : (
              comments.map(comment => (
                <div 
                  key={comment.id} 
                  className={`p-3 rounded-lg ${comment.resolved ? 'bg-gray-50 dark:bg-gray-900/30' : 'bg-blue-50 dark:bg-blue-900/20'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <UserAvatar username={comment.author} size="sm" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{comment.author}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!comment.resolved && (
                      <button
                        onClick={() => handleResolveComment(comment.id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">{comment.content}</p>
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-3 border-l-2 border-gray-200 dark:border-gray-700 mt-2 space-y-2">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="text-sm">
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 mt-0.5">
                              <UserAvatar username={reply.author} size="sm" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">{reply.author}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {new Date(reply.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Reply Form */}
                  {selectedCommentId === comment.id ? (
                    <div className="mt-2 flex space-x-2">
                      <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        className="flex-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Write a reply..."
                      />
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!newReply.trim()}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCommentId(null);
                          setNewReply('');
                        }}
                        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedCommentId(comment.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 mt-1"
                    >
                      Reply
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* New Comment Form */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-3 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || !document}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}