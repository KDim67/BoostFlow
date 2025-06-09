import { useState, useEffect } from 'react';
import {
  Workflow,
  WorkflowStep,
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  executeWorkflow,
  TRIGGER_TYPES,
  ACTION_TYPES,
  CONDITION_TYPES
} from '@/lib/services/automation/workflowService';

interface WorkflowAutomationProps {
  workflowId?: string;
  projectId?: string;
  currentUser: string;
}

export default function WorkflowAutomation({
  workflowId,
  projectId,
  currentUser
}: WorkflowAutomationProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    } else {
      setSteps([
        {
          id: `step-${Date.now()}`,
          type: 'trigger',
          name: 'Workflow Trigger',
          description: 'This step triggers the workflow',
          config: { triggerType: 'manual' },
          nextSteps: []
        }
      ]);
    }
  }, [workflowId]);
  
  const loadWorkflow = async (id: string) => {
    try {
      const loadedWorkflow = await getWorkflow(id);
      if (loadedWorkflow) {
        setWorkflow(loadedWorkflow);
        setWorkflowName(loadedWorkflow.name);
        setWorkflowDescription(loadedWorkflow.description);
        setSteps(loadedWorkflow.steps);
        setIsActive(loadedWorkflow.isActive);
      } else {
        setError('Workflow not found');
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError('Failed to load workflow');
    }
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      if (!steps.some(step => step.type === 'trigger')) {
        setError('Workflow must have at least one trigger step');
        return;
      }
      
      const triggerStep = steps.find(step => step.type === 'trigger');
      
      if (!workflow) {
        if (!projectId) {
          setError('Project ID is required to create a workflow');
          return;
        }
        
        const newWorkflow = await createWorkflow({
          name: workflowName,
          description: workflowDescription,
          createdBy: currentUser,
          isActive,
          steps,
          triggerStep: triggerStep?.id || '',
          projectId
        });
        
        setWorkflow(newWorkflow);
      } else {
        const updatedWorkflow = await updateWorkflow(workflow.id, {
          name: workflowName,
          description: workflowDescription,
          isActive,
          steps,
          triggerStep: triggerStep?.id || ''
        });
        
        if (updatedWorkflow) {
          setWorkflow(updatedWorkflow);
        }
      }
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleExecute = async () => {
    if (!workflow) return;
    
    try {
      setIsExecuting(true);
      setError(null);
      
      const executionContext = await executeWorkflow(workflow.id, {});
      console.log('Workflow execution started:', executionContext);
      
      setTimeout(() => {
        setIsExecuting(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error executing workflow:', err);
      setError('Failed to execute workflow');
      setIsExecuting(false);
    }
  };
  
  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
      description: `This is a new ${type} step`,
      config: {},
      nextSteps: []
    };
    
    setSteps([...steps, newStep]);
    setActiveStepIndex(steps.length);
  };
  
  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], ...updates };
    setSteps(updatedSteps);
  };
  
  const removeStep = (index: number) => {
    if (steps.length === 1 && steps[0].type === 'trigger') {
      setError('Cannot remove the only trigger step');
      return;
    }
    
    const updatedSteps = steps.filter((_, i) => i !== index);
    
    const removedStepId = steps[index].id;
    const stepsWithUpdatedRefs = updatedSteps.map(step => ({
      ...step,
      nextSteps: step.nextSteps.filter(id => id !== removedStepId)
    }));
    
    setSteps(stepsWithUpdatedRefs);
    setActiveStepIndex(null);
  };
  
  const connectSteps = (fromIndex: number, toIndex: number) => {
    const fromStep = steps[fromIndex];
    const toStep = steps[toIndex];
    
    if (toStep.type === 'trigger') {
      setError('Cannot connect to a trigger step');
      return;
    }
    
    if (fromStep.nextSteps.includes(toStep.id)) {
      return;
    }
    
    const updatedSteps = [...steps];
    updatedSteps[fromIndex] = {
      ...fromStep,
      nextSteps: [...fromStep.nextSteps, toStep.id]
    };
    
    setSteps(updatedSteps);
  };
  
  const disconnectSteps = (fromIndex: number, toIndex: number) => {
    const fromStep = steps[fromIndex];
    const toStep = steps[toIndex];
    
    const updatedSteps = [...steps];
    updatedSteps[fromIndex] = {
      ...fromStep,
      nextSteps: fromStep.nextSteps.filter(id => id !== toStep.id)
    };
    
    setSteps(updatedSteps);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Workflow Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-medium text-gray-900 dark:text-white bg-transparent border-0 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-0 p-0"
            placeholder="Workflow Name"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {workflow ? `Created on ${new Date(workflow.createdAt).toLocaleDateString()}` : 'New workflow'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <div className="flex items-center mr-4">
            <input
              type="checkbox"
              id="workflow-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="workflow-active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
          
          {workflow && (
            <button
              onClick={handleExecute}
              disabled={isExecuting || !isActive}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${isExecuting || !isActive ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'}`}
            >
              {isExecuting ? 'Executing...' : 'Run Now'}
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${isSaving ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md'}`}
          >
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Workflow Description */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <textarea
          value={workflowDescription}
          onChange={(e) => setWorkflowDescription(e.target.value)}
          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the purpose of this workflow..."
          rows={2}
        />
      </div>
      
      {/* Workflow Builder */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Steps Palette */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Add Steps</h4>
          
          <div className="space-y-2">
            <button
              onClick={() => addStep('trigger')}
              className="w-full py-2 px-4 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Add Trigger
            </button>
            
            <button
              onClick={() => addStep('condition')}
              className="w-full py-2 px-4 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add Condition
            </button>
            
            <button
              onClick={() => addStep('action')}
              className="w-full py-2 px-4 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add Action
            </button>
          </div>
          
          <div className="mt-8">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Help</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <p><span className="font-medium text-blue-600 dark:text-blue-400">Triggers</span> start your workflow when an event occurs.</p>
              <p><span className="font-medium text-yellow-600 dark:text-yellow-400">Conditions</span> create branches based on criteria.</p>
              <p><span className="font-medium text-green-600 dark:text-green-400">Actions</span> perform tasks when executed.</p>
            </div>
          </div>
        </div>
        
        {/* Workflow Canvas */}
        <div className="lg:col-span-3 space-y-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Workflow Steps</h4>
          
          {steps.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Add steps to build your workflow</p>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`p-4 rounded-lg border ${activeStepIndex === index ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30' : 'border-gray-200 dark:border-gray-700'} ${step.type === 'trigger' ? 'bg-blue-50 dark:bg-blue-900/20' : step.type === 'condition' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}
                  onClick={() => setActiveStepIndex(index)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-md mr-2 ${step.type === 'trigger' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : step.type === 'condition' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'}`}>
                        {step.type === 'trigger' ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        ) : step.type === 'condition' ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      
                      <div>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(index, { name: e.target.value })}
                          className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-0 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:ring-0 p-0"
                          placeholder="Step Name"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {step.type.charAt(0).toUpperCase() + step.type.slice(1)} Step
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(index);
                          }}
                          className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, { description: e.target.value })}
                    className="w-full p-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-transparent mt-2"
                    placeholder="Step description..."
                    rows={2}
                  />
                  
                  {/* Step Configuration */}
                  {activeStepIndex === index && (
                    <div className="mt-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Step Configuration</h5>
                      
                      {step.type === 'trigger' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Trigger Type
                            </label>
                            <select
                              value={step.config.triggerType || 'manual'}
                              onChange={(e) => updateStep(index, { 
                                config: { ...step.config, triggerType: e.target.value } 
                              })}
                              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {Object.entries(TRIGGER_TYPES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      
                      {step.type === 'condition' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Condition Type
                            </label>
                            <select
                              value={step.config.conditionType || 'comparison'}
                              onChange={(e) => updateStep(index, { 
                                config: { ...step.config, conditionType: e.target.value } 
                              })}
                              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="comparison">Value Comparison</option>
                              <option value="existence">Check Existence</option>
                              <option value="time">Time-based</option>
                            </select>
                          </div>
                          
                          {step.config.conditionType === 'comparison' && (
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Left Value
                                </label>
                                <input
                                  type="text"
                                  value={step.config.leftValue || ''}
                                  onChange={(e) => updateStep(index, { 
                                    config: { ...step.config, leftValue: e.target.value } 
                                  })}
                                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Value or variable"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Operator
                                </label>
                                <select
                                  value={step.config.operator || 'equals'}
                                  onChange={(e) => updateStep(index, { 
                                    config: { ...step.config, operator: e.target.value } 
                                  })}
                                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="equals">Equals</option>
                                  <option value="notEquals">Not Equals</option>
                                  <option value="greaterThan">Greater Than</option>
                                  <option value="lessThan">Less Than</option>
                                  <option value="contains">Contains</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Right Value
                                </label>
                                <input
                                  type="text"
                                  value={step.config.rightValue || ''}
                                  onChange={(e) => updateStep(index, { 
                                    config: { ...step.config, rightValue: e.target.value } 
                                  })}
                                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Value or variable"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {step.type === 'action' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Action Type
                            </label>
                            <select
                              value={step.config.actionType || ''}
                              onChange={(e) => updateStep(index, { 
                                config: { ...step.config, actionType: e.target.value } 
                              })}
                              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select an action type</option>
                              {Object.entries(ACTION_TYPES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </div>
                          
                          {step.config.actionType && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Action Parameters
                              </label>
                              <textarea
                                value={step.config.parameters || ''}
                                onChange={(e) => updateStep(index, { 
                                  config: { ...step.config, parameters: e.target.value } 
                                })}
                                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter parameters as JSON or key=value pairs"
                                rows={3}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Step Connections */}
                      <div className="mt-4">
                        <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Connect to Steps</h6>
                        <div className="space-y-2">
                          {steps
                            .filter(s => s.id !== step.id && s.type !== 'trigger')
                            .map((targetStep, targetIndex) => {
                              const actualTargetIndex = steps.findIndex(s => s.id === targetStep.id);
                              const isConnected = step.nextSteps.includes(targetStep.id);
                              
                              return (
                                <div key={targetStep.id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`connect-${step.id}-${targetStep.id}`}
                                    checked={isConnected}
                                    onChange={() => {
                                      if (isConnected) {
                                        disconnectSteps(index, actualTargetIndex);
                                      } else {
                                        connectSteps(index, actualTargetIndex);
                                      }
                                    }}
                                    className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                                  />
                                  <label
                                    htmlFor={`connect-${step.id}-${targetStep.id}`}
                                    className="ml-2 text-xs text-gray-700 dark:text-gray-300"
                                  >
                                    {targetStep.name}
                                  </label>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}