/**
 * Workflow Service
 * 
 * Provides functionality for creating, managing, and executing automated workflows.
 * Each workflow consists of trigger, condition, and action steps that are executed
 * in sequence based on defined rules.
 */

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  name: string;
  description: string;
  config: Record<string, any>;
  nextSteps: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  steps: WorkflowStep[];
  triggerStep: string; // ID of the first step (trigger)
}

export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  currentStep?: string;
  data: Record<string, any>;
  error?: string;
}

// Available trigger types
export const TRIGGER_TYPES = [
  'task.created',
  'task.updated',
  'task.completed',
  'project.created',
  'project.updated',
  'document.uploaded',
  'scheduled.daily',
  'scheduled.weekly',
  'manual'
] as const;

// Available action types
export const ACTION_TYPES = [
  'task.create',
  'task.update',
  'task.assign',
  'notification.send',
  'email.send',
  'document.process',
  'integration.sync',
  'custom.script'
] as const;

// Available condition types
export const CONDITION_TYPES = [
  'task.status',
  'task.assignee',
  'project.status',
  'document.type',
  'user.role',
  'date.compare',
  'data.compare'
];

/**
 * Creates a new workflow
 * 
 * @param workflow - The workflow data without system-generated fields
 * @returns The created workflow with ID and timestamps
 * @throws Error if workflow validation fails
 */
