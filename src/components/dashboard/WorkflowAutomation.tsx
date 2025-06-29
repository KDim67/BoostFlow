import React, { useState, useEffect } from 'react';
import {
  Workflow,
  WorkflowStep,
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  executeWorkflow,
  TRIGGER_TYPES,
  ACTION_TYPES,
  CONDITION_TYPES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  WorkflowTemplate,
  getWorkflowTemplates,
  createWorkflowFromTemplate
} from '@/lib/services/automation/workflowService';
import { queryDocuments } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';

/**
 * Props interface for the WorkflowAutomation component
 * Supports both creating new workflows and editing existing ones
 */

interface WorkflowAutomationProps {
  workflowId?: string; // Optional - if provided, loads existing workflow for editing
  projectId?: string; // Required for creating new workflows
  currentUser: string; // Current user identifier for workflow ownership
  organizationId?: string; // Organization context for team/task queries
}

/**
 * Interface representing a team member for workflow assignments
 */
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * WorkflowAutomation Component
 * 
 * A workflow builder and editor that allows users to:
 * - Create workflows from templates or from scratch
 * - Add and configure workflow steps (triggers, conditions, actions)
 * - Connect steps to create workflow logic
 * - Save and execute workflows
 * 
 * The component handles both creation and editing modes based on the presence of workflowId
 */
