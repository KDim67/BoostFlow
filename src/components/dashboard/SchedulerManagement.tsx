'use client';

import { useState, useEffect } from 'react';
import {
  ScheduledTask,
  createScheduledTask,
  getScheduledTasksByProject,
  updateScheduledTask,
  deleteScheduledTask,
  toggleScheduledTask,
  executeScheduledTask
} from '@/lib/services/automation/schedulerService';

interface SchedulerManagementProps {
  projectId: string;
  organizationId: string;
  currentUser: string;
}

export default function SchedulerManagement({
  projectId,
  organizationId,
  currentUser
}: SchedulerManagementProps) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const scheduledTasks = await getScheduledTasksByProject(projectId);
      setTasks(scheduledTasks);
    } catch (err) {
      console.error('Error loading scheduled tasks:', err);
      setError('Failed to load scheduled tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: ScheduledTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this scheduled task?')) {
      try {
        await deleteScheduledTask(taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Failed to delete task');
      }
    }
  };

  const handleToggleTask = async (taskId: string, isActive: boolean) => {
    try {
      const updatedTask = await toggleScheduledTask(taskId, isActive);
      if (updatedTask) {
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      setError('Failed to toggle task');
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    try {
      const success = await executeScheduledTask(taskId);
      if (success) {
        await loadTasks();
      }
    } catch (err) {
      console.error('Error executing task:', err);
      setError('Failed to execute task');
    }
  };

  const formatSchedule = (schedule: ScheduledTask['schedule']) => {
    switch (schedule.type) {
      case 'once':
        return `Once at ${schedule.time || 'unspecified time'}`;
      case 'daily':
        return `Daily at ${schedule.time || 'unspecified time'}`;
      case 'weekly':
        const days = schedule.days?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
        return `Weekly on ${days} at ${schedule.time || 'unspecified time'}`;
      case 'monthly':
        return `Monthly on day ${schedule.date} at ${schedule.time || 'unspecified time'}`;
      case 'custom':
        return `Custom: ${schedule.customCron}`;
      default:
        return 'Unknown schedule';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Scheduled Tasks</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Automate task creation and other actions
          </p>
        </div>
        <button
          onClick={handleCreateTask}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Scheduled Task
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No scheduled tasks</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first scheduled task to automate workflows</p>
          <button
            onClick={handleCreateTask}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Scheduled Task
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{task.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {task.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatSchedule(task.schedule)}
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Action: {task.action.type}
                    </div>
                    {task.nextRun && (
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Next run: {new Date(task.nextRun).toLocaleString()}
                      </div>
                    )}
                    {task.lastRun && (
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Last run: {new Date(task.lastRun).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleTask(task.id, !task.isActive)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      task.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                    }`}
                  >
                    {task.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleExecuteTask(task.id)}
                    className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                  >
                    Run Now
                  </button>
                  <button
                    onClick={() => handleEditTask(task)}
                    className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ScheduledTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={editingTask}
          projectId={projectId}
          organizationId={organizationId}
          currentUser={currentUser}
          onTaskSaved={(task) => {
            if (editingTask) {
              setTasks(tasks.map(t => t.id === task.id ? task : t));
            } else {
              setTasks([...tasks, task]);
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface ScheduledTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: ScheduledTask | null;
  projectId: string;
  organizationId: string;
  currentUser: string;
  onTaskSaved: (task: ScheduledTask) => void;
}

function ScheduledTaskModal({
  isOpen,
  onClose,
  task,
  projectId,
  organizationId,
  currentUser,
  onTaskSaved
}: ScheduledTaskModalProps) {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [scheduleType, setScheduleType] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'custom'>(task?.schedule.type || 'daily');
  const [time, setTime] = useState(task?.schedule.time || '09:00');
  const [days, setDays] = useState<number[]>(task?.schedule.days || []);
  const [date, setDate] = useState(task?.schedule.date || 1);
  const [customCron, setCustomCron] = useState(task?.schedule.customCron || '');
  const [actionType, setActionType] = useState<'task.create' | 'notification.send' | 'email.send'>(task?.action.type as any || 'task.create');
  const [taskTitle, setTaskTitle] = useState(task?.action.params.title || '');
  const [taskDescription, setTaskDescription] = useState(task?.action.params.description || '');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High'>(task?.action.params.priority || 'Medium');
  const [isActive, setIsActive] = useState(task?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleDayToggle = (day: number) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const schedule: any = {
        type: scheduleType
      };
      
      if (scheduleType !== 'custom' && time) {
        schedule.time = time;
      }
      if (scheduleType === 'weekly' && days.length > 0) {
        schedule.days = days;
      }
      if (scheduleType === 'monthly' && date) {
        schedule.date = date;
      }
      if (scheduleType === 'custom' && customCron) {
        schedule.customCron = customCron;
      }

      const action = {
        type: actionType,
        params: {
          organizationId,
          projectId,
          ...(taskTitle && { title: taskTitle }),
          ...(taskDescription && { description: taskDescription }),
          priority: taskPriority
        }
      };

      let savedTask: ScheduledTask;

      if (task) {
        const updateData: any = {
          name,
          schedule,
          action,
          isActive
        };
        
        if (description) {
          updateData.description = description;
        }
        
        savedTask = await updateScheduledTask(task.id, updateData) as ScheduledTask;
      } else {
        const taskData: any = {
          name,
          createdBy: currentUser,
          schedule,
          action,
          isActive
        };
        
        if (description) {
          taskData.description = description;
        }
        
        savedTask = await createScheduledTask(taskData);
      }

      onTaskSaved(savedTask);
    } catch (error) {
      console.error('Error saving scheduled task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {task ? 'Edit Scheduled Task' : 'Create Scheduled Task'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Schedule Type
            </label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom (Cron)</option>
            </select>
          </div>

          {scheduleType !== 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {scheduleType === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      days.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scheduleType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={date}
                onChange={(e) => setDate(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {scheduleType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cron Expression
              </label>
              <input
                type="text"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="0 9 * * 1-5"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action Type
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="task.create">Create Task</option>
              <option value="notification.send">Send Notification</option>
              <option value="email.send">Send Email</option>
            </select>
          </div>

          {actionType === 'task.create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Description
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}