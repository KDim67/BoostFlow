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
  triggerStep: string;
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

export const TRIGGER_TYPES = [
  'task.created',
  'task.updated',
  'task.completed',
  'project.created',
  'project.updated',
  'scheduled.daily',
  'scheduled.weekly',
  'manual'
] as const;

export const ACTION_TYPES = [
  'task.create',
  'task.update',
  'task.assign',
  'notification.send',
  'email.send',
  'integration.sync'
] as const;

export const CONDITION_TYPES = [
  'task.status',
  'task.assignee',
  'project.status',
  'user.role',
  'date.compare',
  'data.compare'
];

export const createWorkflow = async (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> & { projectId: string }): Promise<Workflow> => {
  const { createDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  const workflowData = {
    ...workflow,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const newWorkflow: Workflow = {
    ...workflow,
    id: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  validateWorkflow(newWorkflow);
  
  try {
    const docId = await createDocument('workflows', workflowData);
    return {
      ...newWorkflow,
      id: docId
    };
  } catch (error) {
    console.error('Error creating workflow:', error);
    throw new Error('Failed to create workflow');
  }
};

export const getWorkflow = async (workflowId: string): Promise<Workflow | null> => {
  const { getDocument } = await import('@/lib/firebase/firestoreService');
  
  try {
    const workflow = await getDocument('workflows', workflowId);
    if (!workflow) {
      return null;
    }
    
    return convertFirestoreWorkflow(workflow) as Workflow;
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return null;
  }
};

export const getWorkflowsByProject = async (projectId: string): Promise<Workflow[]> => {
  const { queryDocuments } = await import('@/lib/firebase/firestoreService');
  const { where } = await import('firebase/firestore');
  
  try {
    const workflows = await queryDocuments('workflows', [
      where('projectId', '==', projectId)
    ]);
    return workflows.map(workflow => convertFirestoreWorkflow(workflow)) as Workflow[];
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return [];
  }
};

const convertFirestoreWorkflow = (firestoreData: any): Workflow => {
  const workflow = { ...firestoreData };
  
  if (workflow.createdAt && typeof workflow.createdAt.toDate === 'function') {
    workflow.createdAt = workflow.createdAt.toDate();
  }
  if (workflow.updatedAt && typeof workflow.updatedAt.toDate === 'function') {
    workflow.updatedAt = workflow.updatedAt.toDate();
  }
  
  return workflow;
};

export const updateWorkflow = async (workflowId: string, updates: Partial<Omit<Workflow, 'id' | 'createdAt'>>): Promise<Workflow | null> => {
  const { updateDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  try {
    const existingWorkflow = await getWorkflow(workflowId);
    
    if (!existingWorkflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }
    
    const updatedWorkflow: Workflow = {
      ...existingWorkflow,
      ...updates,
      updatedAt: new Date()
    };
    
    validateWorkflow(updatedWorkflow);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDocument('workflows', workflowId, updateData);
    
    return updatedWorkflow;
  } catch (error) {
    console.error('Error updating workflow:', error);
    throw new Error('Failed to update workflow');
  }
};

export const deleteWorkflow = async (workflowId: string): Promise<void> => {
  const { deleteDocument } = await import('@/lib/firebase/firestoreService');
  
  try {
    await deleteDocument('workflows', workflowId);
  } catch (error) {
    console.error('Error deleting workflow:', error);
    throw new Error('Failed to delete workflow');
  }
};

function validateWorkflow(workflow: Workflow): void {
  const triggerStep = workflow.steps.find(step => step.id === workflow.triggerStep);
  
  if (!triggerStep) {
    throw new Error('Workflow must have a trigger step');
  }
  
  if (triggerStep.type !== 'trigger') {
    throw new Error('The trigger step must be of type "trigger"');
  }
  
  const stepIds = new Set(workflow.steps.map(step => step.id));
  
  for (const step of workflow.steps) {
    for (const nextStepId of step.nextSteps) {
      if (!stepIds.has(nextStepId)) {
        throw new Error(`Step ${step.id} references non-existent next step ${nextStepId}`);
      }
    }
  }
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function checkForCycles(stepId: string): boolean {
    if (!stepIds.has(stepId)) {
      return false;
    }
    
    if (recursionStack.has(stepId)) {
      return true;
    }
    
    if (visited.has(stepId)) {
      return false;
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
  
  if (checkForCycles(workflow.triggerStep)) {
    throw new Error('Workflow contains cycles, which are not allowed');
  }
}

export const executeWorkflow = async (workflowId: string, initialData: Record<string, any> = {}): Promise<WorkflowExecutionContext> => {
  const workflow = await getWorkflow(workflowId);
  
  if (!workflow) {
    throw new Error(`Workflow with ID ${workflowId} not found`);
  }
  
  if (!workflow.isActive) {
    throw new Error(`Workflow with ID ${workflowId} is not active`);
  }
  
  const executionContext: WorkflowExecutionContext = {
    workflowId,
    executionId: `exec-${Date.now()}`,
    startedAt: new Date(),
    status: 'running',
    data: { ...initialData }
  };
  
  try {
    const triggerStep = workflow.steps.find(step => step.id === workflow.triggerStep);
    
    if (!triggerStep) {
      throw new Error(`Trigger step not found in workflow ${workflowId}`);
    }
    
    await executeWorkflowStep(workflow, triggerStep.id, executionContext);
    
    executionContext.status = 'completed';
    executionContext.completedAt = new Date();
  } catch (error) {
    executionContext.status = 'failed';
    executionContext.error = error instanceof Error ? error.message : String(error);
    executionContext.completedAt = new Date();
  }
  
  return executionContext;
};

async function executeWorkflowStep(workflow: Workflow, stepId: string, context: WorkflowExecutionContext): Promise<void> {
  const step = workflow.steps.find(s => s.id === stepId);
  
  if (!step) {
    throw new Error(`Step with ID ${stepId} not found in workflow ${workflow.id}`);
  }
  
  context.currentStep = stepId;
  

  switch (step.type) {
    case 'trigger':
      break;
      
    case 'condition':
      const conditionResult = await evaluateCondition(step, context.data);
      
      const nextStepIndex = conditionResult ? 0 : 1;
      
      if (step.nextSteps.length > nextStepIndex) {
        await executeWorkflowStep(workflow, step.nextSteps[nextStepIndex], context);
      }
      return;
      
    case 'action':
      const actionResult = await executeAction(step, context.data);
      
      context.data = { ...context.data, ...actionResult };
      break;
      
    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
  
  for (const nextStepId of step.nextSteps) {
    await executeWorkflowStep(workflow, nextStepId, context);
  }
}

async function evaluateCondition(step: WorkflowStep, data: Record<string, any>): Promise<boolean> {
  if (step.type !== 'condition') {
    throw new Error('Cannot evaluate non-condition step');
  }
  
  const { conditionType, field, operator, value } = step.config;
  
  const actualValue = field.includes('.') ? 
    field.split('.').reduce((obj: any, key: string) => obj && obj[key], data) : 
    data[field];
  
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

async function executeAction(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  if (step.type !== 'action') {
    throw new Error('Cannot execute non-action step');
  }
  
  const { actionType } = step.config;
  
  try {
    switch (actionType) {
      case 'task.create':
        return await executeTaskCreate(step, data);
        
      case 'notification.send':
        return await executeNotificationSend(step);
        
      case 'email.send':
        return await executeEmailSend(step);
        

      case 'integration.sync':
        return await executeIntegrationSync(step);
        
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute ${actionType} action: ${errorMessage}`);
  }
}

async function executeTaskCreate(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  const taskData = {
    title: step.config.taskData.title || 'New Task',
    description: step.config.taskData.description || '',
    assignee: step.config.taskData.assignee || '',
    priority: step.config.taskData.priority || 'normal',
    dueDate: step.config.taskData.dueDate || null,
    projectId: step.config.taskData.projectId || data.projectId
  };
  
  const taskId = `task-${Date.now()}`;
  
  return { taskId, taskCreated: true, taskData };
}

async function executeNotificationSend(step: WorkflowStep): Promise<Record<string, any>> {
  const notificationData = {
    recipient: step.config.recipient,
    message: step.config.message,
    type: step.config.type || 'info',
    channel: step.config.channel || 'app'
  };
  
  return { notificationSent: true, notificationData };
}

async function executeEmailSend(step: WorkflowStep): Promise<Record<string, any>> {
  const emailData = {
    recipient: step.config.recipient,
    subject: step.config.subject,
    body: step.config.body,
    attachments: step.config.attachments || [],
    cc: step.config.cc || [],
    bcc: step.config.bcc || []
  };
  
  return { emailSent: true, emailData };
}

async function executeIntegrationSync(step: WorkflowStep): Promise<Record<string, any>> {
  const integrationId = step.config.integrationId;
  if (!integrationId) {
    throw new Error('Integration ID is required for integration sync');
  }
  
  const { syncIntegration } = await import('../integration/integrationService');
  
  const syncResult = await syncIntegration(integrationId);
  
  return { 
    integrationSynced: true, 
    integrationId,
    syncSuccess: syncResult.success,
    syncMessage: syncResult.message,
    syncedItems: syncResult.syncedItems
  };
}

export const getWorkflowExecutionHistory = async (workflowId: string): Promise<WorkflowExecutionContext[]> => {
  const { queryDocuments } = await import('@/lib/firebase/firestoreService');
  const { where, orderBy } = await import('firebase/firestore');
  
  try {
    const executions = await queryDocuments('workflowExecutions', [
      where('workflowId', '==', workflowId),
      orderBy('startedAt', 'desc')
    ]);
    
    return executions.map(execution => ({
      ...execution,
      startedAt: execution.startedAt?.toDate?.() || execution.startedAt,
      completedAt: execution.completedAt?.toDate?.() || execution.completedAt
    })) as WorkflowExecutionContext[];
  } catch (error) {
    console.error('Error fetching workflow execution history:', error);
    return [];
  }
};

export const saveWorkflowExecution = async (execution: WorkflowExecutionContext): Promise<void> => {
  const { createDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  try {
    const executionData = {
      ...execution,
      startedAt: serverTimestamp(),
      completedAt: execution.completedAt ? serverTimestamp() : null
    };
    
    await createDocument('workflowExecutions', executionData, execution.executionId);
  } catch (error) {
    console.error('Error saving workflow execution:', error);
    throw new Error('Failed to save workflow execution');
  }
};