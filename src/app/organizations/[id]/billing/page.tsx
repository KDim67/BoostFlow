'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/useAuth';
import { getOrganization, hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { Organization, SubscriptionPlan } from '@/lib/types/organization';

export default function OrganizationBilling() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('free');
  const { user } = useAuth();
  const organizationId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user || !organizationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const permission = await hasOrganizationPermission(user.uid, organizationId, 'admin');
        
        if (!permission) {
          setError('You do not have permission to manage billing for this organization.');
          setIsLoading(false);
          return;
        }
        
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);
        if (orgData) {
          setSelectedPlan(orgData.plan);
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
        setError('Failed to load billing data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [user, organizationId]);

  const handleUpdatePlan = async () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      if (organization) {
        setOrganization({
          ...organization,
          plan: selectedPlan
        });
      }
    }, 1500);
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free':
        return [
          '3 projects',
          '5 team members',
          '1GB storage',
          'Basic automation'
        ];
      case 'starter':
        return [
          '10 projects',
          '15 team members',
          '10GB storage',
          'Advanced automation',
          'Priority support'
        ];
      case 'professional':
        return [
          'Unlimited projects',
          '50 team members',
          '100GB storage',
          'Advanced automation',
          'Priority support',
          'Custom integrations'
        ];
      case 'enterprise':
        return [
          'Unlimited everything',
          'Dedicated support',
          'Custom development',
          'SLA guarantees',
          'On-premise options'
        ];
      default:
        return [];
    }
  };

  const getPlanPrice = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free': return '$0';
      case 'starter': return '$29';
      case 'professional': return '$99';
      case 'enterprise': return 'Contact us';
      default: return '$0';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          {error || 'Organization not found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The organization you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link 
          href="/organizations"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your organization's subscription plan and billing information
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Current Plan</h2>
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{organization.plan} Plan</h3>
            <p className="text-gray-500 dark:text-gray-400">{getPlanPrice(organization.plan)} per month</p>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Features:</h4>
          <ul className="space-y-2">
            {getPlanFeatures(organization.plan).map((feature, index) => (
              <li key={index} className="flex items-center text-gray-600 dark:text-gray-300">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Free Plan */}
          <div className={`border rounded-lg p-6 ${selectedPlan === 'free' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Free</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">$0<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
            <ul className="mb-6 space-y-2">
              {getPlanFeatures('free').map((feature, index) => (
                <li key={index} className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setSelectedPlan('free')} 
              className={`w-full py-2 rounded-md ${selectedPlan === 'free' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              {organization.plan === 'free' ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>

          {/* Starter Plan */}
          <div className={`border rounded-lg p-6 ${selectedPlan === 'starter' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Starter</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">$29<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
            <ul className="mb-6 space-y-2">
              {getPlanFeatures('starter').map((feature, index) => (
                <li key={index} className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setSelectedPlan('starter')} 
              className={`w-full py-2 rounded-md ${selectedPlan === 'starter' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              {organization.plan === 'starter' ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>

          {/* Professional Plan */}
          <div className={`border rounded-lg p-6 ${selectedPlan === 'professional' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="absolute -top-3 left-0 right-0 flex justify-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full">Popular</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Professional</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">$99<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
            <ul className="mb-6 space-y-2">
              {getPlanFeatures('professional').map((feature, index) => (
                <li key={index} className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setSelectedPlan('professional')} 
              className={`w-full py-2 rounded-md ${selectedPlan === 'professional' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              {organization.plan === 'professional' ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className={`border rounded-lg p-6 ${selectedPlan === 'enterprise' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Enterprise</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Custom<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span></p>
            <ul className="mb-6 space-y-2">
              {getPlanFeatures('enterprise').map((feature, index) => (
                <li key={index} className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setSelectedPlan('enterprise')} 
              className={`w-full py-2 rounded-md ${selectedPlan === 'enterprise' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              {organization.plan === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
            </button>
          </div>
        </div>

        {/* Update Plan Button */}
        {selectedPlan !== organization.plan && (
          <div className="mt-8 text-center">
            <button
              onClick={handleUpdatePlan}
              disabled={isUpdating}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : `Upgrade to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`}
            </button>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              You will be charged {getPlanPrice(selectedPlan)} per month for the {selectedPlan} plan.
            </p>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Payment Methods</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Add or update your payment methods to manage your subscription.
        </p>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Add Payment Method
        </button>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Billing History</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No billing history available yet.</p>
        </div>
      </div>
    </div>
  );
}