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

export const createWorkflow = async (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> => {
  const newWorkflow: Workflow = {
    ...workflow,
    id: `workflow-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  validateWorkflow(newWorkflow);
  
  return newWorkflow;
};

export const getWorkflow = async (workflowId: string): Promise<Workflow | null> => {

  return {
    id: workflowId,
    name: 'Task Approval Workflow',
    description: 'Automatically routes tasks for approval',
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    isActive: true,
    triggerStep: 'step-1',
    steps: [
      {
        id: 'step-1',
        type: 'trigger',
        name: 'Task Created',
        description: 'Triggered when a new task is created',
        config: { triggerType: 'task.created' },
        nextSteps: ['step-2']
      },
      {
        id: 'step-2',
        type: 'condition',
        name: 'Is High Priority',
        description: 'Checks if the task is marked as high priority',
        config: { 
          conditionType: 'task.status',
          field: 'priority',
          operator: 'equals',
          value: 'high'
        },
        nextSteps: ['step-3', 'step-4']
      },
      {
        id: 'step-3',
        type: 'action',
        name: 'Route to Manager',
        description: 'Routes the task to the manager',
        config: { 
          actionType: 'task.create',
          taskData: {
            title: 'Review high priority task',
            assignee: 'manager',
            priority: 'high'
          }
        },
        nextSteps: []
      },
      {
        id: 'step-4',
        type: 'action',
        name: 'Standard Approval',
        description: 'Routes the task for standard approval',
        config: { 
          actionType: 'task.create',
          taskData: {
            title: 'Review task',
            assignee: 'team-member',
            priority: 'normal'
          }
        },
        nextSteps: []
      }
    ]
  };
};

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
  
  validateWorkflow(updatedWorkflow);
  
  return updatedWorkflow;
};

export const deleteWorkflow = async (id: string): Promise<boolean> => {
  return true;
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
  return [];
};