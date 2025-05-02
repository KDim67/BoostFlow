/**
 * Task Scheduler Service
 * 
 * This service provides functionality for scheduling tasks and automating
 * recurring activities within the BoostFlow application.
 */

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

/**
 * Creates a new scheduled task
 */
export const createScheduledTask = async (task: Omit<ScheduledTask, 'id' | 'createdAt' | 'updatedAt' | 'lastRun' | 'nextRun'>): Promise<ScheduledTask> => {
  // This would connect to a backend API or database
  // For now, we'll simulate the creation
  const newTask: ScheduledTask = {
    ...task,
    id: `task-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    nextRun: calculateNextRun(task.schedule)
  };
  
  // Save to database (simulated)
  console.log('Created scheduled task:', newTask);
  
  return newTask;
};

/**
 * Retrieves a scheduled task by ID
 */
export const getScheduledTask = async (id: string): Promise<ScheduledTask | null> => {
  // This would fetch from a database
  // Simulated for now
  console.log(`Fetching scheduled task ${id}`);
  return null; // Would return actual task from database
};

/**
 * Updates an existing scheduled task
 */
export const updateScheduledTask = async (id: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask | null> => {
  // This would update in a database
  // Simulated for now
  console.log(`Updating scheduled task ${id}`, updates);
  
  // If schedule was updated, recalculate nextRun
  if (updates.schedule) {
    updates.nextRun = calculateNextRun(updates.schedule);
  }
  
  return null; // Would return updated task from database
};

/**
 * Deletes a scheduled task
 */
export const deleteScheduledTask = async (id: string): Promise<boolean> => {
  // This would delete from a database
  // Simulated for now
  console.log(`Deleting scheduled task ${id}`);
  return true; // Would return success status
};

/**
 * Activates or deactivates a scheduled task
 */
export const toggleScheduledTask = async (id: string, isActive: boolean): Promise<ScheduledTask | null> => {
  // This would update in a database
  // Simulated for now
  console.log(`${isActive ? 'Activating' : 'Deactivating'} scheduled task ${id}`);
  return null; // Would return updated task from database
};

/**
 * Executes a scheduled task immediately
 */
export const executeScheduledTask = async (id: string): Promise<boolean> => {
  // This would execute the task action
  // Simulated for now
  console.log(`Executing scheduled task ${id}`);
  
  // Update lastRun (simulated)
  const now = new Date();
  console.log(`Task ${id} executed at ${now.toISOString()}`);
  
  return true; // Would return success status
};

/**
 * Calculates the next run time based on a schedule
 */
const calculateNextRun = (schedule: ScheduledTask['schedule']): Date => {
  const now = new Date();
  let nextRun = new Date(now);
  
  switch (schedule.type) {
    case 'once':
      // If time is provided, set it, otherwise use current time
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
        
        // If the time is in the past, move to tomorrow
        if (nextRun < now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;
      
    case 'daily':
      // Set to the specified time today
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
        
        // If the time is in the past, move to tomorrow
        if (nextRun < now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else {
        // Default to same time tomorrow
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      if (schedule.days && schedule.days.length > 0) {
        // Find the next day that matches one in the schedule
        const currentDay = now.getDay();
        const nextDays = schedule.days.filter(day => day > currentDay);
        
        if (nextDays.length > 0) {
          // There's a day later this week
          const daysToAdd = Math.min(...nextDays) - currentDay;
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        } else {
          // Wrap around to next week
          const daysToAdd = 7 - currentDay + Math.min(...schedule.days);
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        }
        
        // Set the time if specified
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        } else {
          nextRun.setHours(0, 0, 0, 0); // Midnight by default
        }
      }
      break;
      
    case 'monthly':
      // Set to the specified date of next month
      if (schedule.date) {
        const currentDate = now.getDate();
        const currentMonth = now.getMonth();
        
        if (schedule.date > currentDate) {
          // Later this month
          nextRun.setDate(schedule.date);
        } else {
          // Next month
          nextRun.setMonth(currentMonth + 1, schedule.date);
        }
        
        // Set the time if specified
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        } else {
          nextRun.setHours(0, 0, 0, 0); // Midnight by default
        }
      }
      break;
      
    case 'custom':
      // For custom cron schedules, we would use a cron parser library
      // This is simplified for now
      if (schedule.customCron) {
        console.log(`Custom cron schedule: ${schedule.customCron}`);
        // Would use a library like 'cron-parser' to calculate next run
        nextRun.setDate(nextRun.getDate() + 1); // Placeholder
      }
      break;
  }
  
  return nextRun;
};