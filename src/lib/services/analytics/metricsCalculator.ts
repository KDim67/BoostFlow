/**
 * Metrics Calculator
 * 
 * This module provides functions for calculating various analytics metrics
 * based on project and task data.
 */

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

/**
 * Calculate task completion rate
 * 
 * @param tasks List of tasks
 * @param previousTasks List of tasks from previous period (for comparison)
 * @returns Metrics result with current and previous values, change, and trend
 */
export const calculateTaskCompletionRate = (tasks: Task[], previousTasks: Task[] = []): MetricsResult => {
  // Calculate current completion rate
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const currentValue = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  // Calculate previous completion rate
  const previousCompletedTasks = previousTasks.filter(task => task.status === 'Completed').length;
  const previousValue = previousTasks.length > 0 ? 
    Math.round((previousCompletedTasks / previousTasks.length) * 100) : 0;
  
  // Calculate change
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

/**
 * Calculate average time per task
 * 
 * @param tasks List of tasks
 * @param previousTasks List of tasks from previous period (for comparison)
 * @returns Metrics result with current and previous values, change, and trend
 */
export const calculateAvgTimePerTask = (tasks: Task[], previousTasks: Task[] = []): MetricsResult => {
  // Calculate current average time
  const completedTasks = tasks.filter(task => task.status === 'Completed');
  const totalHoursTracked = completedTasks.reduce((sum, task) => sum + (task.hoursTracked || 0), 0);
  const currentValue = completedTasks.length > 0 ? 
    parseFloat((totalHoursTracked / completedTasks.length).toFixed(1)) : 0;
  
  // Calculate previous average time
  const previousCompletedTasks = previousTasks.filter(task => task.status === 'Completed');
  const previousTotalHoursTracked = previousCompletedTasks.reduce(
    (sum, task) => sum + (task.hoursTracked || 0), 0
  );
  const previousValue = previousCompletedTasks.length > 0 ? 
    parseFloat((previousTotalHoursTracked / previousCompletedTasks.length).toFixed(1)) : 0;
  
  // Calculate change (note: for time per task, lower is better)
  const change = currentValue - previousValue;
  const changePercentage = previousValue > 0 ? 
    Math.round((change / previousValue) * 100) : 0;
  
  return {
    currentValue,
    previousValue,
    change,
    changePercentage,
    // For time per task, a decrease is considered positive (trend up)
    trend: change < 0 ? 'up' : change > 0 ? 'down' : 'stable'
  };
};

/**
 * Calculate team efficiency
 * 
 * This is a composite metric based on:
 * - Task completion rate
 * - Average time per task (compared to expected time)
 * - Tasks completed on time vs. overdue
 * 
 * @param tasks List of tasks
 * @param previousTasks List of tasks from previous period (for comparison)
 * @returns Metrics result with current and previous values, change, and trend
 */
export const calculateTeamEfficiency = (tasks: Task[], previousTasks: Task[] = []): MetricsResult => {
  // Calculate current efficiency
  let currentValue = 0;
  
  if (tasks.length > 0) {
    // Component 1: Task completion rate (40% weight)
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const completionRate = (completedTasks / tasks.length) * 100;
    
    // Component 2: Tasks completed on time (30% weight)
    const completedTasksOnTime = completedTasks > 0 ? 
      tasks.filter(task => {
        if (task.status !== 'Completed' || !task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const completionDate = task.createdAt ? 
          new Date(task.createdAt.seconds * 1000) : new Date();
        return completionDate <= dueDate;
      }).length / completedTasks * 100 : 0;
    
    // Component 3: Time efficiency (30% weight)
    // Assuming an average task should take about 4 hours
    const expectedHoursPerTask = 4;
    const completedTasksWithTime = tasks.filter(
      task => task.status === 'Completed' && task.hoursTracked !== undefined
    );
    
    let timeEfficiency = 0;
    if (completedTasksWithTime.length > 0) {
      const avgTimePerTask = completedTasksWithTime.reduce(
        (sum, task) => sum + (task.hoursTracked || 0), 0
      ) / completedTasksWithTime.length;
      
      // If tasks are completed faster than expected, efficiency is higher
      timeEfficiency = avgTimePerTask <= expectedHoursPerTask ? 
        100 : Math.max(0, 100 - ((avgTimePerTask - expectedHoursPerTask) / expectedHoursPerTask * 50));
    }
    
    // Calculate weighted efficiency score
    currentValue = Math.round(
      (completionRate * 0.4) + 
      (completedTasksOnTime * 0.3) + 
      (timeEfficiency * 0.3)
    );
  }
  
  // Calculate previous efficiency using the same formula
  let previousValue = 0;
  
  if (previousTasks.length > 0) {
    // Component 1: Task completion rate (40% weight)
    const prevCompletedTasks = previousTasks.filter(task => task.status === 'Completed').length;
    const prevCompletionRate = (prevCompletedTasks / previousTasks.length) * 100;
    
    // Component 2: Tasks completed on time (30% weight)
    const prevCompletedTasksOnTime = prevCompletedTasks > 0 ? 
      previousTasks.filter(task => {
        if (task.status !== 'Completed' || !task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const completionDate = task.createdAt ? 
          new Date(task.createdAt.seconds * 1000) : new Date();
        return completionDate <= dueDate;
      }).length / prevCompletedTasks * 100 : 0;
    
    // Component 3: Time efficiency (30% weight)
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
    
    // Calculate weighted efficiency score
    previousValue = Math.round(
      (prevCompletionRate * 0.4) + 
      (prevCompletedTasksOnTime * 0.3) + 
      (prevTimeEfficiency * 0.3)
    );
  }
  
  // Calculate change
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

/**
 * Calculate project completion metrics
 * 
 * @param projects List of projects
 * @param previousProjects List of projects from previous period (for comparison)
 * @returns Metrics result with current and previous values, change, and trend
 */
export const calculateProjectCompletion = (projects: Project[], previousProjects: Project[] = []): MetricsResult => {
  // Calculate current average progress
  const currentValue = projects.length > 0 ?
    Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;
  
  // Calculate previous average progress
  const previousValue = previousProjects.length > 0 ?
    Math.round(previousProjects.reduce((sum, project) => sum + project.progress, 0) / previousProjects.length) : 0;
  
  // Calculate change
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

/**
 * Get previous date range based on current date range
 * 
 * @param currentDateRange Current date range
 * @returns Previous date range with same duration
 */
export const getPreviousDateRange = (currentDateRange: { start: Date, end: Date }): { start: Date, end: Date } => {
  const currentStart = new Date(currentDateRange.start);
  const currentEnd = new Date(currentDateRange.end);
  
  // Calculate the duration of the current range in milliseconds
  const rangeDuration = currentEnd.getTime() - currentStart.getTime();
  
  // Create previous range with the same duration, ending at the start of the current range
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(previousEnd.getTime() - rangeDuration);
  
  return { start: previousStart, end: previousEnd };
};

/**
 * Fetch tasks for the current and previous time periods
 * 
 * @param userId User ID to filter tasks by
 * @param currentDateRange Current date range to fetch tasks for
 * @param previousDateRange Previous date range to fetch tasks for (for comparison)
 * @returns Promise with current and previous tasks
 */
export const fetchTasksForAnalytics = async (
  userId: string,
  currentDateRange: { start: Date, end: Date },
  previousDateRange: { start: Date, end: Date }
): Promise<{ currentTasks: Task[], previousTasks: Task[] }> => {
  // Convert dates to timestamps for Firestore queries
  const currentStartTimestamp = new Date(currentDateRange.start).getTime() / 1000;
  const currentEndTimestamp = new Date(currentDateRange.end).getTime() / 1000;
  const previousStartTimestamp = new Date(previousDateRange.start).getTime() / 1000;
  const previousEndTimestamp = new Date(previousDateRange.end).getTime() / 1000;
  
  // Fetch current period tasks
  const currentTasks = await queryDocuments('tasks', [
    where('createdBy', '==', userId),
    where('createdAt', '>=', { seconds: currentStartTimestamp, nanoseconds: 0 }),
    where('createdAt', '<=', { seconds: currentEndTimestamp, nanoseconds: 0 })
  ]) as Task[];
  
  // Fetch previous period tasks
  const previousTasks = await queryDocuments('tasks', [
    where('createdBy', '==', userId),
    where('createdAt', '>=', { seconds: previousStartTimestamp, nanoseconds: 0 }),
    where('createdAt', '<=', { seconds: previousEndTimestamp, nanoseconds: 0 })
  ]) as Task[];
  
  return { currentTasks, previousTasks };
};

/**
 * Fetch projects for the current and previous time periods
 * 
 * @param userId User ID to filter projects by
 * @param currentDateRange Current date range to fetch projects for
 * @param previousDateRange Previous date range to fetch projects for (for comparison)
 * @returns Promise with current and previous projects
 */
export const fetchProjectsForAnalytics = async (
  userId: string,
  currentDateRange: { start: Date, end: Date },
  previousDateRange: { start: Date, end: Date }
): Promise<{ currentProjects: Project[], previousProjects: Project[] }> => {
  // Convert dates to timestamps for Firestore queries
  const currentStartTimestamp = new Date(currentDateRange.start).getTime() / 1000;
  const currentEndTimestamp = new Date(currentDateRange.end).getTime() / 1000;
  const previousStartTimestamp = new Date(previousDateRange.start).getTime() / 1000;
  const previousEndTimestamp = new Date(previousDateRange.end).getTime() / 1000;
  
  // Fetch current period projects
  const currentProjects = await queryDocuments('projects', [
    where('createdBy', '==', userId),
    where('createdAt', '>=', { seconds: currentStartTimestamp, nanoseconds: 0 }),
    where('createdAt', '<=', { seconds: currentEndTimestamp, nanoseconds: 0 })
  ]) as Project[];
  
  // Fetch previous period projects
  const previousProjects = await queryDocuments('projects', [
    where('createdBy', '==', userId),
    where('createdAt', '>=', { seconds: previousStartTimestamp, nanoseconds: 0 }),
    where('createdAt', '<=', { seconds: previousEndTimestamp, nanoseconds: 0 })
  ]) as Project[];
  
  return { currentProjects, previousProjects };
};