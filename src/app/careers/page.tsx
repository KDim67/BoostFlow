import React from 'react';

export const metadata = {
  title: 'Careers | BoostFlow',
  description: 'Join our team at BoostFlow and help build the future of productivity tools.',
};

const CareersPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Careers at BoostFlow</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join our team of innovators and help shape the future of productivity tools. 
            At BoostFlow, we're building AI-powered solutions that transform how teams work together.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Why Work With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Innovative Environment</h3>
              <p>Work on cutting-edge AI technology and solve challenging problems that impact thousands of users.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Remote-First Culture</h3>
              <p>Enjoy the flexibility of working from anywhere with our distributed team spread across the globe.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Competitive Benefits</h3>
              <p>We offer competitive salaries, equity options, health benefits, and a generous vacation policy.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Growth Opportunities</h3>
              <p>Continuous learning is part of our DNA, with dedicated time for professional development.</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Open Positions</h2>
          
          <div className="space-y-6 mb-8">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Senior Frontend Engineer</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Remote • Full-time</p>
              <p className="mb-4">We're looking for an experienced frontend engineer to help build beautiful, responsive, and accessible user interfaces for our productivity platform.</p>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Requirements:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>5+ years of experience with React and modern JavaScript</li>
                  <li>Experience with Next.js and TypeScript</li>
                  <li>Strong understanding of web accessibility standards</li>
                  <li>Experience with responsive design and CSS frameworks</li>
                </ul>
              </div>
              <a href="#" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                Apply Now
              </a>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">AI/ML Engineer</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Remote • Full-time</p>
              <p className="mb-4">Join our AI team to develop intelligent features that help users automate workflows and gain insights from their productivity data.</p>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Requirements:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>3+ years of experience in machine learning or AI</li>
                  <li>Experience with Python and ML frameworks (TensorFlow, PyTorch)</li>
                  <li>Background in NLP or recommendation systems</li>
                  <li>Experience deploying ML models to production</li>
                </ul>
              </div>
              <a href="#" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                Apply Now
              </a>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Product Designer</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Remote • Full-time</p>
              <p className="mb-4">We're seeking a talented product designer to create intuitive and delightful experiences for our users.</p>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Requirements:</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>3+ years of experience in product design</li>
                  <li>Strong portfolio demonstrating UX/UI skills</li>
                  <li>Experience with design systems and component libraries</li>
                  <li>Familiarity with Figma and prototyping tools</li>
                </ul>
              </div>
              <a href="#" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                Apply Now
              </a>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Hiring Process</h2>
          <ol className="list-decimal pl-6 space-y-2 mb-8">
            <li><strong>Application Review:</strong> Our team reviews your resume and portfolio.</li>
            <li><strong>Initial Interview:</strong> A 30-minute call to get to know you and your background.</li>
            <li><strong>Technical Assessment:</strong> A take-home assignment or live coding session relevant to the role.</li>
            <li><strong>Team Interviews:</strong> Meet with potential teammates and cross-functional partners.</li>
            <li><strong>Final Interview:</strong> A conversation with a founder or executive team member.</li>
            <li><strong>Offer:</strong> We'll present you with a competitive offer and answer any questions.</li>
          </ol>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-3">Don't see a role that fits?</h3>
            <p className="mb-4">We're always interested in connecting with talented individuals. Send your resume to <a href="mailto:careers@boostflow.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">careers@boostflow.com</a> and tell us how you can contribute to our mission.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;