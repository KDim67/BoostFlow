export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
    time?: string; // HH:MM format
    days?: number[]; // 0-6 for weekly (0 = Sunday)
    date?: number; // 1-31 for monthly
    customCron?: string; // For advanced scheduling
  };
  action: {
    type: 'task.create' | 'notification.send' | 'email.send' | 'workflow.execute' | 'custom';
    params: Record<string, any>;
  };
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export const createScheduledTask = async (task: Omit<ScheduledTask, 'id' | 'createdAt' | 'updatedAt' | 'lastRun' | 'nextRun'>): Promise<ScheduledTask> => {
  const { createDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  const nextRun = calculateNextRun(task.schedule);
  
  const taskData = {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    nextRun: nextRun
  };
  
  const docId = await createDocument('scheduledTasks', taskData);
  
  return {
    ...task,
    id: docId,
    createdAt: new Date(),
    updatedAt: new Date(),
    nextRun: nextRun
  };
};

export const getScheduledTask = async (id: string): Promise<ScheduledTask | null> => {
  const { getDocument } = await import('@/lib/firebase/firestoreService');
  
  try {
    const task = await getDocument('scheduledTasks', id);
    if (!task) return null;
    
    return convertFirestoreTask(task) as ScheduledTask;
  } catch (error) {
    console.error('Error fetching scheduled task:', error);
    return null;
  }
};

export const updateScheduledTask = async (id: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask | null> => {
  const { updateDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  try {
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    if (updates.schedule) {
      updateData.nextRun = calculateNextRun(updates.schedule);
    }
    
    await updateDocument('scheduledTasks', id, updateData);
    
    return await getScheduledTask(id);
  } catch (error) {
    console.error('Error updating scheduled task:', error);
    return null;
  }
};

export const deleteScheduledTask = async (id: string): Promise<boolean> => {
  const { deleteDocument } = await import('@/lib/firebase/firestoreService');
  
  try {
    await deleteDocument('scheduledTasks', id);
    return true;
  } catch (error) {
    console.error('Error deleting scheduled task:', error);
    return false;
  }
};

export const toggleScheduledTask = async (id: string, isActive: boolean): Promise<ScheduledTask | null> => {
  return await updateScheduledTask(id, { isActive });
};

export const executeScheduledTask = async (id: string): Promise<boolean> => {
  const { createDocument } = await import('@/lib/firebase/firestoreService');
  const { serverTimestamp } = await import('firebase/firestore');
  
  try {
    const task = await getScheduledTask(id);
    if (!task) {
      console.error('Task not found:', id);
      return false;
    }
    
    const now = new Date();
    
    if (task.action.type === 'task.create') {
      const taskData = {
        title: task.action.params.title || 'Scheduled Task',
        description: task.action.params.description || 'Auto-generated from scheduled task',
        status: 'To Do',
        priority: task.action.params.priority || 'Medium',
        dueDate: task.action.params.dueDate || new Date().toISOString().split('T')[0],
        organizationId: task.action.params.organizationId,
        projectId: task.action.params.projectId,
        createdBy: task.createdBy,
        createdAt: serverTimestamp()
      };
      
      await createDocument('tasks', taskData);
    }
    
    await updateScheduledTask(id, {
      lastRun: now,
      nextRun: task.schedule.type !== 'once' ? calculateNextRun(task.schedule) : undefined
    });
    
    console.log(`Task ${id} executed at ${now.toISOString()}`);
    return true;
  } catch (error) {
    console.error('Error executing scheduled task:', error);
    return false;
  }
};

export const getScheduledTasksByProject = async (projectId: string): Promise<ScheduledTask[]> => {
  const { queryDocuments } = await import('@/lib/firebase/firestoreService');
  const { where } = await import('firebase/firestore');
  
  try {
    const tasks = await queryDocuments('scheduledTasks', [
      where('action.params.projectId', '==', projectId)
    ]);
    return tasks.map(task => convertFirestoreTask(task)) as ScheduledTask[];
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    return [];
  }
};

export const getScheduledTasksByOrganization = async (organizationId: string): Promise<ScheduledTask[]> => {
  const { queryDocuments } = await import('@/lib/firebase/firestoreService');
  const { where } = await import('firebase/firestore');
  
  try {
    const tasks = await queryDocuments('scheduledTasks', [
      where('action.params.organizationId', '==', organizationId)
    ]);
    return tasks.map(task => convertFirestoreTask(task)) as ScheduledTask[];
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    return [];
  }
};

const calculateNextRun = (schedule: ScheduledTask['schedule']): Date => {
  const now = new Date();
  let nextRun = new Date(now);
  
  switch (schedule.type) {
    case 'once':
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
        
        if (nextRun < now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;
      
    case 'daily':
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
        
        if (nextRun < now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      if (schedule.days && schedule.days.length > 0) {
        const currentDay = now.getDay();
        const nextDays = schedule.days.filter(day => day > currentDay);
        
        if (nextDays.length > 0) {
          const daysToAdd = Math.min(...nextDays) - currentDay;
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        } else {
          const daysToAdd = 7 - currentDay + Math.min(...schedule.days);
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        }
        
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        } else {
          nextRun.setHours(0, 0, 0, 0);
        }
      }
      break;
      
    case 'monthly':
      if (schedule.date) {
        const currentDate = now.getDate();
        const currentMonth = now.getMonth();
        
        if (schedule.date > currentDate) {
          nextRun.setDate(schedule.date);
        } else {
          nextRun.setMonth(currentMonth + 1, schedule.date);
        }
        
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        } else {
          nextRun.setHours(0, 0, 0, 0);
        }
      }
      break;
      
    case 'custom':
      if (schedule.customCron) {
        console.log(`Custom cron schedule: ${schedule.customCron}`);
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
  }
  
  return nextRun;
};

const convertFirestoreTask = (firestoreData: any): ScheduledTask => {
  const task = { ...firestoreData };
  
  if (task.createdAt && typeof task.createdAt.toDate === 'function') {
    task.createdAt = task.createdAt.toDate();
  }
  
  if (task.updatedAt && typeof task.updatedAt.toDate === 'function') {
    task.updatedAt = task.updatedAt.toDate();
  }
  
  if (task.lastRun && typeof task.lastRun.toDate === 'function') {
    task.lastRun = task.lastRun.toDate();
  }
  
  if (task.nextRun && typeof task.nextRun.toDate === 'function') {
    task.nextRun = task.nextRun.toDate();
  }
  
  return task;
};