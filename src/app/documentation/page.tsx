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
              BoostFlow is a modern project management and productivity platform built around organizations. Create your organization, invite team members, manage projects, and automate workflows all in one place.
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
                <h3 className="text-xl font-semibold mb-3">Create Your Organization</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  After creating your account, you'll need to create or join an organization. Organizations are the main workspace where you'll manage your projects, tasks, and team members.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Choose a subscription plan (Free, Starter, Professional, or Enterprise)</li>
                  <li>Give your organization a name and description</li>
                  <li>Upload your company logo and set up branding</li>
                  <li>Configure organization settings</li>
                </ul>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Invite Team Members</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Build your team by inviting members to your organization with different roles and permissions:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Navigate to the Team section in your organization</li>
                  <li>Click "Invite Members" and enter email addresses</li>
                  <li>Assign roles: Owner, Admin, Member, or Viewer</li>
                  <li>Set permissions and access levels</li>
                  <li>Send invitations to your team members</li>
                </ol>
              </div>
              
              {/* Step 4 */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">4</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your First Project</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Projects are where you organize work within your organization. To create your first project:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Navigate to the Projects section in your organization</li>
                  <li>Click "New Project" and enter project details</li>
                  <li>Set project timeline, budget, and client information</li>
                  <li>Assign team members and define their roles</li>
                  <li>Start adding tasks and setting up workflows</li>
                  <li>Configure automation and integrations as needed</li>
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
              <div id="task-automation" className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 transition-all hover:shadow-xl border border-gray-100 dark:border-gray-700">
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-semibold mb-2">Task Automation</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">
                   BoostFlow's AI-powered automation tools learn from your team's patterns to automate repetitive tasks, saving you time and reducing errors.
                 </p>
                 <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                   <li><strong>Workflow automation:</strong> Visual builder for creating automated workflows</li>
                   <li><strong>Task prioritization:</strong> Intelligent task ordering and scheduling</li>
                 </ul>
               </div>
               
               {/* Feature 2 */}
               <div id="ai-analytics" className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 transition-all hover:shadow-xl border border-gray-100 dark:border-gray-700">
                 <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-semibold mb-2">AI-Powered Analytics</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">
                   Get intelligent insights about your project performance with AI that analyzes task patterns, team productivity, and identifies optimization opportunities.
                 </p>
                 <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                   <li><strong>Smart analysis:</strong> Task completion analysis and bottleneck detection</li>
                   <li><strong>Optimization recommendations:</strong> AI-powered productivity suggestions</li>
                   <li><strong>Risk identification:</strong> Workload distribution insights and risk assessment</li>
                   <li><strong>Performance tracking:</strong> Team and individual productivity metrics</li>
                 </ul>
               </div>
               
               {/* Feature 3 */}
               <div id="team-collaboration" className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 transition-all hover:shadow-xl border border-gray-100 dark:border-gray-700">
                 <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                   <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
                 <p className="text-gray-600 dark:text-gray-300 mb-4">
                   Connect your team with powerful communication tools including organized channels, direct messaging, and real-time collaboration features.
                 </p>
                 <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                   <li><strong>Organized channels:</strong> Team discussions and project coordination</li>
                   <li><strong>Direct messaging:</strong> Private conversations between team members</li>
                   <li><strong>Real-time messaging:</strong> Typing indicators and message history</li>
                 </ul>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Organization Management</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Advanced organization features to scale your team and optimize workflows.</p>
            </div>

            {/* Organization Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 mt-16">

              {/* Organization Settings */}
              <div id="organization-settings" className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Organization Settings</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Configure your organization with advanced security and management features.
                </p>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Subscription plan management (Free, Starter, Professional, Enterprise)</li>
                  <li>• Member role management (Owner, Admin, Member, Viewer)</li>
                  <li>• Custom branding and logo upload</li>
                </ul>
              </div>

              {/* Workflow Automation */}
              <div id="workflow-automation" className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Workflow Automation</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create powerful automated workflows to streamline your project management.
                </p>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Visual workflow builder with triggers, conditions, and actions</li>
                  <li>• Automated task creation and assignment</li>
                  <li>• Project-based workflow management</li>
                  <li>• Workflow execution tracking and history</li>
                  <li>• Integration with third-party services</li>
                </ul>
              </div>

            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
              <p className="text-xl mb-6 opacity-90">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Link href="/contact" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
                Contact Support
              </Link>
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