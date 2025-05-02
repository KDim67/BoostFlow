import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Testimonials - BoostFlow',
  description: 'Read what our customers say about BoostFlow and how it has transformed their workflow and productivity.',
};

export default function TestimonialsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              What Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Customers</span> Say
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Discover how BoostFlow has helped teams across various industries improve their productivity and workflow.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 shadow-md">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
                <div>
                  <h3 className="font-bold text-lg">Sarah Johnson</h3>
                  <p className="text-gray-600 dark:text-gray-400">Product Manager, TechCorp</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "The automation capabilities in BoostFlow have saved our development team countless hours. The intuitive interface made it easy to set up workflows, and the AI analytics have helped us identify bottlenecks we didn't even know existed."
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Using BoostFlow since 2023</p>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 shadow-md">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
                <div>
                  <h3 className="font-bold text-lg">Michael Chen</h3>
                  <p className="text-gray-600 dark:text-gray-400">CTO, InnovateTech</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "BoostFlow has completely transformed how our team works. We've automated our repetitive tasks and now have more time to focus on strategic initiatives. The AI-powered analytics have given us insights we never had before."
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Using BoostFlow since 2022</p>
            </div>
          </div>
          
          {/* More Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Testimonial 3 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-bold">Alex Rodriguez</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Marketing Director, GrowthLabs</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                "BoostFlow's analytics have revolutionized our marketing campaigns. We can now predict trends and optimize our strategy in real-time."
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Using BoostFlow since 2022</p>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-bold">Emily Wong</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Operations Manager, LogisticsPro</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-2">
                {[...Array(4)].map((_, i) => (
                  <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                "The team collaboration features have made remote work seamless. Our productivity has increased by 30% since implementing BoostFlow."
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Using BoostFlow since 2023</p>
            </div>

            {/* Testimonial 5 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-bold">David Patel</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">CEO, StartupVision</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                "As a startup, we needed a solution that could scale with us. BoostFlow has been the perfect fit, growing alongside our team."
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Using BoostFlow since 2023</p>
            </div>
          </div>

          {/* Case Study */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-sm px-3 py-1 rounded-full mb-4">Case Study</div>
              <h2 className="text-2xl font-bold mb-4">How TechCorp Increased Productivity by 45%</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                TechCorp, a leading software development company with over 200 employees, was struggling with inefficient workflows and communication gaps between teams. After implementing BoostFlow, they saw dramatic improvements across their organization.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-blue-600 dark:text-blue-400 text-2xl font-bold mb-2">45%</div>
                  <p className="text-gray-700 dark:text-gray-300">Increase in overall team productivity</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-purple-600 dark:text-purple-400 text-2xl font-bold mb-2">68%</div>
                  <p className="text-gray-700 dark:text-gray-300">Reduction in time spent on repetitive tasks</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-green-600 dark:text-green-400 text-2xl font-bold mb-2">3x</div>
                  <p className="text-gray-700 dark:text-gray-300">Faster project completion time</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Link href="#" className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center">
                  Read the full case study
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Growing Community</h2>
            <p className="text-lg mb-8 text-blue-100">Experience the benefits that thousands of teams are already enjoying with BoostFlow.</p>
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