export default function WorkflowAutomation({
  workflowId,
  projectId,
  currentUser,
  organizationId
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
  const [triggerStep, setTriggerStep] = useState<WorkflowStep | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Array<{id: string, title: string}>>([]);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  
  /**
   * Initialize component based on props
   * - If workflowId exists: load existing workflow for editing
   * - If no workflowId: show template selection for new workflow creation
   * - Fetch supporting data (team members, tasks) when project context is available
   */
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    } else {
      // New workflow - show template selection
      const templates = getWorkflowTemplates();
      setAvailableTemplates(templates);
      setShowTemplateSelection(true);
    }
    
    // Fetch contextual data for workflow configuration
    if (projectId && organizationId) {
      fetchTeamMembers();
      fetchAvailableTasks();
    }
  }, [workflowId, projectId, organizationId]);
  
  /**
   * Fetches team members for the current project and organization
   * Used to populate assignee dropdowns in workflow actions
   */
  const fetchTeamMembers = async () => {
    try {
      const membersData = await queryDocuments('team', [
        where('organizationId', '==', organizationId),
        where('projectId', '==', projectId)
      ]);
      setTeamMembers(membersData as TeamMember[]);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  /**
   * Fetches available tasks for the current project
   * Used in workflow conditions and actions that reference specific tasks
   */
  const fetchAvailableTasks = async () => {
    try {
      const tasksData = await queryDocuments('tasks', [
        where('organizationId', '==', organizationId),
        where('projectId', '==', projectId)
      ]);
      // Extract only id and title for dropdown options
      setAvailableTasks(tasksData.map((task: any) => ({
        id: task.id,
        title: task.title
      })));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  
  /**
   * Loads an existing workflow by ID and populates the component state
   * Used when editing an existing workflow
   */
  const loadWorkflow = async (id: string) => {
    try {
      const loadedWorkflow = await getWorkflow(id);
      if (loadedWorkflow) {
        // Populate all workflow data into component state
        setWorkflow(loadedWorkflow);
        setWorkflowName(loadedWorkflow.name);
        setWorkflowDescription(loadedWorkflow.description);
        setSteps(loadedWorkflow.steps);
        setIsActive(loadedWorkflow.isActive);
        
        // Find and set the trigger step reference
        const trigger = loadedWorkflow.steps.find(step => step.id === loadedWorkflow.triggerStep);
        setTriggerStep(trigger || null);
      } else {
        setError('Workflow not found');
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError('Failed to load workflow');
    }
  };
  
  /**
   * Saves the current workflow state to the database
   * Handles both creating new workflows and updating existing ones
   * Validates workflow structure before saving
   */
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate workflow has required trigger step
      if (!steps.some(step => step.type === 'trigger')) {
        setError('Workflow must have at least one trigger step');
        return;
      }
      
      const triggerStep = steps.find(step => step.type === 'trigger');
      
      if (!workflow) {
        // Creating new workflow
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
          projectId,
          organizationId
        });
        
        setWorkflow(newWorkflow);
      } else {
        // Updating existing workflow
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
  
  /**
   * Executes the current workflow with the provided context
   * Only available for saved workflows that are marked as active
   */
  const handleExecute = async () => {
    if (!workflow) return;
    
    try {
      setIsExecuting(true);
      setError(null);
      
      // Execute workflow with current context
      const executionContext = await executeWorkflow(workflow.id, {
        projectId: projectId || workflow.projectId,
        currentUser,
        organizationId: organizationId || workflow.organizationId
      });
      console.log('Workflow execution started:', executionContext);
      
      // Simulate execution time for UI feedback
      setTimeout(() => {
        setIsExecuting(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error executing workflow:', err);
      setError('Failed to execute workflow');
      setIsExecuting(false);
    }
  };
  
  /**
   * Adds a new step to the workflow
   * Creates a step with default configuration and automatically selects it for editing
   */
  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`, // Generate unique ID using timestamp
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
      description: `This is a new ${type} step`,
      config: {}, // Empty config to be filled by user
      nextSteps: [] // No connections initially
    };
    
    setSteps([...steps, newStep]);
    setActiveStepIndex(steps.length); // Select the new step for immediate editing
  };
  
  /**
   * Updates a specific step with new properties
   * Uses partial updates to modify only the specified fields
   */
  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], ...updates };
    setSteps(updatedSteps);
  };
  
  /**
   * Removes a step from the workflow
   * Prevents removal of the only trigger step and cleans up step connections
   */
  const removeStep = (index: number) => {
    // Prevent removal of the only trigger step (workflows must have a trigger)
    if (steps.length === 1 && steps[0].type === 'trigger') {
      setError('Cannot remove the only trigger step');
      return;
    }
    
    const updatedSteps = steps.filter((_, i) => i !== index);
    
    // Clean up any connections to the removed step
    const removedStepId = steps[index].id;
    const stepsWithUpdatedRefs = updatedSteps.map(step => ({
      ...step,
      nextSteps: step.nextSteps.filter(id => id !== removedStepId)
    }));
    
    setSteps(stepsWithUpdatedRefs);
    setActiveStepIndex(null); // Clear selection
  };
  
  /**
   * Creates a connection between two workflow steps
   * Validates connection rules (e.g., cannot connect to trigger steps)
   */
  const connectSteps = (fromIndex: number, toIndex: number) => {
    const fromStep = steps[fromIndex];
    const toStep = steps[toIndex];
    
    // Prevent connections to trigger steps (they must be entry points)
    if (toStep.type === 'trigger') {
      setError('Cannot connect to a trigger step');
      return;
    }
    
    // Prevent duplicate connections
    if (fromStep.nextSteps.includes(toStep.id)) {
      return;
    }
    
    // Add the connection
    const updatedSteps = [...steps];
    updatedSteps[fromIndex] = {
      ...fromStep,
      nextSteps: [...fromStep.nextSteps, toStep.id]
    };
    
    setSteps(updatedSteps);
  };
  
  /**
   * Removes a connection between two workflow steps
   */
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
  
  /**
   * Handles selection of a workflow template
   * Populates the workflow with template data and switches to editor mode
   */
  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    
    // Create workflow steps from template
    const { steps: templateSteps, triggerStep: templateTriggerStep } = createWorkflowFromTemplate(template);
    setSteps(templateSteps);
    setTriggerStep(templateTriggerStep);
    setShowTemplateSelection(false); // Switch to editor mode
  };
  
  /**
   * Creates a new workflow from scratch with just a manual trigger
   * Used when user chooses not to use a template
   */
  const handleStartFromScratch = () => {
    // Create a basic manual trigger step
    const manualTriggerStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: 'trigger',
      name: 'Manual Start',
      description: 'This workflow must be started manually by a user',
      config: { triggerType: 'manual' }, // All workflows use manual triggers
      nextSteps: []
    };
    
    // Initialize workflow with minimal setup
    setSteps([manualTriggerStep]);
    setTriggerStep(manualTriggerStep);
    setWorkflowName('New Workflow');
    setWorkflowDescription('');
    setShowTemplateSelection(false); // Switch to editor mode
  };
  
  /**
   * Returns to template selection mode and clears current workflow data
   * Used when user wants to choose a different template
   */
  const handleBackToTemplates = () => {
    setShowTemplateSelection(true);
    setSteps([]); // Clear current workflow
    setTriggerStep(null);
    setSelectedTemplate(null);
  };
  
  // Render template selection screen when creating a new workflow
  if (showTemplateSelection) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Choose a Workflow Template</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select a pre-built template to get started quickly, or create a workflow from scratch.</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {availableTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {template.name}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                    {template.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {template.steps.length} steps
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              onClick={handleStartFromScratch}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <div className="flex flex-col items-center">
                <svg className="h-8 w-8 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                  Start from Scratch
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Create a custom workflow with just a manual trigger
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {!workflowId && (
            <button
              onClick={handleBackToTemplates}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Back to Templates
            </button>
          )}
          
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
              className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${isExecuting || !isActive ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'}`}
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Workflow...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                  Run Workflow
                </>
              )}
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
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-2">
                <svg className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Manual Trigger</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">All workflows start with a manual trigger. Users must run workflows manually.</p>
            </div>
            
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
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Workflow Guide</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <p><span className="font-medium text-blue-600 dark:text-blue-400">Manual Start:</span> All workflows require manual execution by users.</p>
              <p><span className="font-medium text-yellow-600 dark:text-yellow-400">Conditions:</span> Create decision points and branches in your workflow.</p>
              <p><span className="font-medium text-green-600 dark:text-green-400">Actions:</span> Define tasks to be performed when the workflow runs.</p>
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                <p className="text-amber-700 dark:text-amber-300 font-medium">Remember: Workflows only run when you click "Run Workflow"</p>
              </div>
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

                        </div>
                      )}
                      
                      {step.type === 'condition' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Condition Type
                            </label>
                            <select
                              value={step.config.conditionType || ''}
                              onChange={(e) => updateStep(index, { 
                                config: { 
                                  ...step.config, 
                                  conditionType: e.target.value,
                                   expectedValue: '',
                                   taskId: '',
                                   percentage: undefined
                                } 
                              })}
                              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a condition...</option>
                              {Object.entries(CONDITION_TYPES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Task-based conditions */}
                          {(step.config.conditionType?.startsWith('task.') && step.config.conditionType !== 'task.assignee.empty') && (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Task
                                </label>
                                <select
                                  value={step.config.taskId || ''}
                                  onChange={(e) => updateStep(index, { 
                                    config: { ...step.config, taskId: e.target.value } 
                                  })}
                                  className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select a task or use current task</option>
                                  {availableTasks.map((task) => (
                                    <option key={task.id} value={task.id}>
                                      {task.title}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Leave empty to use the current task from workflow context
                                </p>
                              </div>
                              
                              {/* Task Status */}
                              {step.config.conditionType === 'task.status.equals' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Expected Status
                                  </label>
                                  <select
                                    value={step.config.expectedValue || ''}
                                    onChange={(e) => updateStep(index, { 
                                      config: { ...step.config, expectedValue: e.target.value } 
                                    })}
                                    className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select status...</option>
                                    {TASK_STATUSES.map((status) => (
                                      <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              
                              {/* Task Priority */}
                              {step.config.conditionType === 'task.priority.equals' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Expected Priority
                                  </label>
                                  <select
                                    value={step.config.expectedValue || ''}
                                    onChange={(e) => updateStep(index, { 
                                      config: { ...step.config, expectedValue: e.target.value } 
                                    })}
                                    className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select priority...</option>
                                    {TASK_PRIORITIES.map((priority) => (
                                      <option key={priority} value={priority}>
                                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              
                              {/* Task Assignee */}
                              {step.config.conditionType === 'task.assignee.equals' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Expected Assignee
                                  </label>
                                  <select
                                    value={step.config.expectedValue || ''}
                                    onChange={(e) => updateStep(index, { 
                                      config: { ...step.config, expectedValue: e.target.value } 
                                    })}
                                    className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">Select team member...</option>
                                    {teamMembers.map((member) => (
                                      <option key={member.id} value={member.id}>
                                        {member.name} ({member.email})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Task Unassigned condition */}
                          {step.config.conditionType === 'task.assignee.empty' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Task
                              </label>
                              <select
                                value={step.config.taskId || ''}
                                onChange={(e) => updateStep(index, { 
                                  config: { ...step.config, taskId: e.target.value } 
                                })}
                                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select a task or use current task</option>
                                {availableTasks.map((task) => (
                                  <option key={task.id} value={task.id}>
                                    {task.title}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Leave empty to use the current task from workflow context
                              </p>
                            </div>
                          )}
                          
                          {/* Project completion conditions */}
                          {(step.config.conditionType === 'project.completion.above' || step.config.conditionType === 'project.completion.below') && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Completion Percentage
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={step.config.percentage || ''}
                                onChange={(e) => updateStep(index, { 
                                  config: { ...step.config, percentage: parseInt(e.target.value) || 0 } 
                                })}
                                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter percentage (0-100)"
                              />
                            </div>
                          )}
                          

                          

                          
                          {/* Condition explanation */}
                          {step.config.conditionType && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                <span className="font-medium">This condition will:</span>
                                {step.config.conditionType === 'task.status.equals' && ` Check if the task status equals "${step.config.expectedValue || 'selected status'}"`}
                                {step.config.conditionType === 'task.priority.equals' && ` Check if the task priority equals "${step.config.expectedValue || 'selected priority'}"`}
                                {step.config.conditionType === 'task.assignee.equals' && ` Check if the task is assigned to the selected team member`}
                                {step.config.conditionType === 'task.assignee.empty' && ` Check if the task is unassigned`}
                                {step.config.conditionType === 'task.duedate.overdue' && ` Check if the task is past its due date`}
                                {step.config.conditionType === 'task.duedate.today' && ` Check if the task is due today`}
                                {step.config.conditionType === 'task.duedate.thisweek' && ` Check if the task is due within the next 7 days`}
                                {step.config.conditionType === 'project.completion.above' && ` Check if project completion is above ${step.config.percentage || 0}%`}
                                {step.config.conditionType === 'project.completion.below' && ` Check if project completion is below ${step.config.percentage || 0}%`}
                              </p>
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
                            <div className="space-y-3">
                              {/* Task-related actions */}
                              {(step.config.actionType === 'task.create' || step.config.actionType === 'task.update' || step.config.actionType === 'task.assign') && (
                                <div className="space-y-2">
                                  <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300">Task Configuration</h6>
                                  
                                  {step.config.actionType !== 'task.create' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Task ID (or variable)
                                      </label>
                                      <select
                                        value={step.config.taskData?.taskId || ''}
                                        onChange={(e) => updateStep(index, { 
                                          config: { 
                                            ...step.config, 
                                            taskData: { ...step.config.taskData, taskId: e.target.value }
                                          } 
                                        })}
                                        className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      >
                                        <option value="">Select a task</option>
                                        {availableTasks.map((task) => (
                                          <option key={task.id} value={task.id}>
                                            {task.title}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                  
                                  {step.config.actionType !== 'task.assign' && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Task Title
                                        </label>
                                        <input
                                          type="text"
                                          value={step.config.taskData?.title || ''}
                                          onChange={(e) => updateStep(index, { 
                                            config: { 
                                              ...step.config, 
                                              taskData: { ...step.config.taskData, title: e.target.value }
                                            } 
                                          })}
                                          className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="Task title"
                                        />
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Description
                                        </label>
                                        <textarea
                                          value={step.config.taskData?.description || ''}
                                          onChange={(e) => updateStep(index, { 
                                            config: { 
                                              ...step.config, 
                                              taskData: { ...step.config.taskData, description: e.target.value }
                                            } 
                                          })}
                                          className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="Task description"
                                          rows={2}
                                        />
                                      </div>
                                    </>
                                  )}
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Assignee
                                    </label>
                                    <select
                                      value={step.config.taskData?.assignee || ''}
                                      onChange={(e) => updateStep(index, { 
                                        config: { 
                                          ...step.config, 
                                          taskData: { ...step.config.taskData, assignee: e.target.value }
                                        } 
                                      })}
                                      className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="">Unassigned</option>
                                      {teamMembers.map((member) => (
                                        <option key={member.id} value={member.email}>
                                          {member.name} ({member.email})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  {step.config.actionType !== 'task.assign' && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Due Date
                                        </label>
                                        <input
                                          type="date"
                                          value={step.config.taskData?.dueDate || ''}
                                          onChange={(e) => updateStep(index, { 
                                            config: { 
                                              ...step.config, 
                                              taskData: { ...step.config.taskData, dueDate: e.target.value }
                                            } 
                                          })}
                                          className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Priority
                                          </label>
                                          <select
                                            value={step.config.taskData?.priority || 'medium'}
                                            onChange={(e) => updateStep(index, { 
                                              config: { 
                                                ...step.config, 
                                                taskData: { ...step.config.taskData, priority: e.target.value }
                                              } 
                                            })}
                                            className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                          </select>
                                        </div>
                                      
                                        {step.config.actionType === 'task.update' && (
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                              Status
                                            </label>
                                            <select
                                              value={step.config.taskData?.status || ''}
                                              onChange={(e) => updateStep(index, { 
                                                config: { 
                                                  ...step.config, 
                                                  taskData: { ...step.config.taskData, status: e.target.value }
                                                } 
                                              })}
                                              className="w-full p-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                              <option value="">Keep current</option>
                                              <option value="pending">Pending</option>
                                              <option value="in-progress">In Progress</option>
                                              <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                      )}
                                    </div>
                                    </>
                                  )}
                                </div>
                              )}
                              

                              

                              

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