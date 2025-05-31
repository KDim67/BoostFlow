import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Documentation | BoostFlow',
  description: 'Comprehensive documentation for BoostFlow, the AI-powered productivity tool.',
};

const DocumentationPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BoostFlow</span> Documentation
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Welcome to the BoostFlow documentation. Here you'll find comprehensive guides and documentation to help you start working with BoostFlow as quickly as possible.
            </p>
          </div>
        </div>
      </section>
      
      {/* Getting Started Quick Access Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-md p-6 mb-16">
              <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
              <p className="mb-4">New to BoostFlow? Start here to learn the basics and get up and running quickly.</p>
              <Link href="#getting-started" className="inline-block mt-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium inline-flex items-center">
                Read Getting Started Guide
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Getting Started Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
          
            <div className="text-center mb-16">
              <h2 id="getting-started" className="text-3xl md:text-4xl font-bold mb-4">Getting Started</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Follow these steps to get up and running with BoostFlow quickly.</p>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Step 1 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your Account</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  To get started with BoostFlow, you'll need to create an account. Visit our <Link href="/signup" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">signup page</Link> and follow the instructions to create your account.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Set Up Your Workspace</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  After creating your account, you'll be prompted to set up your workspace. This is where you'll manage your projects, tasks, and team members.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Give your workspace a name that represents your team or organization</li>
                  <li>Customize your workspace with your company logo</li>
                  <li>Invite team members to join your workspace</li>
                </ul>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your First Project</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Projects are the main organizational unit in BoostFlow. To create your first project:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Navigate to the Projects tab in your dashboard</li>
                  <li>Click the "New Project" button</li>
                  <li>Enter a name and description for your project</li>
                  <li>Set a due date and assign team members</li>
                  <li>Click "Create Project" to finish</li>
                </ol>
              </div>
              
              {/* Step 4 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">4</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Add Tasks to Your Project</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Tasks are the individual work items within your projects. To add tasks:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Open your project from the Projects dashboard</li>
                  <li>Click the "Add Task" button</li>
                  <li>Enter a title and description for your task</li>
                  <li>Set priority, status, and due date</li>
                  <li>Assign the task to a team member</li>
                  <li>Click "Create Task" to add it to your project</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Core Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
          
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Features</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Everything you need to streamline your workflow and focus on what matters most.</p>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-semibold mb-2">Project Management</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">
                   BoostFlow's project management features help you organize work, track progress, and meet deadlines.
                 </p>
                 <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                   <li><strong>Project Dashboard:</strong> Get a visual overview of project progress, upcoming deadlines, and team workload</li>
                   <li><strong>Task Management:</strong> Create, assign, and track tasks with customizable statuses and priorities</li>
                   <li><strong>Timeline View:</strong> Visualize project schedules with an interactive Gantt chart</li>
                   <li><strong>Kanban Boards:</strong> Manage workflow with customizable boards and columns</li>
                 </ul>
                 <Link href="/features" className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center">
                   Learn more
                   <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </Link>
               </div>
               
               {/* Feature 2 */}
               <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                 <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-semibold mb-2">Automation</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">
                   Save time and reduce manual work with BoostFlow's powerful automation features.
                 </p>
                 <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                   <li><strong>Workflow Automation:</strong> Create rules to automatically assign tasks, update statuses, and send notifications</li>
                   <li><strong>Smart Scheduling:</strong> AI-powered scheduling suggestions based on team workload and priorities</li>
                   <li><strong>Recurring Tasks:</strong> Set up tasks that repeat on a schedule</li>
                   <li><strong>Templates:</strong> Create reusable project and task templates</li>
                 </ul>
                 <Link href="/features" className="text-purple-600 dark:text-purple-400 font-medium hover:underline inline-flex items-center">
                   Learn more
                   <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </Link>
               </div>
               
               {/* Feature 3 */}
               <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                 <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-semibold mb-2">Analytics</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">
                   Gain insights into your team's performance and project health with comprehensive analytics.
                 </p>
                 <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                   <li><strong>Performance Dashboards:</strong> Track key metrics like task completion rate and team efficiency</li>
                   <li><strong>Custom Reports:</strong> Create and export custom reports for stakeholders</li>
                   <li><strong>Time Tracking:</strong> Monitor time spent on tasks and projects</li>
                   <li><strong>Trend Analysis:</strong> Identify patterns and areas for improvement</li>
                 </ul>
                 <Link href="/features" className="text-green-600 dark:text-green-400 font-medium hover:underline inline-flex items-center">
                   Learn more
                   <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Advanced Topics Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
          
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Topics</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Explore advanced features and integrations to get the most out of BoostFlow.</p>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Advanced Topic 1 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">API Integration</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  BoostFlow offers a robust API for integrating with your existing tools and workflows. Visit our API documentation for detailed information.
                </p>
                <Link href="#" className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center">
                  View API Documentation
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* Advanced Topic 2 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Security & Compliance</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Learn about our security practices and compliance certifications in our Security Guide.
                </p>
                <Link href="#" className="text-purple-600 dark:text-purple-400 font-medium hover:underline inline-flex items-center">
                  Read Security Guide
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* Advanced Topic 3 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Enterprise Features</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Discover advanced features available on our Enterprise plan, including single sign-on, advanced permissions, and dedicated support.
                </p>
                <Link href="/pricing" className="text-green-600 dark:text-green-400 font-medium hover:underline inline-flex items-center">
                  Explore Enterprise Plan
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      

      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started with BoostFlow?</h2>
            <p className="text-lg mb-8 text-blue-100">Join thousands of teams that use BoostFlow to automate tasks, analyze data, and collaborate more effectively.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup" 
                className="bg-white text-blue-600 font-medium py-3 px-8 rounded-full hover:shadow-lg transition-all text-center"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/contact" 
                className="bg-transparent border border-white text-white font-medium py-3 px-8 rounded-full hover:bg-white/10 transition-all text-center"
              >
                Contact Sales
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-100">No credit card required. 14-day free trial.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DocumentationPage;