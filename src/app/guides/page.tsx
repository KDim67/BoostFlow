import React from 'react';

export const metadata = {
  title: 'Guides | BoostFlow',
  description: 'Helpful guides and tutorials for getting the most out of BoostFlow, the AI-powered productivity tool.',
};

const GuidesPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">BoostFlow Guides</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Our guides provide step-by-step instructions to help you master BoostFlow and boost your productivity.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-3">Getting Started with BoostFlow</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Learn the basics of setting up your workspace, creating projects, and managing tasks.</p>
                <a href="/documentation#getting-started" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </a>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-3">Task Automation Techniques</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Discover how to set up automated workflows to reduce repetitive tasks.</p>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </a>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-3">Team Collaboration Best Practices</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Learn how to effectively collaborate with your team using BoostFlow's features.</p>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </a>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-3">Analytics and Reporting</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Understand how to use BoostFlow's analytics to gain insights into your team's performance.</p>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </a>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Popular Guides</h2>
          
          <div className="space-y-6 mb-12">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-2">Setting Up Project Templates</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Learn how to create reusable project templates to standardize your workflows and save time when starting new projects.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Read Guide →
              </a>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-2">Integrating with Third-Party Tools</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Discover how to connect BoostFlow with your favorite tools like Slack, GitHub, and Google Workspace.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Read Guide →
              </a>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-2">Advanced Task Management</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Master advanced task management techniques like dependencies, subtasks, and custom fields.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Read Guide →
              </a>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-2">Customizing Your Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Learn how to personalize your dashboard to focus on what matters most to you.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Read Guide →
              </a>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Video Tutorials</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Quick Start Guide</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">5:32 • Learn the basics in under 6 minutes</p>
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Advanced Automation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">12:45 • Create powerful automated workflows</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Need Help with Something Specific?</h3>
            <p className="mb-4">Our support team is here to help you get the most out of BoostFlow.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/contact" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-center">
                Contact Support
              </a>
              <a href="/documentation" className="inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md transition-colors text-center">
                Browse Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidesPage;