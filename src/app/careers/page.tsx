import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Careers | BoostFlow',
  description: 'Join our team at BoostFlow and help build the future of productivity tools.',
};

const CareersPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Careers at <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BoostFlow</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Join our team of innovators and help shape the future of productivity tools. 
              At BoostFlow, we're building AI-powered solutions that transform how teams work together.
            </p>
          </div>
        </div>
      </section>
      
      {/* Why Work With Us Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
          
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Work With Us</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Join a team that's passionate about building the future of work.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovative Environment</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Work on cutting-edge AI technology and solve challenging problems that impact thousands of users.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Remote-First Culture</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Enjoy the flexibility of working from anywhere with our distributed team spread across the globe.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Competitive Benefits</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">We offer competitive salaries, equity options, health benefits, and a generous vacation policy.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Growth Opportunities</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Continuous learning is part of our DNA, with dedicated time for professional development.</p>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Join our team and help us build the future of productivity.</p>
          </div>
          
          <div className="space-y-8 mb-16 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 md:p-8 transition-all hover:shadow-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Senior Frontend Engineer</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Remote • Full-time</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">We're looking for an experienced frontend engineer to help build beautiful, responsive, and accessible user interfaces for our productivity platform.</p>
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Requirements:</h4>
                <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-300">
                  <li>5+ years of experience with React and modern JavaScript</li>
                  <li>Experience with Next.js and TypeScript</li>
                  <li>Strong understanding of web accessibility standards</li>
                  <li>Experience with responsive design and CSS frameworks</li>
                </ul>
              </div>
              <Link href="#" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all inline-block">
                Apply Now
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 md:p-8 transition-all hover:shadow-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">AI/ML Engineer</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Remote • Full-time</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Join our AI team to develop intelligent features that help users automate workflows and gain insights from their productivity data.</p>
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Requirements:</h4>
                <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-300">
                  <li>3+ years of experience in machine learning or AI</li>
                  <li>Experience with Python and ML frameworks (TensorFlow, PyTorch)</li>
                  <li>Background in NLP or recommendation systems</li>
                  <li>Experience deploying ML models to production</li>
                </ul>
              </div>
              <Link href="#" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all inline-block">
                Apply Now
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 md:p-8 transition-all hover:shadow-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Product Designer</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Remote • Full-time</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">We're seeking a talented product designer to create intuitive and delightful experiences for our users.</p>
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Requirements:</h4>
                <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-300">
                  <li>3+ years of experience in product design</li>
                  <li>Strong portfolio demonstrating UX/UI skills</li>
                  <li>Experience with design systems and component libraries</li>
                  <li>Familiarity with Figma and prototyping tools</li>
                </ul>
              </div>
              <Link href="#" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all inline-block">
                Apply Now
              </Link>
            </div>
          </div>
          
        </div>
      </section>

      {/* Hiring Process Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Hiring Process</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Simple, transparent, and focused on finding the right fit.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-3xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Application</h3>
              <p className="text-gray-600 dark:text-gray-300">Our team reviews your resume and portfolio to assess your qualifications.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Interviews</h3>
              <p className="text-gray-600 dark:text-gray-300">Initial call, technical assessment, and team interviews to get to know you better.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Offer</h3>
              <p className="text-gray-600 dark:text-gray-300">We'll present you with a competitive offer and answer any questions you have.</p>
            </div>
          </div>
          
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Don't See a Role That Fits?</h2>
            <p className="text-lg mb-8 text-blue-100">We're always interested in connecting with talented individuals who are passionate about our mission.</p>
            <Link
              href={""}
              className="bg-white text-blue-600 font-medium py-3 px-8 rounded-full hover:shadow-lg transition-all inline-block"
            >
              Contact Us
            </Link>
            <p className="mt-4 text-sm text-blue-100">Send your resume to <a className="text-white hover:underline">career email here</a></p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;