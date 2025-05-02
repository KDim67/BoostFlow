import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '@/lib/firebase/useAuth';
import { queryDocuments } from '@/lib/firebase/firestoreService';
import { where, orderBy, Timestamp } from 'firebase/firestore';
import { fetchAnalyticsData } from '@/lib/services/analytics/analyticsService';
import {
  calculateTaskCompletionRate,
  calculateAvgTimePerTask,
  calculateTeamEfficiency,
  calculateProjectCompletion,
  fetchTasksForAnalytics,
  fetchProjectsForAnalytics,
  getPreviousDateRange
} from '@/lib/services/analytics/metricsCalculator';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

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

interface AnalyticsDashboardProps {
}

const AnalyticsDashboard = ({}: AnalyticsDashboardProps) => {
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Derived state for analytics
  const [projectProgressData, setProjectProgressData] = useState<any>(null);
  const [taskCompletionData, setTaskCompletionData] = useState<any>(null);
  const [teamProductivityData, setTeamProductivityData] = useState<any>(null);
  const [timeSpentData, setTimeSpentData] = useState<any>(null);
  
  // Analytics metrics
  const [projectCompletion, setProjectCompletion] = useState(0);
  const [projectCompletionChange, setProjectCompletionChange] = useState(0);
  const [taskCompletionRate, setTaskCompletionRate] = useState(0);
  const [taskCompletionRateChange, setTaskCompletionRateChange] = useState(0);
  const [avgTimePerTask, setAvgTimePerTask] = useState(0);
  const [avgTimePerTaskChange, setAvgTimePerTaskChange] = useState(0);
  const [teamEfficiency, setTeamEfficiency] = useState(0);
  const [teamEfficiencyChange, setTeamEfficiencyChange] = useState(0);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch(timeRange) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setMonth(end.getMonth() - 1);
    }
    
    return { start, end };
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const dateRange = getDateRange();
        
        const projectsData = await queryDocuments('projects', [
          where('createdBy', '==', user.uid)
        ]);
        setProjects(projectsData as Project[]);
        
        const tasksData = await queryDocuments('tasks', [
          where('createdBy', '==', user.uid)
        ]);
        setTasks(tasksData as Task[]);

        processAnalyticsData(projectsData as Project[], tasksData as Task[], dateRange);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, timeRange]);

  const processAnalyticsData = (projects: Project[], tasks: Task[], dateRange: { start: Date, end: Date }) => {
    const avgProgress = projects.length > 0 
      ? projects.reduce((sum, project) => sum + project.progress, 0) / projects.length 
      : 0;
    setProjectCompletion(Math.round(avgProgress));
    setProjectCompletionChange(12);

    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    setTaskCompletionRate(taskCompletionRate);
    setTaskCompletionRateChange(8);

    const totalHoursTracked = tasks.reduce((sum, task) => sum + (task.hoursTracked || 0), 0);
    const avgTime = completedTasks > 0 ? (totalHoursTracked / completedTasks).toFixed(1) : '0';
    setAvgTimePerTask(parseFloat(avgTime));
    setAvgTimePerTaskChange(0.5); // For now, hardcoded change

    // Calculate team efficiency (simplified metric)
    setTeamEfficiency(82); // For now, hardcoded
    setTeamEfficiencyChange(5); // For now, hardcoded change

    processProjectProgressData(projects);
    
    processTaskStatusData(tasks);
    
    processTeamProductivityData(tasks, dateRange);
    
    processTimeSpentData(tasks);
  };

  const processProjectProgressData = (projects: Project[]) => {
    const topProjects = [...projects]
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);

    let labels: string[] = [];
    if (timeRange === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
      for (let i = 6; i >= 0; i--) {
        const dayIndex = (today - i + 7) % 7; // Ensure positive index
        labels.push(days[dayIndex === 0 ? 6 : dayIndex - 1]); // Adjust for days array (Mon = 0)
      }
    } else if (timeRange === 'month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    } else if (timeRange === 'quarter') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      for (let i = 2; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12; // Ensure positive index
        labels.push(monthNames[monthIndex]);
      }
    } else if (timeRange === 'year') {
      labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    }


    const datasets = topProjects.map((project, index) => {
      const currentProgress = project.progress;
      let data: number[] = [];
      
      for (let i = 0; i < labels.length; i++) {
        const progressPoint = Math.min(currentProgress, Math.round(currentProgress * (i + 1) / labels.length));
        data.push(progressPoint);
      }

      const colors = [
        { border: 'rgba(59, 130, 246, 0.8)', background: 'rgba(59, 130, 246, 0.1)' },
        { border: 'rgba(139, 92, 246, 0.8)', background: 'rgba(139, 92, 246, 0.1)' },
        { border: 'rgba(16, 185, 129, 0.8)', background: 'rgba(16, 185, 129, 0.1)' }
      ];

      return {
        label: project.name,
        data: data,
        borderColor: colors[index % colors.length].border,
        backgroundColor: colors[index % colors.length].background,
        fill: true,
        tension: 0.4,
      };
    });

    setProjectProgressData({
      labels,
      datasets
    });
  };

  const processTaskStatusData = (tasks: Task[]) => {
    const statusCounts: Record<string, number> = {
      'To Do': 0,
      'In Progress': 0,
      'Review': 0,
      'Completed': 0
    };

    tasks.forEach(task => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
    });

    setTaskCompletionData({
      labels: Object.keys(statusCounts),
      datasets: [
        {
          label: 'Tasks',
          data: Object.values(statusCounts),
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)', // To Do - Red
            'rgba(59, 130, 246, 0.7)', // In Progress - Blue
            'rgba(245, 158, 11, 0.7)', // Review - Yellow
            'rgba(16, 185, 129, 0.7)', // Completed - Green
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  const processTeamProductivityData = (tasks: Task[], dateRange: { start: Date, end: Date }) => {
    const days: string[] = [];
    const completedTasksData: number[] = [];
    const hoursTrackedData: number[] = [];
    
    const tasksByDay = new Map<string, number>();
    const hoursByDay = new Map<string, number>();
    
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      days.push(dayName);
      tasksByDay.set(dateStr, 0);
      hoursByDay.set(dateStr, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    tasks.forEach(task => {
      if (task.status === 'Completed') {
        const taskDate = task.createdAt ? 
          new Date(task.createdAt.seconds * 1000).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0];
        
        if (tasksByDay.has(taskDate)) {
          tasksByDay.set(taskDate, tasksByDay.get(taskDate)! + 1);
          hoursByDay.set(taskDate, hoursByDay.get(taskDate)! + (task.hoursTracked || 0));
        }
      }
    });
    
    tasksByDay.forEach((count) => {
      completedTasksData.push(count);
    });
    
    hoursByDay.forEach((hours) => {
      hoursTrackedData.push(hours);
    });
    
    const dataLimit = 7;
    let displayDays = days;
    let displayTasksData = completedTasksData;
    let displayHoursData = hoursTrackedData;
    
    if (days.length > dataLimit) {
      displayDays = days.slice(-dataLimit);
      displayTasksData = completedTasksData.slice(-dataLimit);
      displayHoursData = hoursTrackedData.slice(-dataLimit);
    }

    setTeamProductivityData({
      labels: displayDays,
      datasets: [
        {
          label: 'Tasks Completed',
          data: displayTasksData,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
        },
        {
          label: 'Hours Tracked',
          data: displayHoursData,
          backgroundColor: 'rgba(139, 92, 246, 0.7)',
        },
      ],
    });
  };

  const processTimeSpentData = (tasks: Task[]) => {
    const categories = ['Development', 'Design', 'Research', 'Meetings', 'Planning'];
    
    const hoursByCategory = new Map();
    categories.forEach(category => hoursByCategory.set(category, 0));
    
    tasks.forEach(task => {
      if (!task.hoursTracked) return;
      
      const title = task.title.toLowerCase();
      const description = (task.description || '').toLowerCase();
      
      if (title.includes('develop') || title.includes('code') || title.includes('implement') || 
          description.includes('develop') || description.includes('code')) {
        hoursByCategory.set('Development', hoursByCategory.get('Development') + task.hoursTracked);
      } 
      else if (title.includes('design') || title.includes('ui') || title.includes('ux') || 
               description.includes('design') || description.includes('ui/ux')) {
        hoursByCategory.set('Design', hoursByCategory.get('Design') + task.hoursTracked);
      }
      else if (title.includes('research') || title.includes('analyze') || title.includes('study') || 
               description.includes('research') || description.includes('analysis')) {
        hoursByCategory.set('Research', hoursByCategory.get('Research') + task.hoursTracked);
      }
      else if (title.includes('meeting') || title.includes('call') || title.includes('discussion') || 
               description.includes('meeting') || description.includes('discussion')) {
        hoursByCategory.set('Meetings', hoursByCategory.get('Meetings') + task.hoursTracked);
      }
      else {
        hoursByCategory.set('Planning', hoursByCategory.get('Planning') + task.hoursTracked);
      }
    });
    
    const hoursData = categories.map(category => hoursByCategory.get(category));
    
    setTimeSpentData({
      labels: categories,
      datasets: [
        {
          label: 'Hours Spent',
          data: hoursData,
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',  // Development - Blue
            'rgba(16, 185, 129, 0.7)',  // Design - Green
            'rgba(245, 158, 11, 0.7)',  // Research - Yellow
            'rgba(239, 68, 68, 0.7)',   // Meetings - Red
            'rgba(139, 92, 246, 0.7)',  // Planning - Purple
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 text-sm font-medium ${timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-t border-b border-gray-300 dark:border-gray-600'}`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('quarter')}
            className={`px-4 py-2 text-sm font-medium ${timeRange === 'quarter' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-t border-b border-gray-300 dark:border-gray-600'}`}
          >
            Quarter
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeRange === 'year' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
          >
            Year
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Project Completion</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{projectCompletion}%</p>
                  <p className={`text-xs ${projectCompletionChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {projectCompletionChange >= 0 ? '↑' : '↓'} {Math.abs(projectCompletionChange)}% from last {timeRange}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Task Completion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{taskCompletionRate}%</p>
                  <p className={`text-xs ${taskCompletionRateChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {taskCompletionRateChange >= 0 ? '↑' : '↓'} {Math.abs(taskCompletionRateChange)}% from last {timeRange}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time per Task</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{avgTimePerTask}h</p>
                  <p className={`text-xs ${avgTimePerTaskChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {avgTimePerTaskChange >= 0 ? '↑' : '↓'} {Math.abs(avgTimePerTaskChange)}h from last {timeRange}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Efficiency</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{teamEfficiency}%</p>
                  <p className={`text-xs ${teamEfficiencyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {teamEfficiencyChange >= 0 ? '↑' : '↓'} {Math.abs(teamEfficiencyChange)}% from last {timeRange}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Progress Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project Progress</h3>
              </div>
              <div className="p-6">
                <div className="h-80">
                  {projectProgressData && (
                    <Line 
                      data={projectProgressData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: function(value) {
                                return value + '%';
                              }
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + '%';
                              }
                            }
                          }
                        },
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Task Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Task Status Distribution</h3>
              </div>
              <div className="p-6">
                <div className="h-80 flex items-center justify-center">
                  <div className="w-64 h-64">
                    {taskCompletionData && (
                      <Doughnut 
                        data={taskCompletionData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            }
                          },
                          cutout: '65%',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team Productivity Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Team Productivity</h3>
              </div>
              <div className="p-6">
                <div className="h-80">
                  {teamProductivityData && (
                    <Bar 
                      data={teamProductivityData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            grid: {
                              display: false
                            }
                          },
                          y: {
                            beginAtZero: true
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'bottom',
                          }
                        },
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Time Spent Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Time Spent Distribution</h3>
            </div>
            <div className="p-6">
              <div className="h-80 flex items-center justify-center">
                <div className="w-64 h-64">
                  {timeSpentData && (
                    <Doughnut 
                      data={timeSpentData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          }
                        },
                        cutout: '50%',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
);
};

export default AnalyticsDashboard;