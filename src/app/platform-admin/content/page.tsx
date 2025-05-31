'use client';

import React, { useState, useEffect } from 'react';
import { usePlatformAuth } from '@/lib/firebase/usePlatformAuth';
import { queryDocuments, updateDocument, createDocument, deleteDocument, timestampToDate } from '@/lib/firebase/firestoreService';
import { where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

interface PendingContent {
  id: string;
  type: 'Document' | 'Comment' | 'Image' | 'Workflow';
  title: string;
  organization: string;
  organizationId: string;
  submittedBy: string;
  submittedById: string;
  submittedAt: Timestamp;
  flags: string[];
  status: 'pending' | 'approved' | 'rejected';
  content?: string;
  url?: string;
}

interface ContentPolicy {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  scope: 'global' | 'organization';
  updatedAt: Timestamp;
  rules: string[];
  createdBy: string;
}

interface SystemTemplate {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  category: string;
  template: any;
  updatedAt: Timestamp;
}

export default function ContentGovernancePage() {
  const { user, isPlatformAdmin, isLoading: authLoading } = usePlatformAuth();
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [contentPolicies, setContentPolicies] = useState<ContentPolicy[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<SystemTemplate[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [policyForm, setPolicyForm] = useState({ name: '', description: '', scope: 'global' });
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', category: '' });
  const [filters, setFilters] = useState({
    contentType: 'all',
    organization: 'all',
    searchTerm: ''
  });

  useEffect(() => {
    
    if (authLoading) {
      return;
    }
    
    if (!isPlatformAdmin) {
      setError('Access denied. Platform admin privileges required.');
      setLoading(false);
      return;
    }
    
    setError(null);
    loadData();
  }, [isPlatformAdmin, user, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPendingContent(),
        loadContentPolicies(),
        loadSystemTemplates(),
        loadOrganizations()
      ]);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingContent = async () => {
    const content = await queryDocuments('content_moderation', [
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    ]);
    setPendingContent(content as PendingContent[]);
  };

  const loadContentPolicies = async () => {
    const policies = await queryDocuments('content_policies', [
      orderBy('updatedAt', 'desc')
    ]);
    setContentPolicies(policies as ContentPolicy[]);
  };

  const loadSystemTemplates = async () => {
    const templates = await queryDocuments('system_templates', [
      orderBy('updatedAt', 'desc')
    ]);
    setSystemTemplates(templates as SystemTemplate[]);
  };

  const loadOrganizations = async () => {
    const orgs = await queryDocuments('organizations', [
      orderBy('name', 'asc')
    ]);
    setOrganizations(orgs);
  };

  const handleContentAction = async (contentId: string, action: 'approve' | 'reject') => {
    try {
      await updateDocument('content_moderation', contentId, {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: user?.uid,
        reviewedAt: serverTimestamp(),
        reviewerEmail: user?.email
      });
      
      await loadPendingContent();
    } catch (err) {
      console.error(`Error ${action}ing content:`, err);
      alert(`Failed to ${action} content`);
    }
  };

  const handlePolicyAction = async (policyId: string, action: 'edit' | 'disable') => {
    try {
      if (action === 'edit') {
        const policy = contentPolicies.find(p => p.id === policyId);
        if (policy) {
          setPolicyForm({
            name: policy.name,
            description: policy.description,
            scope: policy.scope
          });
          setEditingPolicyId(policyId);
          setShowPolicyModal(true);
        }
      } else if (action === 'disable') {
        const policy = contentPolicies.find(p => p.id === policyId);
        if (policy) {
          const newStatus = policy.status === 'active' ? 'inactive' : 'active';
          await updateDocument('content_policies', policyId, {
            status: newStatus,
            updatedAt: serverTimestamp()
          });
          await loadContentPolicies();
        }
      }
    } catch (err) {
      console.error(`Error ${action} policy:`, err);
      alert(`Failed to ${action} policy`);
    }
  };

  const handleTemplateAction = async (templateId: string, action: 'edit' | 'disable') => {
    try {
      if (action === 'edit') {
        const template = systemTemplates.find(t => t.id === templateId);
        if (template) {
          setTemplateForm({
            name: template.name,
            description: template.description,
            category: template.category
          });
          setEditingTemplateId(templateId);
          setShowTemplateModal(true);
        }
      } else if (action === 'disable') {
        const template = systemTemplates.find(t => t.id === templateId);
        if (template) {
          const newStatus = template.status === 'active' ? 'inactive' : 'active';
          await updateDocument('system_templates', templateId, {
            status: newStatus,
            updatedAt: serverTimestamp()
          });
          await loadSystemTemplates();
        }
      }
    } catch (err) {
      console.error(`Error ${action} template:`, err);
      alert(`Failed to ${action} template`);
    }
  };

  const createNewPolicy = async () => {
    if (!policyForm.name.trim() || !policyForm.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      if (editingPolicyId) {
        await updateDocument('content_policies', editingPolicyId, {
          name: policyForm.name.trim(),
          description: policyForm.description.trim(),
          scope: policyForm.scope,
          updatedAt: serverTimestamp()
        });
      } else {
        await createDocument('content_policies', {
          name: policyForm.name.trim(),
          description: policyForm.description.trim(),
          status: 'active',
          scope: policyForm.scope,
          rules: [],
          updatedAt: serverTimestamp(),
          createdBy: user?.uid,
          createdByEmail: user?.email
        });
      }
      await loadContentPolicies();
      setShowPolicyModal(false);
      setPolicyForm({ name: '', description: '', scope: 'global' });
      setEditingPolicyId(null);
    } catch (err) {
      console.error('Error saving policy:', err);
      alert('Failed to save policy');
    }
  };

  const createNewTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.description.trim() || !templateForm.category.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      if (editingTemplateId) {
        await updateDocument('system_templates', editingTemplateId, {
          name: templateForm.name.trim(),
          description: templateForm.description.trim(),
          category: templateForm.category.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        await createDocument('system_templates', {
          name: templateForm.name.trim(),
          description: templateForm.description.trim(),
          category: templateForm.category.trim(),
          status: 'active',
          template: {},
          updatedAt: serverTimestamp(),
          createdBy: user?.uid,
          createdByEmail: user?.email
        });
      }
      await loadSystemTemplates();
      setShowTemplateModal(false);
      setTemplateForm({ name: '', description: '', category: '' });
      setEditingTemplateId(null);
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save template');
    }
  };

  const filteredContent = pendingContent.filter(content => {
    const matchesType = filters.contentType === 'all' || content.type.toLowerCase() === filters.contentType;
    const matchesOrg = filters.organization === 'all' || content.organizationId === filters.organization;
    const matchesSearch = !filters.searchTerm || 
      content.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      content.submittedBy.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesType && matchesOrg && matchesSearch;
  });

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestampToDate(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need platform admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Content Governance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage platform-wide content policies and moderation</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowPolicyModal(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create Policy
          </button>
          <button 
            onClick={() => alert('Audit log feature coming soon')}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Audit Log
          </button>
        </div>
      </div>

      {/* Content Moderation Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Content Moderation Queue</h2>
        </div>
        
        <div className="p-5">
          <div className="flex justify-between mb-4">
            <div className="flex space-x-2">
              <select 
                value={filters.contentType}
                onChange={(e) => setFilters({...filters, contentType: e.target.value})}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <option value="all">All Content Types</option>
                <option value="document">Documents</option>
                <option value="comment">Comments</option>
                <option value="image">Images</option>
                <option value="workflow">Workflows</option>
              </select>
              <select 
                value={filters.organization}
                onChange={(e) => setFilters({...filters, organization: e.target.value})}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <option value="all">All Organizations</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                placeholder="Search content..."
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Content
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Flags
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContent.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {pendingContent.length === 0 ? 'No pending content for review' : 'No content matches your filters'}
                    </td>
                  </tr>
                ) : (
                  filteredContent.map((content) => (
                    <tr key={content.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{content.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          content.type === 'Document' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                          content.type === 'Comment' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          content.type === 'Image' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {content.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {content.organization}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {content.submittedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(content.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {content.flags.map((flag, index) => (
                            <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              {flag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleContentAction(content.id, 'approve')}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleContentAction(content.id, 'reject')}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Content Policies */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">Content Policies</h2>
        </div>
        
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Policy Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Scope
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {contentPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No content policies found
                    </td>
                  </tr>
                ) : (
                  contentPolicies.map((policy) => (
                    <tr key={policy.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{policy.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{policy.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          policy.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {policy.scope}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {policy.updatedAt ? formatDate(policy.updatedAt) : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handlePolicyAction(policy.id, 'edit')}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handlePolicyAction(policy.id, 'disable')}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                        >
                          {policy.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">System Templates</h2>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {systemTemplates.map((template) => (
              <div key={template.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Category: {template.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    template.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {template.status}
                  </span>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button 
                    onClick={() => handleTemplateAction(template.id, 'edit')}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleTemplateAction(template.id, 'disable')}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                  >
                    {template.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
            
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed p-4 flex items-center justify-center">
              <button 
                onClick={() => {
                  setEditingTemplateId(null);
                  setTemplateForm({ name: '', description: '', category: '' });
                  setShowTemplateModal(true);
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Creation Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{editingPolicyId ? 'Edit Policy' : 'Create New Policy'}</h3>
              <button
                onClick={() => {
                  setShowPolicyModal(false);
                  setPolicyForm({ name: '', description: '', scope: 'global' });
                  setEditingPolicyId(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Policy Name *
                </label>
                <input
                  type="text"
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter policy name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter policy description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scope
                </label>
                <select
                  value={policyForm.scope}
                  onChange={(e) => setPolicyForm({ ...policyForm, scope: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="global">Global</option>
                  <option value="organization">Organization</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPolicyModal(false);
                  setPolicyForm({ name: '', description: '', scope: 'global' });
                  setEditingPolicyId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={createNewPolicy}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {editingPolicyId ? 'Update Policy' : 'Create Policy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Creation Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{editingTemplateId ? 'Edit Template' : 'Create New Template'}</h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateForm({ name: '', description: '', category: '' });
                  setEditingTemplateId(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter template description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a category</option>
                  <option value="workflow">Workflow</option>
                  <option value="document">Document</option>
                  <option value="communication">Communication</option>
                  <option value="approval">Approval</option>
                  <option value="reporting">Reporting</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateForm({ name: '', description: '', category: '' });
                  setEditingTemplateId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={createNewTemplate}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {editingTemplateId ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}