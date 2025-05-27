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
  const newTask: ScheduledTask = {
    ...task,
    id: `task-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    nextRun: calculateNextRun(task.schedule)
  };
  
  console.log('Created scheduled task:', newTask);
  
  return newTask;
};

export const getScheduledTask = async (id: string): Promise<ScheduledTask | null> => {
  console.log(`Fetching scheduled task ${id}`);
  return null;
};

export const updateScheduledTask = async (id: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask | null> => {
  console.log(`Updating scheduled task ${id}`, updates);
  
  if (updates.schedule) {
    updates.nextRun = calculateNextRun(updates.schedule);
  }
  
  return null;
};

export const deleteScheduledTask = async (id: string): Promise<boolean> => {
  console.log(`Deleting scheduled task ${id}`);
  return true;
};

export const toggleScheduledTask = async (id: string, isActive: boolean): Promise<ScheduledTask | null> => {
  console.log(`${isActive ? 'Activating' : 'Deactivating'} scheduled task ${id}`);
  return null;
};

export const executeScheduledTask = async (id: string): Promise<boolean> => {
  console.log(`Executing scheduled task ${id}`);
  
  const now = new Date();
  console.log(`Task ${id} executed at ${now.toISOString()}`);
  
  return true;
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