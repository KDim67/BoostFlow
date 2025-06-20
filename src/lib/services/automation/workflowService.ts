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
  projectId?: string;
  organizationId?: string;
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

export const TRIGGER_TYPES = {
  'manual': 'Manual Trigger (User Initiated)'
};

export const ACTION_TYPES = {
  'task.create': 'Create Task',
  'task.update': 'Update Task',
  'task.assign': 'Assign Task'
};

export const CONDITION_TYPES = {
  'task.status.equals': 'Task Status is...',
  'task.priority.equals': 'Task Priority is...',
  'task.assignee.equals': 'Task is Assigned to...',
  'task.assignee.empty': 'Task is Unassigned',
  'task.duedate.overdue': 'Task is Overdue',
  'task.duedate.today': 'Task is Due Today',
  'task.duedate.thisweek': 'Task is Due This Week',
  'project.completion.above': 'Project Completion Above %',
  'project.completion.below': 'Project Completion Below %'
};



export const TASK_STATUSES = [
  'pending',
  'in-progress',
  'completed'
];

export const TASK_PRIORITIES = [
  'low',
  'medium',
  'high'
];

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<WorkflowStep, 'id'>[];
  triggerStepIndex: number;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'task-assignment-flow',
    name: 'Task Assignment Flow',
    description: 'Automatically assign tasks based on priority and team member availability',
    category: 'Task Management',
    steps: [
      {
        type: 'trigger',
        name: 'Manual Start',
        description: 'Start this workflow manually',
        config: { triggerType: 'manual' },
        nextSteps: ['step-1']
      },
      {
        type: 'condition',
        name: 'Check Task Priority',
        description: 'Check if task priority is high',
        config: {
          conditionType: 'task.priority.equals',
          expectedValue: 'high'
        },
        nextSteps: ['step-2', 'step-3']
      },
      {
        type: 'action',
        name: 'Assign High Priority Task',
        description: 'Assign high priority task to senior team member',
        config: {
          actionType: 'task.assign',
          taskData: {
            assignee: ''
          }
        },
        nextSteps: []
      },
      {
        type: 'action',
        name: 'Assign Regular Task',
        description: 'Assign regular task to available team member',
        config: {
          actionType: 'task.assign',
          taskData: {
            assignee: ''
          }
        },
        nextSteps: []
      }
    ],
    triggerStepIndex: 0
  },
  {
    id: 'overdue-task-reminder',
    name: 'Overdue Task Reminder',
    description: 'Create reminder tasks for overdue items and escalate if needed',
    category: 'Task Management',
    steps: [
      {
        type: 'trigger',
        name: 'Manual Start',
        description: 'Start this workflow manually',
        config: { triggerType: 'manual' },
        nextSteps: ['step-1']
      },
      {
        type: 'condition',
        name: 'Check if Task is Overdue',
        description: 'Check if the selected task is overdue',
        config: {
          conditionType: 'task.duedate.overdue'
        },
        nextSteps: ['step-2']
      },
      {
        type: 'action',
        name: 'Create Reminder Task',
        description: 'Create a reminder task for the overdue item',
        config: {
          actionType: 'task.create',
          taskData: {
            title: 'REMINDER: Overdue Task Follow-up',
            description: 'Please follow up on the overdue task',
            priority: 'high',
            assignee: ''
          }
        },
        nextSteps: []
      }
    ],
    triggerStepIndex: 0
  },
  {
    id: 'project-completion-tracker',
    name: 'Project Completion Tracker',
    description: 'Monitor project completion and create summary tasks when milestones are reached',
    category: 'Project Management',
    steps: [
      {
        type: 'trigger',
        name: 'Manual Start',
        description: 'Start this workflow manually',
        config: { triggerType: 'manual' },
        nextSteps: ['step-1']
      },
      {
        type: 'condition',
        name: 'Check Project Completion',
        description: 'Check if project is above 80% completion',
        config: {
          conditionType: 'project.completion.above',
          percentage: 80
        },
        nextSteps: ['step-2', 'step-3']
      },
      {
        type: 'action',
        name: 'Create Project Review Task',
        description: 'Create a task for final project review',
        config: {
          actionType: 'task.create',
          taskData: {
            title: 'Final Project Review',
            description: 'Conduct final review before project completion',
            priority: 'high',
            assignee: ''
          }
        },
        nextSteps: []
      },
      {
        type: 'action',
        name: 'Update Project Status',
        description: 'Update project status to near completion',
        config: {
          actionType: 'task.create',
          taskData: {
            title: 'Update Project Status',
            description: 'Update stakeholders on project progress',
            priority: 'medium',
            assignee: ''
          }
        },
        nextSteps: []
      }
    ],
    triggerStepIndex: 0
  },
  {
    id: 'task-status-updater',
    name: 'Task Status Updater',
    description: 'Update task status and create follow-up actions based on completion',
    category: 'Task Management',
    steps: [
      {
        type: 'trigger',
        name: 'Manual Start',
        description: 'Start this workflow manually',
        config: { triggerType: 'manual' },
        nextSteps: ['step-1']
      },
      {
        type: 'action',
        name: 'Mark Task as Completed',
        description: 'Update the task status to completed',
        config: {
          actionType: 'task.update',
          taskData: {
            status: 'completed'
          }
        },
        nextSteps: ['step-2']
      },
      {
        type: 'action',
        name: 'Create Follow-up Task',
        description: 'Create a follow-up task for quality review',
        config: {
          actionType: 'task.create',
          taskData: {
            title: 'Quality Review',
            description: 'Review the completed task for quality assurance',
            priority: 'medium',
            assignee: ''
          }
        },
        nextSteps: []
      }
    ],
    triggerStepIndex: 0
  }
];

