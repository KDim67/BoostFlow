import React from 'react';

export const metadata = {
  title: 'Terms of Service | BoostFlow',
  description: 'Read the terms and conditions for using BoostFlow, the AI-powered productivity tool.',
};

const TermsOfServicePage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          
          <p className="mb-6">
            Please read these Terms of Service ("Terms") carefully before using the BoostFlow platform operated by BoostFlow, Inc.
            Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
            These Terms apply to all visitors, users, and others who access or use the Service.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-6">
            By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, 
            then you may not access the Service. Your continued use of the platform following the posting of any changes to the 
            Terms constitutes acceptance of those changes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Account Registration</h2>
          <p className="mb-6">
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>
          <p className="mb-6">
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. 
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or 
            unauthorized use of your account.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Subscription and Payments</h2>
          <p className="mb-6">
            Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis, 
            depending on the type of subscription plan you select. At the end of each period, your subscription will automatically renew 
            under the same conditions unless you cancel it or BoostFlow, Inc. cancels it.
          </p>
          <p className="mb-6">
            You may cancel your subscription either through your online account management page or by contacting our customer support team. 
            You will not receive a refund for the fees you already paid for your current subscription period, and you will continue to have 
            access to the Service through the end of your current subscription period.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Free Trial</h2>
          <p className="mb-6">
            BoostFlow, Inc. may, at its sole discretion, offer a subscription with a free trial for a limited period of time. 
            You may be required to enter your billing information to sign up for the free trial. If you do enter your billing information 
            when signing up for a free trial, you will not be charged by BoostFlow, Inc. until the free trial has expired. 
            On the last day of the free trial period, unless you canceled your subscription, you will be automatically charged the applicable 
            subscription fee for the type of subscription you have selected.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
          <p className="mb-6">
            The Service and its original content, features, and functionality are and will remain the exclusive property of BoostFlow, Inc. 
            and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. 
            Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of BoostFlow, Inc.
          </p>
          <p className="mb-6">
            You retain any and all of your rights to any content you submit, post, or display on or through the Service, and you are responsible 
            for protecting those rights. We take no responsibility and assume no liability for content you or any third party posts on or through the Service.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. User Content</h2>
          <p className="mb-6">
            Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, 
            or other material. You are responsible for the content that you post on or through the Service, including its legality, reliability, and appropriateness.
          </p>
          <p className="mb-6">
            By posting content on or through the Service, you represent and warrant that: (i) the content is yours (you own it) or you have the right to use it 
            and grant us the rights and license as provided in these Terms, and (ii) the posting of your content on or through the Service does not violate 
            the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitation of Liability</h2>
          <p className="mb-6">
            In no event shall BoostFlow, Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
            incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other 
            intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of 
            any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your 
            transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not 
            we have been informed of the possibility of such damage.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Termination</h2>
          <p className="mb-6">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without 
            limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate 
            your account, you may simply discontinue using the Service, or notify us that you wish to delete your account.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Governing Law</h2>
          <p className="mb-6">
            These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. 
            Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms 
            is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to Terms</h2>
          <p className="mb-6">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide 
            at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. 
            By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
          <p className="mb-6">
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@boostflow.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              legal@boostflow.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;