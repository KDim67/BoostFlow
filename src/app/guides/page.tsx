import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Guides | BoostFlow',
  description: 'Helpful guides and tutorials for getting the most out of BoostFlow, the AI-powered productivity tool.',
};

const GuidesPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              BoostFlow <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Guides</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Our guides provide step-by-step instructions to help you master BoostFlow and boost your productivity.
            </p>
          </div>
        </div>
      </section>
      
      {/* Quick Start Guides Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Quick Start Guides</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Get up and running with BoostFlow in minutes with these essential guides.
              </p>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Getting Started with BoostFlow</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Learn the basics of setting up your workspace, creating projects, and managing tasks.</p>
                <Link href="/documentation#getting-started" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </Link>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Task Automation Techniques</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Discover how to set up automated workflows to reduce repetitive tasks.</p>
                <Link href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </Link>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Team Collaboration Best Practices</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Learn how to effectively collaborate with your team using BoostFlow's features.</p>
                <Link href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </Link>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Analytics and Reporting</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Understand how to use BoostFlow's analytics to gain insights into your team's performance.</p>
                <Link href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Popular Guides Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Guides</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Dive deeper into BoostFlow's advanced features and capabilities.
              </p>
            </div>
            
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-3">Setting Up Project Templates</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Learn how to create reusable project templates to standardize your workflows and save time when starting new projects.
                </p>
                <Link href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </Link>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-3">Integrating with Third-Party Tools</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Discover how to connect BoostFlow with your favorite tools like Slack, GitHub, and Google Workspace.
                </p>
                <Link href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </Link>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-3">Advanced Task Management</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Master advanced task management techniques like dependencies, subtasks, and custom fields.
                </p>
                <Link href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
                </Link>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-3">Customizing Your Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Learn how to personalize your dashboard to focus on what matters most to you.
                </p>
                <Link href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Read Guide →
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Master BoostFlow?</h2>
            <p className="text-lg mb-8 text-blue-100">Start with our guides and become a productivity expert in no time.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup" 
                className="bg-white text-blue-600 font-medium py-3 px-8 rounded-full hover:shadow-lg transition-all text-center"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/documentation" 
                className="bg-transparent border border-white text-white font-medium py-3 px-8 rounded-full hover:bg-white/10 transition-all text-center"
              >
                View Documentation
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-100">No credit card required. 14-day free trial.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuidesPage;