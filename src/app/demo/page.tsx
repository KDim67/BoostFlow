'use client';

import Link from 'next/link';

export default function DemoPage() {
  const figmaProtoUrl = "https://embed.figma.com/proto/hP9qZi5dsNPQP38tCmx2rm/BoostFlow?node-id=7-267&p=f&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=7%3A267&embed-host=share";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Gradient Background */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Interactive</span> Prototype
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
              Explore the interactive prototype of our upcoming feature. Built in Figma for a first-hand look at the experience.
            </p>
          </div>
        </div>
      </section>

      {/* Figma Prototype Container */}
      <section className="py-8 md:py-12 bg-white dark:bg-gray-900 flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="relative w-[400px]">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-1 relative z-10">
                <div className="relative w-full" style={{ paddingTop: '177.78%' }}>
                  <iframe 
                    className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
                    style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
                    width="800" 
                    height="450" 
                    src={figmaProtoUrl}
                    allowFullScreen
                  />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl -z-10"></div>
            </div>
          </div>
          
          {/* Prototype information text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mx-auto max-w-2xl">
              This is an early-stage prototype. The final version may include additional features and refinements based on user feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-10 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Experience More?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              <a 
                href={figmaProtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-8 rounded-full hover:shadow-lg transition-all text-center"
              >
                Open Fullscreen Demo
              </a>
              <Link 
                href="/beta"
                className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium py-3 px-8 rounded-full hover:shadow-lg transition-all text-center"
              >
                Try the Beta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Home Link */}
      <div className="py-6 text-center bg-white dark:bg-gray-900">
        <Link 
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}