export const createWorkflow = async (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> => {
  const newWorkflow: Workflow = {
    ...workflow,
    id: `workflow-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Validate the workflow structure
  validateWorkflow(newWorkflow);
  
  // In a real implementation, this would save to a database
  return newWorkflow;
};

/**
 * Gets a workflow by ID
 * 
 * @param workflowId - The ID of the workflow to retrieve
 * @returns The workflow or null if not found
 */
export const getWorkflow = async (workflowId: string): Promise<Workflow | null> => {
  // This would fetch from a database
  // For now, we'll return a mock workflow
  return {
    id: workflowId,
    name: 'Document Approval Workflow',
    description: 'Automatically routes documents for approval',
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(),
    isActive: true,
    triggerStep: 'step-1',
    steps: [
      {
        id: 'step-1',
        type: 'trigger',
        name: 'Document Uploaded',
        description: 'Triggered when a new document is uploaded',
        config: { triggerType: 'document.uploaded' },
        nextSteps: ['step-2']
      },
      {
        id: 'step-2',
        type: 'condition',
        name: 'Is Confidential',
        description: 'Checks if the document is marked as confidential',
        config: { 
          conditionType: 'document.type',
          field: 'isConfidential',
          operator: 'equals',
          value: true
        },
        nextSteps: ['step-3', 'step-4'] // true path, false path
      },
      {
        id: 'step-3',
        type: 'action',
        name: 'Route to Legal',
        description: 'Routes the document to the legal department',
        config: { 
          actionType: 'task.create',
          taskData: {
            title: 'Review confidential document',
            assignee: 'legal-team',
            priority: 'high'
          }
        },
        nextSteps: []
      },
      {
        id: 'step-4',
        type: 'action',
        name: 'Standard Approval',
        description: 'Routes the document for standard approval',
        config: { 
          actionType: 'task.create',
          taskData: {
            title: 'Review document',
            assignee: 'manager',
            priority: 'normal'
          }
        },
        nextSteps: []
      }
    ]
  };
};

/**
 * Updates an existing workflow
 * 
 * @param workflowId - The ID of the workflow to update
 * @param updates - The partial workflow data to update
 * @returns The updated workflow
 * @throws Error if workflow not found or validation fails
 */
export const updateWorkflow = async (workflowId: string, updates: Partial<Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Workflow> => {
  const workflow = await getWorkflow(workflowId);
  
  if (!workflow) {
    throw new Error(`Workflow with ID ${workflowId} not found`);
  }
  
  const updatedWorkflow: Workflow = {
    ...workflow,
    ...updates,
    updatedAt: new Date()
  };
  
  // Validate the updated workflow
  validateWorkflow(updatedWorkflow);
  
  // In a real implementation, this would update in a database
  return updatedWorkflow;
};

/**
 * Deletes a workflow
 * 
 * @param id - The ID of the workflow to delete
 * @returns True if deletion was successful
 */
export const deleteWorkflow = async (id: string): Promise<boolean> => {
  // In a real implementation, this would delete from a database
  return true;
};

/**
 * Validates a workflow structure
 * 
 * @param workflow - The workflow to validate
 * @throws Error if validation fails
 */
function validateWorkflow(workflow: Workflow): void {
  // Check that the workflow has a trigger step
  const triggerStep = workflow.steps.find(step => step.id === workflow.triggerStep);
  
  if (!triggerStep) {
    throw new Error('Workflow must have a trigger step');
  }
  
  if (triggerStep.type !== 'trigger') {
    throw new Error('The trigger step must be of type "trigger"');
  }
  
  // Check that all nextSteps reference valid step IDs
  const stepIds = new Set(workflow.steps.map(step => step.id));
  
  for (const step of workflow.steps) {
    for (const nextStepId of step.nextSteps) {
      if (!stepIds.has(nextStepId)) {
        throw new Error(`Step ${step.id} references non-existent next step ${nextStepId}`);
      }
    }
  }
  
  // Check for cycles in the workflow
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function checkForCycles(stepId: string): boolean {
    if (!stepIds.has(stepId)) {
      return false;
    }
    
    if (recursionStack.has(stepId)) {
      return true; // Cycle detected
    }
    
    if (visited.has(stepId)) {
      return false; // Already checked, no cycles
    }
    
    visited.add(stepId);
    recursionStack.add(stepId);
    
    const step = workflow.steps.find(s => s.id === stepId);
    if (step) {
      for (const nextStepId of step.nextSteps) {
        if (checkForCycles(nextStepId)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(stepId);
    return false;
  }
  
  // Start cycle check from the trigger step
  if (checkForCycles(workflow.triggerStep)) {
    throw new Error('Workflow contains cycles, which are not allowed');
  }
}

/**
 * Executes a workflow
 * 
 * @param workflowId - The ID of the workflow to execute
 * @param initialData - Initial data to provide to the workflow
 * @returns The workflow execution context with results
 * @throws Error if workflow not found or execution fails
 */
export const executeWorkflow = async (workflowId: string, initialData: Record<string, any> = {}): Promise<WorkflowExecutionContext> => {
  const workflow = await getWorkflow(workflowId);
  
  if (!workflow) {
    throw new Error(`Workflow with ID ${workflowId} not found`);
  }
  
  if (!workflow.isActive) {
    throw new Error(`Workflow with ID ${workflowId} is not active`);
  }
  
  // Create execution context
  const executionContext: WorkflowExecutionContext = {
    workflowId,
    executionId: `exec-${Date.now()}`,
    startedAt: new Date(),
    status: 'running',
    data: { ...initialData }
  };
  
  try {
    // Find the trigger step
    const triggerStep = workflow.steps.find(step => step.id === workflow.triggerStep);
    
    if (!triggerStep) {
      throw new Error(`Trigger step not found in workflow ${workflowId}`);
    }
    
    // Execute the workflow starting from the trigger
    await executeWorkflowStep(workflow, triggerStep.id, executionContext);
    
    // Mark as completed
    executionContext.status = 'completed';
    executionContext.completedAt = new Date();
  } catch (error) {
    // Handle execution error
    executionContext.status = 'failed';
    executionContext.error = error instanceof Error ? error.message : String(error);
    executionContext.completedAt = new Date();
  }
  
  return executionContext;
};

/**
 * Executes a single workflow step and its next steps
 * 
 * @param workflow - The workflow containing the step
 * @param stepId - The ID of the step to execute
 * @param context - The current execution context
 */
async function executeWorkflowStep(workflow: Workflow, stepId: string, context: WorkflowExecutionContext): Promise<void> {
  const step = workflow.steps.find(s => s.id === stepId);
  
  if (!step) {
    throw new Error(`Step with ID ${stepId} not found in workflow ${workflow.id}`);
  }
  
  // Update context with current step
  context.currentStep = stepId;
  
  // Execute the step based on its type
  switch (step.type) {
    case 'trigger':
      // Trigger steps don't need execution, they just start the workflow
      break;
      
    case 'condition':
      // Evaluate the condition and determine which path to take
      const conditionResult = await evaluateCondition(step, context.data);
      
      // Select the appropriate next step based on condition result
      // By convention, the first next step is the 'true' path, the second is the 'false' path
      const nextStepIndex = conditionResult ? 0 : 1;
      
      if (step.nextSteps.length > nextStepIndex) {
        // Only execute the path that matches the condition result
        await executeWorkflowStep(workflow, step.nextSteps[nextStepIndex], context);
      }
      return; // Return early as we've already handled the next steps
      
    case 'action':
      // Execute the action
      const actionResult = await executeAction(step, context.data);
      
      // Update the context data with the action result
      context.data = { ...context.data, ...actionResult };
      break;
      
    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
  
  // Execute all next steps (except for conditions which handle their own branching)
  for (const nextStepId of step.nextSteps) {
    await executeWorkflowStep(workflow, nextStepId, context);
  }
}

/**
 * Evaluates a condition step
 * 
 * @param step - The condition step to evaluate
 * @param data - The current workflow data
 * @returns True if the condition is met, false otherwise
 * @throws Error if the step is not a condition or the operator is unknown
 */
async function evaluateCondition(step: WorkflowStep, data: Record<string, any>): Promise<boolean> {
  if (step.type !== 'condition') {
    throw new Error('Cannot evaluate non-condition step');
  }
  
  const { conditionType, field, operator, value } = step.config;
  
  // Get the actual value from the data using dot notation if needed
  const actualValue = field.includes('.') ? 
    field.split('.').reduce((obj: any, key: string) => obj && obj[key], data) : 
    data[field];
  
  // Evaluate based on the operator
  switch (operator) {
    case 'equals':
      return actualValue === value;
    case 'notEquals':
      return actualValue !== value;
    case 'contains':
      return String(actualValue).includes(String(value));
    case 'greaterThan':
      return actualValue > value;
    case 'lessThan':
      return actualValue < value;
    case 'isEmpty':
      return actualValue === undefined || actualValue === null || actualValue === '';
    case 'isNotEmpty':
      return actualValue !== undefined && actualValue !== null && actualValue !== '';
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

/**
 * Executes an action step
 * 
 * @param step - The action step to execute
 * @param data - The current workflow data
 * @returns The result of the action execution
 * @throws Error if the step is not an action or the action type is unknown
 */
async function executeAction(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  if (step.type !== 'action') {
    throw new Error('Cannot execute non-action step');
  }
  
  const { actionType } = step.config;
  
  try {
    // Execute different actions based on the action type
    switch (actionType) {
      case 'task.create':
        return await executeTaskCreate(step, data);
        
      case 'notification.send':
        return await executeNotificationSend(step);
        
      case 'email.send':
        return await executeEmailSend(step);
        
      case 'document.process':
        return await executeDocumentProcess(step, data);
        
      case 'integration.sync':
        return await executeIntegrationSync(step);
        
      case 'custom.script':
        return await executeCustomScriptAction(step, data);
        
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (error) {
    // Standardize error handling for all action types
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute ${actionType} action: ${errorMessage}`);
  }
}

