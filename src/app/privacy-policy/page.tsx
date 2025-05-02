import React from 'react';

export const metadata = {
  title: 'Privacy Policy | BoostFlow',
  description: 'Learn about how BoostFlow collects, uses, and protects your personal information.',
};

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header Section with Gradient Background */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-8 mb-10 shadow-md">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Privacy Policy</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        <div className="prose prose-blue dark:prose-invert max-w-none bg-white dark:bg-gray-900 rounded-xl shadow-md p-8">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            At BoostFlow, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
            and safeguard your information when you visit our website or use our productivity platform.
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="mb-4">We may collect information about you in various ways, including:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>
                <strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. This may include, but is not limited to, your email address, name, phone number, and company information.
              </li>
              <li>
                <strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used. This may include information such as your computer's Internet Protocol address, browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.
              </li>
              <li>
                <strong>Cookies and Tracking Data:</strong> We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect for various purposes, including to:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Provide, operate, and maintain our services</li>
              <li>Improve, personalize, and expand our services</li>
              <li>Understand and analyze how you use our services</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Communicate with you, either directly or through one of our partners, to provide you with updates and other information relating to the service</li>
              <li>Process your transactions</li>
              <li>Send you emails</li>
              <li>Find and prevent fraud</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Sharing Your Information</h2>
            <p className="mb-6">
              We may share the information we collect in various ways, including:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>
                <strong>With Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work.
              </li>
              <li>
                <strong>For Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.
              </li>
              <li>
                <strong>With Affiliates:</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Policy.
              </li>
              <li>
                <strong>With Business Partners:</strong> We may share your information with our business partners to offer you certain products, services, or promotions.
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="mb-6">
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Data Protection Rights</h2>
            <p className="mb-4">Depending on your location, you may have the following data protection rights:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>The right to access, update, or delete the information we have on you</li>
              <li>The right of rectification - the right to have your information corrected if it is inaccurate or incomplete</li>
              <li>The right to object to our processing of your personal data</li>
              <li>The right of restriction - the right to request that we restrict the processing of your personal information</li>
              <li>The right to data portability - the right to be provided with a copy of your personal data in a structured, machine-readable format</li>
              <li>The right to withdraw consent at any time where we relied on your consent to process your personal information</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p className="mb-6">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-6">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@boostflow.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                privacy@boostflow.com
              </a>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/contact" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                Contact Us
              </a>
              <a href="/terms-of-service" className="inline-block bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-md transition-colors">
                View Terms of Service
              </a>
            </div>
          </div>
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold mb-4">Stay Updated</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter to get notified about privacy policy updates and security news.
            </p>
            <div className="max-w-md mx-auto">
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;