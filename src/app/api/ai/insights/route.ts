import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeWorkflows: number;
  teamMembers: number;
  avgCompletionTime: number;
  productivityScore: number;
  weeklyProgress: number[];
}

interface TaskAnalytics {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  timeSpent?: number;
}

interface AIInsight {
  type: 'suggestion' | 'warning' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, projectName, metrics, tasks, timeframe } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const projectContext = {
      projectName,
      timeframe,
      metrics: metrics as ProjectMetrics,
      recentTasks: (tasks as TaskAnalytics[]).slice(0, 10),
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let insights: AIInsight[];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      insights = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(insights) || insights.length === 0) {
        throw new Error('Invalid insights format');
      }

      insights = insights.map(insight => ({
        type: insight.type || 'suggestion',
        title: insight.title || 'AI Insight',
        description: insight.description || 'No description available',
        impact: insight.impact || 'medium',
        actionable: insight.actionable !== false
      }));

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', text);
      
      insights = generateFallbackInsights(projectContext.metrics);
    }

    return NextResponse.json(insights);

  } catch (error) {
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

function generateFallbackInsights(metrics: ProjectMetrics): AIInsight[] {
  const insights: AIInsight[] = [];

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

  if (metrics.productivityScore < 60) {
    insights.push({
      type: 'suggestion',
      title: 'Productivity Improvement Needed',
      description: `Productivity score is ${metrics.productivityScore}%. Consider implementing time tracking, reducing meeting overhead, or providing additional training.`,
      impact: 'high',
      actionable: true
    });
  }

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

  if (metrics.teamMembers < 3 && metrics.totalTasks > 20) {
    insights.push({
      type: 'suggestion',
      title: 'Consider Team Expansion',
      description: `With ${metrics.totalTasks} tasks and only ${metrics.teamMembers} team members, consider adding more resources to prevent burnout.`,
      impact: 'medium',
      actionable: true
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'optimization',
      title: 'Project Performance Review',
      description: 'Your project metrics look stable. Consider setting more ambitious goals or exploring new optimization opportunities.',
      impact: 'low',
      actionable: true
    });
  }

  return insights.slice(0, 5);
}