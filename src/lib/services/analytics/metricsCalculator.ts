import { where } from 'firebase/firestore';
import { queryDocuments } from '@/lib/firebase/firestoreService';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  projectId?: string;
  assignedTo?: string;
  hoursTracked?: number;
  createdBy: string;
  createdAt: any;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  progress: number;
  status: string;
  startDate?: string;
  dueDate: string;
  createdBy: string;
  createdAt: any; 
}

interface MetricsResult {
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export const calculateTaskCompletionRate = (tasks: Task[], previousTasks: Task[] = []): MetricsResult => {
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const currentValue = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  const previousCompletedTasks = previousTasks.filter(task => task.status === 'Completed').length;
  const previousValue = previousTasks.length > 0 ? 
    Math.round((previousCompletedTasks / previousTasks.length) * 100) : 0;
  
  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0 ? 
    Math.round((change / previousValue) * 100) : 0;
  
  return {
    currentValue,
    previousValue,
    change,
    changePercentage,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  };
};

export const calculateAvgTimePerTask = (tasks: Task[], previousTasks: Task[] = []): MetricsResult => {
  const completedTasks = tasks.filter(task => task.status === 'Completed');
  const totalHoursTracked = completedTasks.reduce((sum, task) => sum + (task.hoursTracked || 0), 0);
  const currentValue = completedTasks.length > 0 ? 
    parseFloat((totalHoursTracked / completedTasks.length).toFixed(1)) : 0;
  
  const previousCompletedTasks = previousTasks.filter(task => task.status === 'Completed');
  const previousTotalHoursTracked = previousCompletedTasks.reduce(
    (sum, task) => sum + (task.hoursTracked || 0), 0
  );
  const previousValue = previousCompletedTasks.length > 0 ? 
    parseFloat((previousTotalHoursTracked / previousCompletedTasks.length).toFixed(1)) : 0;
  
  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0 ? 
    Math.round((change / previousValue) * 100) : 0;
  
  return {
    currentValue,
    previousValue,
    change,
    changePercentage,
    trend: change < 0 ? 'up' : change > 0 ? 'down' : 'stable'
  };
};

export const calculateTeamEfficiency = (tasks: Task[], previousTasks: Task[] = []): MetricsResult => {
  let currentValue = 0;
  
  if (tasks.length > 0) {
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const completionRate = (completedTasks / tasks.length) * 100;
    
    const completedTasksOnTime = completedTasks > 0 ? 
      tasks.filter(task => {
        if (task.status !== 'Completed' || !task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const completionDate = task.createdAt ? 
          new Date(task.createdAt.seconds * 1000) : new Date();
        return completionDate <= dueDate;
      }).length / completedTasks * 100 : 0;

    const expectedHoursPerTask = 4;
    const completedTasksWithTime = tasks.filter(
      task => task.status === 'Completed' && task.hoursTracked !== undefined
    );
    
    let timeEfficiency = 0;
    if (completedTasksWithTime.length > 0) {
      const avgTimePerTask = completedTasksWithTime.reduce(
        (sum, task) => sum + (task.hoursTracked || 0), 0
      ) / completedTasksWithTime.length;
      
      timeEfficiency = avgTimePerTask <= expectedHoursPerTask ? 
        100 : Math.max(0, 100 - ((avgTimePerTask - expectedHoursPerTask) / expectedHoursPerTask * 50));
    }
    
    currentValue = Math.round(
      (completionRate * 0.4) + 
      (completedTasksOnTime * 0.3) + 
      (timeEfficiency * 0.3)
    );
  }
  
  let previousValue = 0;
  
  if (previousTasks.length > 0) {
    const prevCompletedTasks = previousTasks.filter(task => task.status === 'Completed').length;
    const prevCompletionRate = (prevCompletedTasks / previousTasks.length) * 100;
    
    const prevCompletedTasksOnTime = prevCompletedTasks > 0 ? 
      previousTasks.filter(task => {
        if (task.status !== 'Completed' || !task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const completionDate = task.createdAt ? 
          new Date(task.createdAt.seconds * 1000) : new Date();
        return completionDate <= dueDate;
      }).length / prevCompletedTasks * 100 : 0;
    
    const expectedHoursPerTask = 4;
    const prevCompletedTasksWithTime = previousTasks.filter(
      task => task.status === 'Completed' && task.hoursTracked !== undefined
    );
    
    let prevTimeEfficiency = 0;
    if (prevCompletedTasksWithTime.length > 0) {
      const prevAvgTimePerTask = prevCompletedTasksWithTime.reduce(
        (sum, task) => sum + (task.hoursTracked || 0), 0
      ) / prevCompletedTasksWithTime.length;
      
      prevTimeEfficiency = prevAvgTimePerTask <= expectedHoursPerTask ? 
        100 : Math.max(0, 100 - ((prevAvgTimePerTask - expectedHoursPerTask) / expectedHoursPerTask * 50));
    }
    
    previousValue = Math.round(
      (prevCompletionRate * 0.4) + 
      (prevCompletedTasksOnTime * 0.3) + 
      (prevTimeEfficiency * 0.3)
    );
  }
  
  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0 ? 
    Math.round((change / previousValue) * 100) : 0;
  
  return {
    currentValue,
    previousValue,
    change,
    changePercentage,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  };
};

export const calculateProjectCompletion = (projects: Project[], previousProjects: Project[] = []): MetricsResult => {
  const currentValue = projects.length > 0 ?
    Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;
  
  const previousValue = previousProjects.length > 0 ?
    Math.round(previousProjects.reduce((sum, project) => sum + project.progress, 0) / previousProjects.length) : 0;
  
  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0 ? 
    Math.round((change / previousValue) * 100) : 0;
  
  return {
    currentValue,
    previousValue,
    change,
    changePercentage,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  };
};

export const getPreviousDateRange = (currentDateRange: { start: Date, end: Date }): { start: Date, end: Date } => {
  const currentStart = new Date(currentDateRange.start);
  const currentEnd = new Date(currentDateRange.end);
  
  const rangeDuration = currentEnd.getTime() - currentStart.getTime();
  
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(previousEnd.getTime() - rangeDuration);
  
  return { start: previousStart, end: previousEnd };
};

export const fetchTasksForAnalytics = async (
  userId: string,
  currentDateRange: { start: Date, end: Date },
  previousDateRange: { start: Date, end: Date }
): Promise<{ currentTasks: Task[], previousTasks: Task[] }> => {
  const currentStartTimestamp = new Date(currentDateRange.start).getTime() / 1000;
  const currentEndTimestamp = new Date(currentDateRange.end).getTime() / 1000;
  const previousStartTimestamp = new Date(previousDateRange.start).getTime() / 1000;
  const previousEndTimestamp = new Date(previousDateRange.end).getTime() / 1000;
  
  const currentTasks = await queryDocuments('tasks', [
    where('createdBy', '==', userId),
    where('createdAt', '>=', { seconds: currentStartTimestamp, nanoseconds: 0 }),
    where('createdAt', '<=', { seconds: currentEndTimestamp, nanoseconds: 0 })
  ]) as Task[];
  
  const previousTasks = await queryDocuments('tasks', [
    where('createdBy', '==', userId),
    where('createdAt', '>=', { seconds: previousStartTimestamp, nanoseconds: 0 }),
    where('createdAt', '<=', { seconds: previousEndTimestamp, nanoseconds: 0 })
  ]) as Task[];
  
  return { currentTasks, previousTasks };
};

export const fetchProjectsForAnalytics = async (
  userId: string,
  currentDateRange: { start: Date, end: Date },
  previousDateRange: { start: Date, end: Date }
): Promise<{ currentProjects: Project[], previousProjects: Project[] }> => {
  const currentStartTimestamp = new Date(currentDateRange.start).getTime() / 1000;
  const currentEndTimestamp = new Date(currentDateRange.end).getTime() / 1000;
  const previousStartTimestamp = new Date(previousDateRange.start).getTime() / 1000;
  const previousEndTimestamp = new Date(previousDateRange.end).getTime() / 1000;
  
  const currentProjects = await queryDocuments('projects', [
    where('createdBy', '==', userId),
    where('createdAt', '>=', { seconds: currentStartTimestamp, nanoseconds: 0 }),
    where('createdAt', '<=', { seconds: currentEndTimestamp, nanoseconds: 0 })
  ]) as Project[];
  
  const previousProjects = await queryDocuments('projects', [
    where('createdBy', '==', userId),
    where('createdAt', '>=', { seconds: previousStartTimestamp, nanoseconds: 0 }),
    where('createdAt', '<=', { seconds: previousEndTimestamp, nanoseconds: 0 })
  ]) as Project[];
  
  return { currentProjects, previousProjects };
};