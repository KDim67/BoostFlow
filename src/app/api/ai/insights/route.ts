import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface defining project performance metrics for AI analysis
interface ProjectMetrics {
  totalTasks: number;           // Total number of tasks in the project
  completedTasks: number;       // Number of completed tasks
  overdueTasks: number;         // Number of tasks past their due date
  activeWorkflows: number;      // Number of currently active workflows
  teamMembers: number;          // Total team members assigned to project
  avgCompletionTime: number;    // Average time to complete tasks (in hours)
  productivityScore: number;    // Overall productivity score (0-100)
  weeklyProgress: number[];     // Daily task completion count for the week
}

// Interface for individual task data used in analytics
interface TaskAnalytics {
  id: string;                   // Unique task identifier
  title: string;                // Task title/description
  status: string;               // Current task status (e.g., 'pending', 'completed')
  priority: string;             // Task priority level (e.g., 'high', 'medium', 'low')
  assignee: string;             // Team member assigned to the task
  createdAt: string;            // Task creation timestamp
  completedAt?: string;         // Task completion timestamp (optional)
  dueDate?: string;             // Task due date (optional)
  timeSpent?: number;           // Time spent on task in hours (optional)
}

// Interface for AI-generated insights about project performance
interface AIInsight {
  type: 'suggestion' | 'warning' | 'optimization';  // Type of insight provided
  title: string;                                     // Brief insight title
  description: string;                               // Detailed explanation and recommendations
  impact: 'high' | 'medium' | 'low';               // Expected impact level of the insight
  actionable: boolean;                               // Whether the insight can be acted upon
}

// POST endpoint to generate AI insights for project analytics
export async function POST(request: NextRequest) {
  try {
    // Extract project data from request body
    const { projectId, projectName, metrics, tasks, timeframe } = await request.json();

    // Validate Gemini API key configuration
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Google Generative AI with the latest model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare project context for AI analysis (limit to 10 recent tasks for efficiency)
    const projectContext = {
      projectName,
      timeframe,
      metrics: metrics as ProjectMetrics,
      recentTasks: (tasks as TaskAnalytics[]).slice(0, 10), // Limit to recent tasks to avoid token limits
      analysisDate: new Date().toISOString()
    };

    const prompt = `
You are an expert project management analyst. Analyze the following project data and provide actionable insights.

Project: ${projectContext.projectName}
Timeframe: ${projectContext.timeframe}
Analysis Date: ${projectContext.analysisDate}

Project Metrics:
- Total Tasks: ${projectContext.metrics.totalTasks}
- Completed Tasks: ${projectContext.metrics.completedTasks}
- Overdue Tasks: ${projectContext.metrics.overdueTasks}
- Active Workflows: ${projectContext.metrics.activeWorkflows}
- Team Members: ${projectContext.metrics.teamMembers}
- Average Completion Time: ${projectContext.metrics.avgCompletionTime} hours
- Productivity Score: ${projectContext.metrics.productivityScore}%
- Weekly Progress: [${projectContext.metrics.weeklyProgress.join(', ')}] tasks completed per day

Recent Tasks Sample:
${projectContext.recentTasks.map(task => 
  `- ${task.title} (${task.status}, ${task.priority} priority, assigned to ${task.assignee})`
).join('\n')}

Please provide exactly 3-5 insights in the following JSON format. Each insight should be actionable and specific to this project's data:

[
  {
    "type": "suggestion|warning|optimization",
    "title": "Brief insight title",
    "description": "Detailed explanation with specific recommendations",
    "impact": "high|medium|low",
    "actionable": true|false
  }
]

Focus on:
1. Task completion patterns and bottlenecks
2. Team productivity optimization
3. Workflow efficiency improvements
4. Risk identification (overdue tasks, resource allocation)
5. Performance trends and predictions

Provide only the JSON array, no additional text.`;

    // Generate AI insights using the prepared prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse and validate AI response

    let insights: AIInsight[];
    try {
      // Extract JSON array from AI response using regex
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      insights = JSON.parse(jsonMatch[0]);
      
      // Validate that we received a proper array of insights
      if (!Array.isArray(insights) || insights.length === 0) {
        throw new Error('Invalid insights format');
      }

      // Sanitize and provide defaults for any missing fields
      insights = insights.map(insight => ({
        type: insight.type || 'suggestion',
        title: insight.title || 'AI Insight',
        description: insight.description || 'No description available',
        impact: insight.impact || 'medium',
        actionable: insight.actionable !== false
      }));

    } catch (parseError) {
      // Log parsing errors and fall back to rule-based insights
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', text);
      
      insights = generateFallbackInsights(projectContext.metrics);
    }

    return NextResponse.json(insights);

  } catch (error) {
    // Handle any unexpected errors and provide user-friendly fallback
    console.error('Error generating AI insights:', error);
    
    const fallbackInsights = [
      {
        type: 'warning' as const,
        title: 'AI Analysis Unavailable',
        description: 'Unable to generate AI insights at this time. Please check your API configuration and try again.',
        impact: 'low' as const,
        actionable: false
      }
    ];

    return NextResponse.json(fallbackInsights);
  }
}

