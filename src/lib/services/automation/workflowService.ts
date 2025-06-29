/**
 * Represents a single step in a workflow automation
 * Each step can be a trigger (start point), condition (decision), or action (task execution)
 */
export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action'; // Defines the step behavior type
  name: string;
  description: string;
  config: Record<string, any>; // Step-specific configuration (trigger type, condition rules, action parameters)
  nextSteps: string[]; // Array of step IDs to execute after this step completes
}

/**
 * Complete workflow definition containing all steps and metadata
 * Workflows are directed acyclic graphs starting from a trigger step
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  createdBy: string; // User ID who created the workflow
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean; // Whether the workflow can be executed
  steps: WorkflowStep[]; // All steps in the workflow
  triggerStep: string; // ID of the step that starts the workflow
  projectId?: string; // Optional project scope
  organizationId?: string; // Optional organization scope
}

/**
 * Runtime context for workflow execution
 * Tracks execution state, data flow, and results across workflow steps
 */
export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string; // Unique identifier for this execution instance
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  currentStep?: string; // ID of the currently executing step
  data: Record<string, any>; // Shared data passed between workflow steps
  error?: string; // Error message if execution failed
}

// Available trigger types for workflow initiation
export const TRIGGER_TYPES = {
  'manual': 'Manual Trigger (User Initiated)' // Currently only manual triggers are supported
};

// Available action types that workflows can execute
export const ACTION_TYPES = {
  'task.create': 'Create Task',
  'task.update': 'Update Task',
  'task.assign': 'Assign Task'
};

// Available condition types for workflow decision points
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



// Valid task status values used in workflow conditions and actions
export const TASK_STATUSES = [
  'pending',
  'in-progress',
  'completed'
];

// Valid task priority levels used in workflow conditions and actions
export const TASK_PRIORITIES = [
  'low',
  'medium',
  'high'
];

/**
 * Template for creating pre-configured workflows
 * Templates provide common workflow patterns that users can instantiate
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string; // Grouping category for UI organization
  steps: Omit<WorkflowStep, 'id'>[]; // Step definitions without IDs
  triggerStepIndex: number; // Index of the trigger step in the steps array
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

/**
 * Retrieves all available workflow templates
 * @returns Array of all workflow templates
 */
export const getWorkflowTemplates = (): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES;
};

/**
 * Finds a specific workflow template by its ID
 * @param templateId - The unique identifier of the template
 * @returns The template if found, null otherwise
 */
export const getWorkflowTemplateById = (templateId: string): WorkflowTemplate | null => {
  return WORKFLOW_TEMPLATES.find(template => template.id === templateId) || null;
};

/**
 * Creates a new workflow instance from a template
 * Generates unique step IDs and resolves step references
 * @param template - The workflow template to instantiate
 * @returns Object containing the workflow steps and trigger step
 */
