import React from 'react';

export const metadata = {
  title: 'Community | BoostFlow',
  description: 'Join the BoostFlow community to connect with other users, share ideas, and get help.',
};

const CommunityPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">BoostFlow Community</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Connect with other BoostFlow users, share ideas, get help, and stay up to date with the latest product developments.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-3">Discussion Forum</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Join conversations with other users, ask questions, and share your experiences with BoostFlow.</p>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Visit Forum →
                </a>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-3">Slack Community</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Join our Slack workspace for real-time discussions and direct access to our team.</p>
                <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Join Slack →
                </a>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Community Resources</h2>
          
          <div className="space-y-6 mb-12">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-2">User Showcase</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                See how other organizations are using BoostFlow to improve their productivity and workflows.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                View Showcase →
              </a>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-2">Community Templates</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Browse and download project templates, automation workflows, and dashboards created by the community.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Explore Templates →
              </a>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-xl font-semibold mb-2">Community Events</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Join virtual meetups, hackathons, and other events to connect with fellow BoostFlow users.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                See Upcoming Events →
              </a>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Community Programs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Champions Program</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Become a BoostFlow Champion and help others get the most out of the platform while earning recognition and rewards.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Learn More →
              </a>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Beta Testing</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Join our beta testing program to get early access to new features and help shape the future of BoostFlow.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                Apply Now →
              </a>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Community Guidelines</h2>
          <p className="mb-6">
            Our community is built on respect, collaboration, and a shared passion for productivity. To ensure a positive experience for everyone, we ask all members to follow these guidelines:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Be respectful and inclusive of all community members</li>
            <li>Share knowledge and help others when you can</li>
            <li>Keep discussions relevant to BoostFlow and productivity</li>
            <li>Do not spam or promote unrelated products or services</li>
            <li>Respect intellectual property and confidential information</li>
            <li>Report inappropriate behavior to our community moderators</li>
          </ul>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mt-12">
            <h3 className="text-lg font-semibold mb-3">Have Questions?</h3>
            <p className="mb-4">Our community managers are here to help you get connected and make the most of our community resources.</p>
            <a href="/contact" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;