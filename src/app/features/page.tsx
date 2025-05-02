import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Features - BoostFlow',
  description: 'Explore the powerful features of BoostFlow that help teams automate tasks, analyze data, and collaborate effectively.',
};

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Boost</span> Your Productivity
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Everything you need to streamline your workflow and focus on what matters most.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Feature 1: Task Automation */}
          <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
            <div className="md:w-1/2 order-2 md:order-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1 inline-block mb-4">
                <span className="text-blue-600 dark:text-blue-400 font-medium text-sm px-3 py-1">Task Automation</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Automate Repetitive Tasks</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                BoostFlow's AI-powered automation tools learn from your team's patterns to automate repetitive tasks, saving you time and reducing errors.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Workflow automation with visual builder</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Smart scheduling and task prioritization</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Document processing and data extraction</span>
                </li>
              </ul>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all inline-block"
              >
                Try It Free
              </Link>
            </div>
            <div className="md:w-1/2 order-1 md:order-2 mb-8 md:mb-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 relative">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <p className="text-center">Task Automation Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: AI-Powered Analytics */}
          <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 relative">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <p className="text-center">Analytics Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1 inline-block mb-4">
                <span className="text-purple-600 dark:text-purple-400 font-medium text-sm px-3 py-1">AI-Powered Analytics</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Gain Valuable Insights</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Transform your data into actionable insights with BoostFlow's advanced analytics and predictive modeling capabilities.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Real-time performance dashboards</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Predictive analytics and trend forecasting</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Custom reports and data visualization</span>
                </li>
              </ul>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all inline-block"
              >
                Try It Free
              </Link>
            </div>
          </div>

          {/* Feature 3: Team Collaboration */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 order-2 md:order-1">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1 inline-block mb-4">
                <span className="text-green-600 dark:text-green-400 font-medium text-sm px-3 py-1">Team Collaboration</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Enhance Team Collaboration</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                BoostFlow brings your team together with real-time communication, file sharing, and project management tools.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Real-time document collaboration</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Team chat and video conferencing</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Project management and task assignment</span>
                </li>
              </ul>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all inline-block"
              >
                Try It Free
              </Link>
            </div>
            <div className="md:w-1/2 order-1 md:order-2 mb-8 md:mb-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 relative">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <p className="text-center">Collaboration Tools Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">More Powerful Features</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Discover all the tools BoostFlow offers to help your team succeed.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Additional Feature 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Security</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Enterprise-grade security features to protect your sensitive data and ensure compliance.</p>
              <Link href="/features" className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Additional Feature 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable Workflows</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Create custom workflows tailored to your team's specific needs and processes.</p>
              <Link href="/features" className="text-purple-600 dark:text-purple-400 font-medium hover:underline inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Additional Feature 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Seamless Integrations</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Connect with your favorite tools and services for a unified workflow experience.</p>
              <Link href="/features" className="text-green-600 dark:text-green-400 font-medium hover:underline inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Workflow?</h2>
            <p className="text-lg mb-8 text-blue-100">Start your free trial today and see how BoostFlow can help your team work smarter, not harder.</p>
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
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}