export const getWorkflowTemplates = (): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES;
};

export const getWorkflowTemplateById = (templateId: string): WorkflowTemplate | null => {
  return WORKFLOW_TEMPLATES.find(template => template.id === templateId) || null;
};

export const createWorkflowFromTemplate = (template: WorkflowTemplate): { steps: WorkflowStep[], triggerStep: WorkflowStep } => {
  const timestamp = Date.now();
  
  const steps: WorkflowStep[] = template.steps.map((step, index) => ({
    ...step,
    id: `step-${timestamp}-${index}`,
    nextSteps: []
  }));
  
  template.steps.forEach((templateStep, index) => {
    steps[index].nextSteps = templateStep.nextSteps.map(nextStepRef => {
      if (nextStepRef.startsWith('step-')) {
        const refIndex = parseInt(nextStepRef.split('-')[1]);
        if (!isNaN(refIndex) && refIndex < steps.length) {
          return steps[refIndex].id;
        }
      }
      return nextStepRef;
    });
  });
  
  const triggerStep = steps[template.triggerStepIndex];
  
  return { steps, triggerStep };
};



export const createWorkflow = async (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> & { projectId: string; organizationId?: string }): Promise<Workflow> => {
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
    throw new Error('Workflow must have a manual trigger step');
  }
  
  if (triggerStep.type !== 'trigger') {
    throw new Error('The trigger step must be of type "trigger"');
  }
  
  if (triggerStep.config.triggerType !== 'manual') {
    throw new Error('All workflows must use manual triggers only');
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
      
      context.data.lastConditionResult = conditionResult;
      
      break;
      
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
  
  const { conditionType, expectedValue, taskId, percentage } = step.config;
  
  switch (conditionType) {
    case 'task.status.equals':
      return await evaluateTaskStatus(taskId || data.taskId, expectedValue, data);
      
    case 'task.priority.equals':
      return await evaluateTaskPriority(taskId || data.taskId, expectedValue, data);
      
    case 'task.assignee.equals':
      return await evaluateTaskAssignee(taskId || data.taskId, expectedValue, data);
      
    case 'task.assignee.empty':
      return await evaluateTaskUnassigned(taskId || data.taskId, data);
      
    case 'task.duedate.overdue':
      return await evaluateTaskOverdue(taskId || data.taskId, data);
      
    case 'task.duedate.today':
      return await evaluateTaskDueToday(taskId || data.taskId, data);
      
    case 'task.duedate.thisweek':
      return await evaluateTaskDueThisWeek(taskId || data.taskId, data);
      
    case 'project.completion.above':
      return await evaluateProjectCompletionAbove(data.projectId, percentage, data);
      
    case 'project.completion.below':
      return await evaluateProjectCompletionBelow(data.projectId, percentage, data);
      

      
    default:
        throw new Error(`Unknown condition type: ${conditionType}`);
  }
}

async function evaluateTaskStatus(taskId: string, expectedStatus: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    return task?.status === expectedStatus;
  } catch (error) {
    console.error('Error evaluating task status:', error);
    return false;
  }
}

async function evaluateTaskPriority(taskId: string, expectedPriority: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    return task?.priority === expectedPriority;
  } catch (error) {
    console.error('Error evaluating task priority:', error);
    return false;
  }
}

async function evaluateTaskAssignee(taskId: string, expectedAssignee: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    return task?.assignedTo === expectedAssignee || task?.assignee === expectedAssignee;
  } catch (error) {
    console.error('Error evaluating task assignee:', error);
    return false;
  }
}

async function evaluateTaskUnassigned(taskId: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    return !task?.assignedTo || task?.assignedTo === '' || task?.assignee === 'Unassigned';
  } catch (error) {
    console.error('Error evaluating task assignment:', error);
    return false;
  }
}

async function evaluateTaskOverdue(taskId: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    
    if (!task?.dueDate || task.status === 'completed') return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return dueDate < today;
  } catch (error) {
    console.error('Error evaluating task overdue:', error);
    return false;
  }
}

async function evaluateTaskDueToday(taskId: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    
    if (!task?.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    
    return dueDate.toDateString() === today.toDateString();
  } catch (error) {
    console.error('Error evaluating task due today:', error);
    return false;
  }
}