/**
 * Executes a task creation action
 * 
 * @param step - The action step configuration
 * @param data - The current workflow data
 * @returns The result of the task creation
 */
async function executeTaskCreate(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  // In a real implementation, this would call a task service API
  const taskData = {
    title: step.config.taskData.title || 'New Task',
    description: step.config.taskData.description || '',
    assignee: step.config.taskData.assignee || '',
    priority: step.config.taskData.priority || 'normal',
    dueDate: step.config.taskData.dueDate || null,
    projectId: step.config.taskData.projectId || data.projectId
  };
  
  // Generate a unique ID for now, but in production this would come from the task service
  const taskId = `task-${Date.now()}`;
  
  // Return the task ID and success status
  return { taskId, taskCreated: true, taskData };
}

/**
 * Executes a notification send action
 * 
 * @param step - The action step configuration
 * @returns The result of the notification send
 */
async function executeNotificationSend(step: WorkflowStep): Promise<Record<string, any>> {
  // In a real implementation, this would call a notification service API
  const notificationData = {
    recipient: step.config.recipient,
    message: step.config.message,
    type: step.config.type || 'info',
    channel: step.config.channel || 'app'
  };
  
  // Return success status and notification details
  return { notificationSent: true, notificationData };
}

/**
 * Executes an email send action
 * 
 * @param step - The action step configuration
 * @returns The result of the email send
 */
