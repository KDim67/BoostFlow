import React from 'react';

export const metadata = {
  title: 'Documentation | BoostFlow',
  description: 'Comprehensive documentation for BoostFlow, the AI-powered productivity tool.',
};

const DocumentationPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">BoostFlow Documentation</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Welcome to the BoostFlow documentation. Here you'll find comprehensive guides and documentation to help you start working with BoostFlow as quickly as possible.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
            <p>New to BoostFlow? Start here to learn the basics and get up and running quickly.</p>
            <a href="#getting-started" className="inline-block mt-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Read Getting Started Guide →
            </a>
          </div>
          
          <h2 id="getting-started" className="text-2xl font-semibold mt-12 mb-4">Getting Started</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">1. Create Your Account</h3>
          <p className="mb-4">
            To get started with BoostFlow, you'll need to create an account. Visit our <a href="/signup" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">signup page</a> and follow the instructions to create your account.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2. Set Up Your Workspace</h3>
          <p className="mb-4">
            After creating your account, you'll be prompted to set up your workspace. This is where you'll manage your projects, tasks, and team members.
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Give your workspace a name that represents your team or organization</li>
            <li>Customize your workspace with your company logo</li>
            <li>Invite team members to join your workspace</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3. Create Your First Project</h3>
          <p className="mb-4">
            Projects are the main organizational unit in BoostFlow. To create your first project:
          </p>
          <ol className="list-decimal pl-6 mb-6 space-y-2">
            <li>Navigate to the Projects tab in your dashboard</li>
            <li>Click the "New Project" button</li>
            <li>Enter a name and description for your project</li>
            <li>Set a due date and assign team members</li>
            <li>Click "Create Project" to finish</li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4. Add Tasks to Your Project</h3>
          <p className="mb-4">
            Tasks are the individual work items within your projects. To add tasks:
          </p>
          <ol className="list-decimal pl-6 mb-6 space-y-2">
            <li>Open your project from the Projects dashboard</li>
            <li>Click the "Add Task" button</li>
            <li>Enter a title and description for your task</li>
            <li>Set priority, status, and due date</li>
            <li>Assign the task to a team member</li>
            <li>Click "Create Task" to add it to your project</li>
          </ol>
          
          <h2 className="text-2xl font-semibold mt-12 mb-4">Core Features</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Project Management</h3>
          <p className="mb-4">
            BoostFlow's project management features help you organize work, track progress, and meet deadlines.
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Project Dashboard:</strong> Get a visual overview of project progress, upcoming deadlines, and team workload</li>
            <li><strong>Task Management:</strong> Create, assign, and track tasks with customizable statuses and priorities</li>
            <li><strong>Timeline View:</strong> Visualize project schedules with an interactive Gantt chart</li>
            <li><strong>Kanban Boards:</strong> Manage workflow with customizable boards and columns</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Automation</h3>
          <p className="mb-4">
            Save time and reduce manual work with BoostFlow's powerful automation features.
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Workflow Automation:</strong> Create rules to automatically assign tasks, update statuses, and send notifications</li>
            <li><strong>Smart Scheduling:</strong> AI-powered scheduling suggestions based on team workload and priorities</li>
            <li><strong>Recurring Tasks:</strong> Set up tasks that repeat on a schedule</li>
            <li><strong>Templates:</strong> Create reusable project and task templates</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Analytics</h3>
          <p className="mb-4">
            Gain insights into your team's performance and project health with comprehensive analytics.
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Performance Dashboards:</strong> Track key metrics like task completion rate and team efficiency</li>
            <li><strong>Custom Reports:</strong> Create and export custom reports for stakeholders</li>
            <li><strong>Time Tracking:</strong> Monitor time spent on tasks and projects</li>
            <li><strong>Trend Analysis:</strong> Identify patterns and areas for improvement</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-12 mb-4">Advanced Topics</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">API Integration</h3>
          <p className="mb-6">
            BoostFlow offers a robust API for integrating with your existing tools and workflows. Visit our <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">API documentation</a> for detailed information.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Security & Compliance</h3>
          <p className="mb-6">
            Learn about our security practices and compliance certifications in our <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Security Guide</a>.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Enterprise Features</h3>
          <p className="mb-6">
            Discover advanced features available on our Enterprise plan, including single sign-on, advanced permissions, and dedicated support.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mt-12">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <p className="mb-4">Our support team is here to help you get the most out of BoostFlow.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-center">
                Contact Support
              </a>
              <a href="#" className="inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors text-center">
                Join Community Forum
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;