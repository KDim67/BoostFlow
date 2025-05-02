import React from 'react';

export const metadata = {
  title: 'About Us | BoostFlow',
  description: 'Learn about BoostFlow, our mission, and the team behind the AI-powered productivity tool.',
};

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">About BoostFlow</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            BoostFlow is an AI-powered productivity tool designed to help teams automate repetitive tasks, 
            manage projects efficiently, and enhance collaboration across organizations of all sizes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="mb-6">
            Our mission is to empower teams to work smarter, not harder. We believe that by automating 
            routine tasks and providing intelligent insights, we can help organizations focus on what 
            truly matters: innovation, creativity, and growth.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Story</h2>
          <p className="mb-6">
            BoostFlow was founded in 2023 by a team of productivity enthusiasts who were frustrated with 
            the fragmented nature of existing project management tools. We set out to create a unified 
            platform that combines task management, automation, and analytics in one seamless experience.
          </p>
          <p className="mb-6">
            After months of development and testing with early adopters, we launched BoostFlow with a 
            mission to transform how teams work together. Today, we're proud to serve thousands of users 
            across various industries, from startups to enterprise organizations.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Values</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Simplicity:</strong> We believe that powerful tools don't have to be complicated.</li>
            <li><strong>Innovation:</strong> We continuously explore new ways to improve productivity.</li>
            <li><strong>User-Centric:</strong> Our users' needs drive every decision we make.</li>
            <li><strong>Transparency:</strong> We're open about our processes, pricing, and roadmap.</li>
            <li><strong>Quality:</strong> We're committed to delivering a reliable, high-performance product.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Leadership Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Alex Johnson</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-3">Co-Founder & CEO</p>
              <p>With over 15 years of experience in software development and product management, Alex leads our strategic vision and operations.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Sarah Chen</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-3">Co-Founder & CTO</p>
              <p>Sarah brings deep expertise in AI and machine learning, overseeing our technology development and innovation initiatives.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Michael Rodriguez</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-3">Head of Product</p>
              <p>Michael ensures that BoostFlow meets the evolving needs of our users through thoughtful product development and user research.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Emma Wilson</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-3">Head of Customer Success</p>
              <p>Emma leads our customer success team, ensuring that every BoostFlow user achieves their productivity goals.</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Join Our Team</h2>
          <p className="mb-6">
            We're always looking for talented individuals who are passionate about productivity and technology. 
            Check out our <a href="/careers" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Careers page</a> for current openings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;