async function executeEmailSend(step: WorkflowStep): Promise<Record<string, any>> {
  // In a real implementation, this would call an email service API
  const emailData = {
    recipient: step.config.recipient,
    subject: step.config.subject,
    body: step.config.body,
    attachments: step.config.attachments || [],
    cc: step.config.cc || [],
    bcc: step.config.bcc || []
  };
  
  // Return success status and email details
  return { emailSent: true, emailData };
}

/**
 * Executes a document processing action
 * 
 * @param step - The action step configuration
 * @param data - The current workflow data
 * @returns The result of the document processing
 * @throws Error if document ID is missing
 */
async function executeDocumentProcess(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  // Get the document ID from the workflow data or step config
  const documentId = data.documentId || step.config.documentId;
  if (!documentId) {
    throw new Error('Document ID is required for document processing');
  }
  
  // Import the document processing service
  const { processDocument } = await import('../automation/documentService');
  
  // Start the document processing job
  const processingJob = await processDocument(
    documentId,
    step.config.processingType,
    step.config.processingConfig || {}
  );
  
  // Return the job ID and status
  return { 
    documentProcessed: true, 
    processingJobId: processingJob.id,
    processingType: processingJob.processingType,
    processingStatus: processingJob.status
  };
}

/**
 * Executes an integration sync action
 * 
 * @param step - The action step configuration
 * @returns The result of the integration sync
 * @throws Error if integration ID is missing
 */
async function executeIntegrationSync(step: WorkflowStep): Promise<Record<string, any>> {
  // Get the integration ID from the step config
  const integrationId = step.config.integrationId;
  if (!integrationId) {
    throw new Error('Integration ID is required for integration sync');
  }
  
  // Import the integration service
  const { syncIntegration } = await import('../integration/integrationService');
  
  // Perform the sync operation
  const syncResult = await syncIntegration(integrationId);
  
  // Return the sync result
  return { 
    integrationSynced: true, 
    integrationId,
    syncSuccess: syncResult.success,
    syncMessage: syncResult.message,
    syncedItems: syncResult.syncedItems
  };
}

/**
 * Executes a custom script action
 * 
 * @param step - The action step configuration
 * @param data - The current workflow data
 * @returns The result of the script execution
 */
async function executeCustomScriptAction(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  // Execute the custom script
  const scriptResult = await executeCustomScript(step.config.script, data);
  
  // Return the script execution result
  return { 
    scriptExecuted: true, 
    scriptResult 
  };
}

/**
 * Executes a custom script in a controlled environment
 * In a production environment, this would use proper sandboxing
 * 
 * @param script - The script to execute
 * @param data - The data to provide to the script
 * @returns The result of the script execution
 * @throws Error if script execution fails
 */
async function executeCustomScript(script: string, data: Record<string, any>): Promise<any> {
  // This is a simplified implementation
  // In production, you would use a proper sandboxed environment
  try {
    // Create a function from the script string with access to the data
    // WARNING: This is not secure and should not be used in production
    // eslint-disable-next-line no-new-func
    const scriptFunction = new Function('data', `
      "use strict";
      return (async () => {
        ${script}
      })();
    `);
    
    // Execute the script with the provided data
    return await scriptFunction(data);
  } catch (error) {
    throw new Error(`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves the execution history for a workflow
 * 
 * @param workflowId - The ID of the workflow to get history for
 * @returns Array of execution contexts for the workflow
 */
export const getWorkflowExecutionHistory = async (workflowId: string): Promise<WorkflowExecutionContext[]> => {
  // In a real implementation, this would fetch from a database
  return [];
};