export const createWorkflowFromTemplate = (template: WorkflowTemplate): { steps: WorkflowStep[], triggerStep: WorkflowStep } => {
  const timestamp = Date.now();
  
  // Create steps with unique IDs, initially with empty nextSteps
  const steps: WorkflowStep[] = template.steps.map((step, index) => ({
    ...step,
    id: `step-${timestamp}-${index}`,
    nextSteps: []
  }));
  
  // Resolve step references by converting template indices to actual step IDs
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



/**
 * Creates a new workflow in the database
 * Validates workflow structure before saving to ensure integrity
 * @param workflow - Workflow data without auto-generated fields
 * @returns Promise resolving to the created workflow with generated ID
 */
export const createWorkflow = async (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> & { projectId: string; organizationId?: string }): Promise<Workflow> => {
  const { createDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  // Prepare data for Firestore with server timestamps
  const workflowData = {
    ...workflow,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  // Create local workflow object for validation
  const newWorkflow: Workflow = {
    ...workflow,
    id: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Validate workflow structure before saving
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

/**
 * Retrieves a single workflow by its ID
 * @param workflowId - The unique identifier of the workflow
 * @returns Promise resolving to the workflow or null if not found
 */
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

/**
 * Retrieves all workflows associated with a specific project
 * @param projectId - The project identifier to filter workflows
 * @returns Promise resolving to array of workflows for the project
 */
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

/**
 * Converts Firestore document data to Workflow object
 * Handles Firestore timestamp conversion to JavaScript Date objects
 * @param firestoreData - Raw data from Firestore document
 * @returns Converted workflow object with proper Date types
 */
const convertFirestoreWorkflow = (firestoreData: any): Workflow => {
  const workflow = { ...firestoreData };
  
  // Convert Firestore timestamps to JavaScript Date objects
  if (workflow.createdAt && typeof workflow.createdAt.toDate === 'function') {
    workflow.createdAt = workflow.createdAt.toDate();
  }
  if (workflow.updatedAt && typeof workflow.updatedAt.toDate === 'function') {
    workflow.updatedAt = workflow.updatedAt.toDate();
  }
  
  return workflow;
};

/**
 * Updates an existing workflow with new data
 * Validates the updated workflow before saving changes
 * @param workflowId - ID of the workflow to update
 * @param updates - Partial workflow data to update
 * @returns Promise resolving to the updated workflow or null if not found
 */
export const updateWorkflow = async (workflowId: string, updates: Partial<Omit<Workflow, 'id' | 'createdAt'>>): Promise<Workflow | null> => {
  const { updateDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  try {
    const existingWorkflow = await getWorkflow(workflowId);
    
    if (!existingWorkflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }
    
    // Merge existing workflow with updates
    const updatedWorkflow: Workflow = {
      ...existingWorkflow,
      ...updates,
      updatedAt: new Date()
    };
    
    // Validate the updated workflow structure
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

/**
 * Permanently deletes a workflow from the database
 * @param workflowId - ID of the workflow to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteWorkflow = async (workflowId: string): Promise<void> => {
  const { deleteDocument } = await import('@/lib/firebase/firestoreService');
  
  try {
    await deleteDocument('workflows', workflowId);
  } catch (error) {
    console.error('Error deleting workflow:', error);
    throw new Error('Failed to delete workflow');
  }
};

/**
 * Validates workflow structure and integrity
 * Ensures the workflow is a valid directed acyclic graph with proper trigger setup
 * @param workflow - The workflow to validate
 * @throws Error if validation fails with descriptive message
 */
function validateWorkflow(workflow: Workflow): void {
  // Validate trigger step exists and is properly configured
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
  
  // Validate all step references point to existing steps
  const stepIds = new Set(workflow.steps.map(step => step.id));
  
  for (const step of workflow.steps) {
    for (const nextStepId of step.nextSteps) {
      if (!stepIds.has(nextStepId)) {
        throw new Error(`Step ${step.id} references non-existent next step ${nextStepId}`);
      }
    }
  }
  
  // Check for cycles using depth-first search with recursion stack
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  /**
   * Recursively checks for cycles in the workflow graph
   * Uses DFS with a recursion stack to detect back edges
   * @param stepId - Current step being examined
   * @returns true if a cycle is detected, false otherwise
   */
  function checkForCycles(stepId: string): boolean {
    if (!stepIds.has(stepId)) {
      return false;
    }
    
    // If step is in recursion stack, we found a back edge (cycle)
    if (recursionStack.has(stepId)) {
      return true;
    }
    
    // If already visited and not in recursion stack, no cycle from this path
    if (visited.has(stepId)) {
      return false;
    }
    
    // Mark as visited and add to recursion stack
    visited.add(stepId);
    recursionStack.add(stepId);
    
    // Check all connected steps
    const step = workflow.steps.find(s => s.id === stepId);
    if (step) {
      for (const nextStepId of step.nextSteps) {
        if (checkForCycles(nextStepId)) {
          return true;
        }
      }
    }
    
    // Remove from recursion stack when backtracking
    recursionStack.delete(stepId);
    return false;
  }
  
  if (checkForCycles(workflow.triggerStep)) {
    throw new Error('Workflow contains cycles, which are not allowed');
  }
}

/**
 * Executes a workflow from start to finish
 * Creates execution context and processes all steps in the workflow graph
 * @param workflowId - ID of the workflow to execute
 * @param initialData - Initial data to pass to the workflow execution
 * @returns Promise resolving to the execution context with results and status
 */
export const executeWorkflow = async (workflowId: string, initialData: Record<string, any> = {}): Promise<WorkflowExecutionContext> => {
  const workflow = await getWorkflow(workflowId);
  
  if (!workflow) {
    throw new Error(`Workflow with ID ${workflowId} not found`);
  }
  
  if (!workflow.isActive) {
    throw new Error(`Workflow with ID ${workflowId} is not active`);
  }
  
  // Initialize execution context with unique execution ID
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
    
    // Start execution from the trigger step
    await executeWorkflowStep(workflow, triggerStep.id, executionContext);
    
    // Mark as completed if no errors occurred
    executionContext.status = 'completed';
    executionContext.completedAt = new Date();
  } catch (error) {
    // Handle execution failures
    executionContext.status = 'failed';
    executionContext.error = error instanceof Error ? error.message : String(error);
    executionContext.completedAt = new Date();
  }
  
  return executionContext;
};

/**
 * Recursively executes a single workflow step and its subsequent steps
 * Handles different step types (trigger, condition, action) and manages data flow
 * @param workflow - The workflow being executed
 * @param stepId - ID of the current step to execute
 * @param context - Execution context containing shared data and state
 */
async function executeWorkflowStep(workflow: Workflow, stepId: string, context: WorkflowExecutionContext): Promise<void> {
  const step = workflow.steps.find(s => s.id === stepId);
  
  if (!step) {
    throw new Error(`Step with ID ${stepId} not found in workflow ${workflow.id}`);
  }
  
  // Update context to track current step
  context.currentStep = stepId;
  
  // Execute step based on its type
  switch (step.type) {
    case 'trigger':
      // Trigger steps just initiate the workflow, no processing needed
      break;
      
    case 'condition':
      // Evaluate condition and store result for potential use by subsequent steps
      const conditionResult = await evaluateCondition(step, context.data);
      context.data.lastConditionResult = conditionResult;
      break;
      
    case 'action':
      // Execute action and merge results into context data
      const actionResult = await executeAction(step, context.data);
      context.data = { ...context.data, ...actionResult };
      break;
      
    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
  
  // Recursively execute all next steps
  for (const nextStepId of step.nextSteps) {
    await executeWorkflowStep(workflow, nextStepId, context);
  }
}

/**
 * Evaluates a condition step to determine workflow branching
 * Dispatches to specific evaluation functions based on condition type
 * @param step - The condition step to evaluate
 * @param data - Current workflow execution data
 * @returns Promise resolving to boolean result of the condition
 */
async function evaluateCondition(step: WorkflowStep, data: Record<string, any>): Promise<boolean> {
  if (step.type !== 'condition') {
    throw new Error('Cannot evaluate non-condition step');
  }
  
  const { conditionType, expectedValue, taskId, percentage } = step.config;
  
  // Route to appropriate evaluation function based on condition type
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

/**
 * Evaluates if a task has a specific status
 * @param taskId - ID of the task to check
 * @param expectedStatus - The status to compare against
 * @param data - Workflow execution data (unused but kept for consistency)
 * @returns Promise resolving to true if task status matches expected value
 */
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

/**
 * Evaluates if a task has a specific priority level
 * @param taskId - ID of the task to check
 * @param expectedPriority - The priority level to compare against
 * @param data - Workflow execution data (unused but kept for consistency)
 * @returns Promise resolving to true if task priority matches expected value
 */
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

/**
 * Evaluates if a task is assigned to a specific user
 * Checks both assignedTo and assignee fields for compatibility
 * @param taskId - ID of the task to check
 * @param expectedAssignee - The user ID or name to compare against
 * @param data - Workflow execution data (unused but kept for consistency)
 * @returns Promise resolving to true if task is assigned to the expected user
 */
async function evaluateTaskAssignee(taskId: string, expectedAssignee: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    // Check both possible assignee field names for backward compatibility
    return task?.assignedTo === expectedAssignee || task?.assignee === expectedAssignee;
  } catch (error) {
    console.error('Error evaluating task assignee:', error);
    return false;
  }
}

/**
 * Evaluates if a task is currently unassigned
 * Checks for null, empty string, or 'Unassigned' values
 * @param taskId - ID of the task to check
 * @param data - Workflow execution data (unused but kept for consistency)
 * @returns Promise resolving to true if task has no assignee
 */
async function evaluateTaskUnassigned(taskId: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    // Consider task unassigned if assignedTo is fals, empty, or explicitly 'Unassigned'
    return !task?.assignedTo || task?.assignedTo === '' || task?.assignee === 'Unassigned';
  } catch (error) {
    console.error('Error evaluating task assignment:', error);
    return false;
  }
}

/**
 * Evaluates if a task is overdue
 * Completed tasks are never considered overdue
 * @param taskId - ID of the task to check
 * @param data - Workflow execution data
 * @returns Promise resolving to true if task is overdue and not completed
 */
async function evaluateTaskOverdue(taskId: string, data: Record<string, any>): Promise<boolean> {
  if (!taskId) return false;
  
  try {
    const { getDocument } = await import('@/lib/firebase/firestoreService');
    const task = await getDocument('tasks', taskId);
    
    // Tasks without due dates or completed tasks are never overdue
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

/**
 * Evaluates if a task is due within the current week
 * Week is calculated from today through the end of Saturday
 * @param taskId - ID of the task to check
 * @param data - Workflow execution data
 * @returns Promise resolving to true if task is due between today and end of week
 */
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

/**
 * Evaluates if a project's completion percentage is above a threshold
 * Calculates completion based on completed vs total tasks
 * @param projectId - ID of the project to evaluate
 * @param percentage - Minimum completion percentage (0-100)
 * @param data - Workflow execution data
 * @returns Promise resolving to true if completion percentage exceeds threshold
 */
async function evaluateProjectCompletionAbove(projectId: string, percentage: number, data: Record<string, any>): Promise<boolean> {
  if (!projectId || percentage === undefined) return false;
  
  try {
    const { queryDocuments } = await import('@/lib/firebase/firestoreService');
    const { where } = await import('firebase/firestore');
    
    const tasks = await queryDocuments('tasks', [
      where('projectId', '==', projectId)
    ]);
    
    // Projects with no tasks are considered 0% complete
    if (tasks.length === 0) return false;
    
    const completedTasks = tasks.filter((task: any) => task.status === 'completed');
    const completionPercentage = (completedTasks.length / tasks.length) * 100;
    
    return completionPercentage > percentage;
  } catch (error) {
    console.error('Error evaluating project completion above:', error);
    return false;
  }
}

/**
 * Evaluates if a project's completion percentage is below a threshold
 * Projects with no tasks are considered 0% complete (below any positive threshold)
 * @param projectId - ID of the project to evaluate
 * @param percentage - Maximum completion percentage (0-100)
 * @param data - Workflow execution data
 * @returns Promise resolving to true if completion percentage is below threshold
 */
async function evaluateProjectCompletionBelow(projectId: string, percentage: number, data: Record<string, any>): Promise<boolean> {
  if (!projectId || percentage === undefined) return false;
  
  try {
    const { queryDocuments } = await import('@/lib/firebase/firestoreService');
    const { where } = await import('firebase/firestore');
    
    const tasks = await queryDocuments('tasks', [
      where('projectId', '==', projectId)
    ]);
    
    // Projects with no tasks are considered 0% complete
    if (tasks.length === 0) return true;
    
    const completedTasks = tasks.filter((task: any) => task.status === 'completed');
    const completionPercentage = (completedTasks.length / tasks.length) * 100;
    
    return completionPercentage < percentage;
  } catch (error) {
    console.error('Error evaluating project completion below:', error);
    return false;
  }
}





/**
 * Executes a workflow action step based on its action type
 * Dispatches to specific action handlers and returns execution results
 * @param step - The workflow step containing action configuration
 * @param data - Current workflow execution data
 * @returns Promise resolving to action execution results
 * @throws Error if action execution fails
 */
async function executeAction(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  if (step.type !== 'action') {
    throw new Error('Cannot execute non-action step');
  }
  
  const { actionType } = step.config;
  
  try {
    // Dispatch to specific action handlers based on action type
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

/**
 * Executes task creation action with provided configuration
 * Creates a new task in Firestore and updates execution context
 * @param step - Workflow step containing task creation configuration
 * @param data - Current workflow execution data
 * @returns Promise resolving to action results with created task ID
 * @throws Error if task creation fails
 */
async function executeTaskCreate(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  const { createDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  // Build task data with defaults and config overrides
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

/**
 * Executes task update action with provided configuration
 * Updates an existing task in Firestore with new field values
 * @param step - Workflow step containing task update configuration
 * @param data - Current workflow execution data
 * @returns Promise resolving to action results with updated task ID
 * @throws Error if task ID is missing or update fails
 */
async function executeTaskUpdate(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  const { updateDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  // Get task ID from config or context
  const taskId = step.config.taskData.taskId || data.taskId;
  
  if (!taskId) {
    throw new Error('Task ID is required for task update');
  }
  
  // Build update data with fields to update
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

/**
 * Executes task assignment action with provided configuration
 * Updates a task's assignedTo field in Firestore
 * @param step - Workflow step containing task assignment configuration
 * @param data - Current workflow execution data
 * @returns Promise resolving to action results with assignment information
 * @throws Error if task ID is missing or assignment fails
 */
async function executeTaskAssign(step: WorkflowStep, data: Record<string, any>): Promise<Record<string, any>> {
  const { updateDocument } = await import('@/lib/firebase/firestoreService');
  
  // Get task ID and assignee from config or context
  const taskId = step.config.taskData.taskId || data.taskId;
  const assignee = step.config.taskData.assignee;
  const assignedBy = step.config.taskData.assignedBy || data.currentUser;
  
  if (!taskId) {
    throw new Error('Task ID is required for task assignment');
  }
  
  if (!assignee) {
    throw new Error('Assignee is required for task assignment');
  }
  
  // Update task with new assignee and assignment metadata
  const updateData = {
    assignee,
    assignedTo: assignee,
    assignedBy
  };
  
  await updateDocument('tasks', taskId, updateData);
  
  return { taskAssigned: true, taskId, assignee, assignedBy };
}

