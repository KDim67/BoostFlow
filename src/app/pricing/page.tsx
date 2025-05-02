import Link from 'next/link';

export const metadata = {
  title: 'Pricing - BoostFlow',
  description: 'Explore BoostFlow pricing plans and choose the right option for your team. Start with a free trial today.',
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pricing</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Choose the plan that works best for your team. All plans include a 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-blue-500 rounded-t-xl"></div>
              <h3 className="text-xl font-bold mb-4 mt-4">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-500 dark:text-gray-400">/month per user</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for small teams just getting started with automation.</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Up to 10 users</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Basic automation workflows</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Standard analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">5 GB storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Email support</span>
                </li>
              </ul>
              
              <Link 
                href="/signup?plan=starter" 
                className="block w-full bg-white text-blue-600 border border-blue-600 font-medium py-3 px-6 rounded-full hover:bg-blue-50 transition-all text-center"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro Plan - Featured */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-2 border-purple-500 dark:border-purple-400 transition-all hover:shadow-lg relative transform md:scale-105 md:-translate-y-2">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-xl"></div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold uppercase py-1 px-3 rounded-full inline-block mb-4">Most Popular</div>
              <h3 className="text-xl font-bold mb-4">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$79</span>
                <span className="text-gray-500 dark:text-gray-400">/month per user</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">For growing teams that need advanced features and more customization.</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Unlimited users</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Advanced automation workflows</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">AI-powered analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">50 GB storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                </li>
              </ul>
              
              <Link 
                href="/signup?plan=pro" 
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all text-center"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-green-500 rounded-t-xl"></div>
              <h3 className="text-xl font-bold mb-4 mt-4">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
                <span className="text-gray-500 dark:text-gray-400"></span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">For large organizations with custom requirements and dedicated support.</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Everything in Pro plan</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Custom AI model training</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Unlimited storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">24/7 premium support</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Custom contract & SLA</span>
                </li>
              </ul>
              
              <Link 
                href="/contact" 
                className="block w-full bg-white text-green-600 border border-green-600 font-medium py-3 px-6 rounded-full hover:bg-green-50 transition-all text-center"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Compare Plans</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-4 px-6 text-left font-semibold text-gray-700 dark:text-gray-300">Features</th>
                    <th className="py-4 px-6 text-center font-semibold text-gray-700 dark:text-gray-300">Starter</th>
                    <th className="py-4 px-6 text-center font-semibold text-purple-600 dark:text-purple-400">Pro</th>
                    <th className="py-4 px-6 text-center font-semibold text-gray-700 dark:text-gray-300">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">Users</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Up to 10</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">Storage</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">5 GB</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">50 GB</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">Automation Workflows</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Basic</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Advanced</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Custom</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">Analytics</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Standard</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">AI-Powered</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Custom AI Models</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">Support</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Email</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Priority</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">24/7 Premium</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">Integrations</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Basic</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Advanced</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Custom</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}