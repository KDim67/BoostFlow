import { useState, useEffect } from 'react';
import {
  SecurityPolicy,
  SecurityRule,
  getSecurityPolicy,
  updateSecurityPolicy,
  addSecurityRule,
  logSecurityAudit
} from '@/lib/services/security/securityService';

interface SecuritySettingsProps {
  currentUser: string;
  policyId?: string;
}

export default function SecuritySettings({
  currentUser,
  policyId = 'default-policy'
}: SecuritySettingsProps) {
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('access-control');
  const [newRule, setNewRule] = useState<Partial<SecurityRule>>({
    type: 'access_control',
    name: '',
    description: '',
    config: {},
    priority: 1,
    isActive: true
  });

  // Load security policy
  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setLoading(true);
        const loadedPolicy = await getSecurityPolicy(policyId);
        setPolicy(loadedPolicy);
        setError(null);
      } catch (err) {
        console.error('Error loading security policy:', err);
        setError('Failed to load security policy. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, [policyId]);

  // Toggle policy active state
  const togglePolicyActive = async () => {
    if (!policy) return;

    try {
      const updatedPolicy = await updateSecurityPolicy(policy.id, {
        isActive: !policy.isActive
      });
      setPolicy(updatedPolicy);

      // Log the action
      await logSecurityAudit({
        userId: currentUser,
        action: policy.isActive ? 'disable_policy' : 'enable_policy',
        resource: 'security_policy',
        resourceId: policy.id,
        details: { policyName: policy.name }
      });
    } catch (err) {
      console.error('Error updating policy:', err);
      setError('Failed to update policy. Please try again.');
    }
  };

  // Add new security rule
  const handleAddRule = async () => {
    if (!policy || !newRule.name) return;

    try {
      const rule = await addSecurityRule(policy.id, newRule as Omit<SecurityRule, 'id'>);
      
      // Update the policy with the new rule
      setPolicy({
        ...policy,
        rules: [...policy.rules, rule]
      });

      // Reset the form
      setNewRule({
        type: 'access_control',
        name: '',
        description: '',
        config: {},
        priority: 1,
        isActive: true
      });

      // Log the action
      await logSecurityAudit({
        userId: currentUser,
        action: 'add_security_rule',
        resource: 'security_rule',
        resourceId: rule.id,
        details: { ruleName: rule.name, policyId: policy.id }
      });
    } catch (err) {
      console.error('Error adding rule:', err);
      setError('Failed to add security rule. Please try again.');
    }
  };

  // Toggle rule active state
  const toggleRuleActive = async (ruleId: string) => {
    if (!policy) return;

    const ruleIndex = policy.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return;

    const rule = policy.rules[ruleIndex];
    const updatedRules = [...policy.rules];
    updatedRules[ruleIndex] = {
      ...rule,
      isActive: !rule.isActive
    };

    try {
      const updatedPolicy = await updateSecurityPolicy(policy.id, {
        rules: updatedRules
      });
      setPolicy(updatedPolicy);

      // Log the action
      await logSecurityAudit({
        userId: currentUser,
        action: rule.isActive ? 'disable_rule' : 'enable_rule',
        resource: 'security_rule',
        resourceId: rule.id,
        details: { ruleName: rule.name, policyId: policy.id }
      });
    } catch (err) {
      console.error('Error updating rule:', err);
      setError('Failed to update security rule. Please try again.');
    }
  };

  if (loading) {
    return <div className="p-4">Loading security settings...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!policy) {
    return <div className="p-4">No security policy found.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{policy.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{policy.description}</p>
        </div>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-500 dark:text-gray-400">
            {policy.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={togglePolicyActive}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${policy.isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${policy.isActive ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('access-control')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'access-control' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Access Control
          </button>
          <button
            onClick={() => setActiveTab('encryption')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'encryption' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Data Encryption
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'audit' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Audit Logging
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'compliance' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            Compliance
          </button>
        </nav>
      </div>

      {/* Security Rules */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Rules</h3>
        
        <div className="space-y-4">
          {policy.rules
            .filter(rule => activeTab === 'access-control' ? rule.type === 'access_control' :
                           activeTab === 'encryption' ? rule.type === 'data_encryption' :
                           activeTab === 'audit' ? rule.type === 'audit_logging' :
                           rule.type === 'compliance_check')
            .map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{rule.description}</p>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Priority: {rule.priority}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-500 dark:text-gray-400">
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleRuleActive(rule.id)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full ${rule.isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${rule.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Add New Rule Form */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Rule</h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rule Type
            </label>
            <select
              value={newRule.type}
              onChange={(e) => setNewRule({ ...newRule, type: e.target.value as any })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="access_control">Access Control</option>
              <option value="data_encryption">Data Encryption</option>
              <option value="audit_logging">Audit Logging</option>
              <option value="compliance_check">Compliance Check</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <input
              type="number"
              value={newRule.priority}
              onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              min="1"
              max="100"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rule Name
            </label>
            <input
              type="text"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              placeholder="Enter rule name"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              rows={2}
              placeholder="Enter rule description"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAddRule}
            disabled={!newRule.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Rule
          </button>
        </div>
      </div>
    </div>
  );
}