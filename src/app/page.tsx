import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Automate</span> Your Workflow with AI
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                BoostFlow helps teams automate repetitive tasks, manage projects efficiently, and enhance collaboration with AI-powered tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  href="/signup" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all text-center"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/features" 
                  className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all text-center"
                >
                  Learn More
                </Link>
              </div>
              <div className="pt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 md:p-8 relative z-10">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <p className="text-center">Dashboard Preview</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features to Boost Your Productivity</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Everything you need to streamline your workflow and focus on what matters most.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Task Automation</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Automate repetitive tasks and workflows with AI-powered tools that learn from your team's patterns.</p>
              <Link href="/features" className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Gain valuable insights from your data with advanced analytics and predictive modeling.</p>
              <Link href="/features" className="text-purple-600 dark:text-purple-400 font-medium hover:underline inline-flex items-center">
                Learn more
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Enhance team collaboration with real-time communication, file sharing, and project management tools.</p>
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

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How BoostFlow Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Get started in minutes and transform your team's productivity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-300">Create your account and invite your team members to join your workspace.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Tools</h3>
              <p className="text-gray-600 dark:text-gray-300">Integrate with your existing tools and import your data to get started quickly.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Boost Productivity</h3>
              <p className="text-gray-600 dark:text-gray-300">Start automating tasks, analyzing data, and collaborating more effectively.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Boost Your Team's Productivity?</h2>
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
}