// Generate rule-based insights when AI analysis fails
// This ensures users always receive actionable feedback
function generateFallbackInsights(metrics: ProjectMetrics): AIInsight[] {
  const insights: AIInsight[] = [];

  // Analyze task completion rate and provide recommendations
  const completionRate = metrics.totalTasks > 0 ? (metrics.completedTasks / metrics.totalTasks) * 100 : 0;
  if (completionRate < 70) {
    insights.push({
      type: 'warning',
      title: 'Low Task Completion Rate',
      description: `Current completion rate is ${completionRate.toFixed(1)}%. Consider reviewing task assignments and deadlines to improve team productivity.`,
      impact: 'high',
      actionable: true
    });
  } else if (completionRate > 90) {
    insights.push({
      type: 'optimization',
      title: 'Excellent Task Completion',
      description: `Outstanding completion rate of ${completionRate.toFixed(1)}%. Consider increasing task complexity or taking on additional projects.`,
      impact: 'medium',
      actionable: true
    });
  }

  // Check for overdue tasks and assess urgency
  if (metrics.overdueTasks > 0) {
    const overduePercentage = (metrics.overdueTasks / metrics.totalTasks) * 100;
    insights.push({
      type: 'warning',
      title: 'Overdue Tasks Detected',
      description: `${metrics.overdueTasks} tasks are overdue (${overduePercentage.toFixed(1)}% of total). Prioritize these tasks and review project timelines.`,
      impact: overduePercentage > 20 ? 'high' : 'medium',
      actionable: true
    });
  }

  // Evaluate overall productivity and suggest improvements
  if (metrics.productivityScore < 60) {
    insights.push({
      type: 'suggestion',
      title: 'Productivity Improvement Needed',
      description: `Productivity score is ${metrics.productivityScore}%. Consider implementing time tracking, reducing meeting overhead, or providing additional training.`,
      impact: 'high',
      actionable: true
    });
  }

  // Analyze daily progress consistency to identify workflow issues
  const avgDailyProgress = metrics.weeklyProgress.reduce((sum, day) => sum + day, 0) / 7;
  const progressVariance = metrics.weeklyProgress.some(day => Math.abs(day - avgDailyProgress) > avgDailyProgress * 0.5);
  
  if (progressVariance) {
    insights.push({
      type: 'suggestion',
      title: 'Inconsistent Daily Progress',
      description: 'Task completion varies significantly across days. Consider implementing daily standups and better workload distribution.',
      impact: 'medium',
      actionable: true
    });
  }

  // Assess team capacity relative to workload
  if (metrics.teamMembers < 3 && metrics.totalTasks > 20) {
    insights.push({
      type: 'suggestion',
      title: 'Consider Team Expansion',
      description: `With ${metrics.totalTasks} tasks and only ${metrics.teamMembers} team members, consider adding more resources to prevent burnout.`,
      impact: 'medium',
      actionable: true
    });
  }

  // Provide default insight if no specific issues are detected
  if (insights.length === 0) {
    insights.push({
      type: 'optimization',
      title: 'Project Performance Review',
      description: 'Your project metrics look stable. Consider setting more ambitious goals or exploring new optimization opportunities.',
      impact: 'low',
      actionable: true
    });
  }

  // Limit to maximum of 5 insights to avoid overwhelming users
  return insights.slice(0, 5);
}