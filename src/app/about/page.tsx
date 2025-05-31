import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'About Us | BoostFlow',
  description: 'Learn about BoostFlow, our mission, and the team behind the AI-powered productivity tool.',
};

const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BoostFlow</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              BoostFlow is an AI-powered productivity tool designed to help teams automate repetitive tasks, 
              manage projects efficiently, and enhance collaboration across organizations of all sizes.
            </p>
          </div>
        </div>
      </section>
      
      {/* Our Mission Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our mission is to empower teams to work smarter, not harder. We believe that by automating 
                routine tasks and providing intelligent insights, we can help organizations focus on what 
                truly matters: innovation, creativity, and growth.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Story Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 md:p-8">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  BoostFlow was founded in 2025 by a team of productivity enthusiasts who were frustrated with 
                  the fragmented nature of existing project management tools. We set out to create a unified 
                  platform that combines task management, automation, and analytics in one seamless experience.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  After months of development and testing with early adopters, we launched BoostFlow with a 
                  mission to transform how teams work together. Today, we're proud to serve thousands of users 
                  across various industries, from startups to enterprise organizations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Values Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                The principles that guide everything we do
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Simplicity</h3>
                <p className="text-gray-600 dark:text-gray-300">We believe that powerful tools don't have to be complicated.</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-gray-600 dark:text-gray-300">We continuously explore new ways to improve productivity.</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">User-Centric</h3>
                <p className="text-gray-600 dark:text-gray-300">Our users' needs drive every decision we make.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                <p className="text-gray-600 dark:text-gray-300">We're open about our processes, pricing, and roadmap.</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality</h3>
                <p className="text-gray-600 dark:text-gray-300">We're committed to delivering a reliable, high-performance product.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Leadership Team Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Leadership Team</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Meet the people behind BoostFlow</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold mb-1 text-center">Dimitris Koutsompinas</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">Co-Founder</p>
                <p className="text-gray-600 dark:text-gray-300 text-center">With over 10 minutes of experience in software development and product management, Dimitris leads our strategic vision and operations.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold mb-1 text-center">Evangelos Leivaditis</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">Co-Founder</p>
                <p className="text-gray-600 dark:text-gray-300 text-center">Evangelos brings extensive expertise in DevOps practices, specializing in CI/CD pipeline optimization and containerization strategies. His innovative approach to infrastructure automation has been instrumental in scaling BoostFlow's architecture.</p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold mb-1 text-center">Nikolaos Douros</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">Co-Founder</p>
                <p className="text-gray-600 dark:text-gray-300 text-center">Nikolaos is a DevOps evangelist with deep knowledge in cloud infrastructure and Kubernetes orchestration. He leads our platform reliability initiatives and has developed our microservices architecture to ensure seamless scalability and resilience.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Join Our Team Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Join Our Team</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                We're always looking for talented individuals who are passionate about productivity and technology.
              </p>
              <Link 
                href="/careers" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all inline-block"
              >
                View Open Positions
              </Link>
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
};

export default AboutPage;