async function evaluateTaskDueThisWeek(taskId: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    
    if (!task?.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return dueDate >= today && dueDate <= weekFromNow;
  } catch (error) {
    console.error('Error evaluating task due this week:', error);
    return false;
  }
}

async function evaluateProjectCompletionAbove(projectId: string, percentage: number, data: Record<string, any>): Promise<boolean> {
  if (!projectId || percentage === undefined) return false;
  
  try {
    const { queryDocuments } = await import('@/lib/firebase/firestoreService');
    const { where } = await import('firebase/firestore');
    
    const tasks = await queryDocuments('tasks', [
      where('projectId', '==', projectId)
    ]);
    
    if (tasks.length === 0) return false;
    
    const completedTasks = tasks.filter((task: any) => task.status === 'completed');
    const completionPercentage = (completedTasks.length / tasks.length) * 100;
    
    return completionPercentage > percentage;
  } catch (error) {
    console.error('Error evaluating project completion above:', error);
    return false;
  }
}

async function evaluateProjectCompletionBelow(projectId: string, percentage: number, data: Record<string, any>): Promise<boolean> {
  if (!projectId || percentage === undefined) return false;
  
  try {
    const { queryDocuments } = await import('@/lib/firebase/firestoreService');
    const { where } = await import('firebase/firestore');
    
    const tasks = await queryDocuments('tasks', [
      where('projectId', '==', projectId)
    ]);
    
    if (tasks.length === 0) return false;
    
    const completedTasks = tasks.filter((task: any) => task.status === 'completed');
    const completionPercentage = (completedTasks.length / tasks.length) * 100;
    
    return completionPercentage < percentage;
  } catch (error) {
    console.error('Error evaluating project completion below:', error);
    return false;
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
        
      case 'task.update':
        return await executeTaskUpdate(step, data);
        
      case 'task.assign':
        return await executeTaskAssign(step, data);
        
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute ${actionType} action: ${errorMessage}`);
  }
}

async function executeTaskCreate(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  const { createDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  const taskData = {
    title: step.config.taskData.title || 'New Task',
    description: step.config.taskData.description || '',
    assignee: step.config.taskData.assignee || 'Unassigned',
    assignedTo: step.config.taskData.assignee || undefined,
    priority: step.config.taskData.priority || 'medium',
    dueDate: step.config.taskData.dueDate || '',
    status: 'pending' as const,
    projectId: step.config.taskData.projectId || data.projectId,
    organizationId: step.config.taskData.organizationId || data.organizationId,
    createdBy: data.currentUser || 'system',
    createdAt: serverTimestamp(),
    timeSpent: 0
  };
  
  if (!taskData.projectId) {
    throw new Error('Project ID is required for task creation');
  }
  
  if (!taskData.organizationId) {
    throw new Error('Organization ID is required for task creation');
  }
  
  const taskId = await createDocument('tasks', taskData);
  
  return { taskId, taskCreated: true, taskData: { ...taskData, id: taskId } };
}

async function executeTaskUpdate(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  const { updateDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  const taskId = step.config.taskData.taskId || data.taskId;
  
  if (!taskId) {
    throw new Error('Task ID is required for task update');
  }
  
  const updateData: Record<string, any> = {};
  
  if (step.config.taskData.title !== undefined) {
    updateData.title = step.config.taskData.title;
  }
  if (step.config.taskData.description !== undefined) {
    updateData.description = step.config.taskData.description;
  }
  if (step.config.taskData.status !== undefined) {
    updateData.status = step.config.taskData.status;
    if (step.config.taskData.status === 'completed') {
      updateData.completedAt = serverTimestamp();
    }
  }
  if (step.config.taskData.priority !== undefined) {
    updateData.priority = step.config.taskData.priority;
  }
  if (step.config.taskData.dueDate !== undefined) {
    updateData.dueDate = step.config.taskData.dueDate;
  }
  if (step.config.taskData.assignee !== undefined) {
    updateData.assignee = step.config.taskData.assignee;
    updateData.assignedTo = step.config.taskData.assignee;
  }
  
  await updateDocument('tasks', taskId, updateData);
  
  return { taskUpdated: true, taskId, updateData };
}

async function executeTaskAssign(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  const { updateDocument } = await import('@/lib/firebase/firestoreService');
  
  const taskId = step.config.taskData.taskId || data.taskId;
  const assignee = step.config.taskData.assignee;
  const assignedBy = step.config.taskData.assignedBy || data.currentUser;
  
  if (!taskId) {
    throw new Error('Task ID is required for task assignment');
  }
  
  if (!assignee) {
    throw new Error('Assignee is required for task assignment');
  }
  
  const updateData = {
    assignee,
    assignedTo: assignee,
    assignedBy
  };
  
  await updateDocument('tasks', taskId, updateData);
  
  return { taskAssigned: true, taskId, assignee, assignedBy };
}

