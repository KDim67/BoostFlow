'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function PricingPage() {
  const [teamSize, setTeamSize] = useState(300);
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  const basePrices = {
    starter: 7.49,
    pro: 15
  };
  

  const calculatePrice = (basePrice: number) => {
    let discount = 0;
    
    if (teamSize > 500) {
      discount = 0.25; // 25% discount for very large teams
    } else if (teamSize > 300) {
      discount = 0.20; // 20% discount for large teams
    } else if (teamSize > 100) {
      discount = 0.15; // 15% discount for medium teams
    } else if (teamSize > 50) {
      discount = 0.10; // 10% discount for small teams
    } else if (teamSize > 20) {
      discount = 0.05; // 5% discount for very small teams
    }
    
    const annualDiscount = billingCycle === 'annually' ? 0.17 : 0; // 17% discount for annual billing
    
    const discountedPrice = basePrice * (1 - discount) * (1 - annualDiscount);
    return discountedPrice.toFixed(2);
  };
  
  const starterPrice = calculatePrice(basePrices.starter);
  const proPrice = calculatePrice(basePrices.pro);

  const getCurrentDiscount = () => {
    if (teamSize > 500) return 25;
    if (teamSize > 300) return 20;
    if (teamSize > 100) return 15;
    if (teamSize > 50) return 10;
    if (teamSize > 20) return 5;
    return 0;
  };
  
  const getRecommendedPlan = () => {
    if (teamSize <= 15) return 'free';
    if (teamSize <= 250) return 'starter';
    if (teamSize <= 500) return 'pro';
    return 'enterprise';
  };
  
  const recommendedPlan = getRecommendedPlan();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pricing</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Choose the plan that works best for your team. All plans include a 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Team Size Selector */}
      <section className="py-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="team-size" className="text-lg font-medium text-gray-700 dark:text-gray-300">Team size:</label>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1 rounded-full shadow-sm">
                    <input 
                      type="number" 
                      id="team-size-input" 
                      min="1" 
                      max="1000" 
                      value={teamSize} 
                      onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                      className="w-16 text-center border-none focus:ring-0 focus:outline-none bg-transparent text-gray-700 dark:text-gray-300"
                    />
                    <span className="text-gray-600 dark:text-gray-400">users</span>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="range" 
                    id="team-size" 
                    min="1" 
                    max="1000" 
                    value={teamSize} 
                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="relative mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="absolute left-0">1</span>
                    <span className="absolute -translate-x-1/2 left-1/4">250</span>
                    <span className="absolute -translate-x-1/2 left-1/2">500</span>
                    <span className="absolute -translate-x-1/2 left-3/4">750</span>
                    <span className="absolute -translate-x-full left-full">1000</span>
                  </div>
                </div>
                {getCurrentDiscount() > 0 && (
                  <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                    {getCurrentDiscount()}% team size discount applied!
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <label className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Bill me:</label>
                <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`flex items-center justify-center px-4 py-2 rounded-full transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    Monthly
                  </button>
                  
                  <button
                    onClick={() => setBillingCycle('annually')}
                    className={`flex items-center justify-center px-4 py-2 rounded-full transition-all ${billingCycle === 'annually' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    Annually
                  </button>
                </div>
                {billingCycle === 'annually' && (
                  <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400 text-center">
                    SAVE UP TO 17%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 relative flex flex-col h-full">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gray-500 rounded-t-xl"></div>
              <div className="flex items-center gap-2 mb-4 mt-4">
                <h3 className="text-xl font-bold">Free</h3>
                {recommendedPlan === 'free' && (
                  <div className="bg-gray-500 text-white text-xs font-bold uppercase py-1 px-3 rounded-full inline-block">Recommended</div>
                )}
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">€0</span>
                <span className="text-gray-500 dark:text-gray-400">/forever</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for individuals and small projects to get started.</p>
              
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Up to 15 users</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Limited automation workflows</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Basic analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">4 GB storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-gray-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Community support</span>
                </li>
              </ul>
              
              <Link 
                href={teamSize > 15 ? "#" : "/signup?plan=free"}
                className={`block w-full font-medium py-3 px-6 rounded-full transition-all text-center mt-auto ${
                  teamSize > 15 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-white text-gray-600 border border-gray-600 hover:bg-gray-50'
                }`}
                onClick={teamSize > 15 ? (e) => e.preventDefault() : undefined}
              >
                {teamSize > 15 ? 'Not Available' : 'Get Started'}
              </Link>
              {teamSize > 15 && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Free plan is limited to 15 users
                </p>
              )}
            </div>

            {/* Starter Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 relative flex flex-col h-full">
              <div className="absolute top-0 left-0 right-0 h-2 bg-blue-500 rounded-t-xl"></div>
              <div className="flex items-center gap-2 mb-4 mt-4">
                <h3 className="text-xl font-bold">Starter</h3>
                {recommendedPlan === 'starter' && (
                  <div className="bg-blue-500 text-white text-xs font-bold uppercase py-1 px-3 rounded-full inline-block">Recommended</div>
                )}
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">€{starterPrice}</span>
                <span className="text-gray-500 dark:text-gray-400">/month per user</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for small teams just getting started with automation.</p>
              
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Unlimited Users</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Basic automation workflows</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Standard analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">250 GB storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Email support</span>
                </li>
              </ul>
              
              <Link 
                href="/signup?plan=starter" 
                className="block w-full bg-white text-blue-600 border border-blue-600 font-medium py-3 px-6 rounded-full hover:bg-blue-50 transition-all text-center mt-auto"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 relative flex flex-col h-full">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-xl"></div>
              <div className="flex items-center gap-2 mb-4 mt-4">
                <h3 className="text-xl font-bold">Pro</h3>
                {recommendedPlan === 'pro' && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold uppercase py-1 px-3 rounded-full inline-block">Recommended</div>
                )}
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">€{proPrice}</span>
                <span className="text-gray-500 dark:text-gray-400">/month per user</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">For growing teams that need advanced features and more customization.</p>
              
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Unlimited users</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Advanced automation workflows</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">AI-powered analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Unlimited Storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                </li>
              </ul>
              
              <Link 
                href="/signup?plan=pro" 
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-full hover:shadow-lg transition-all text-center mt-auto"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg hover:border-green-300 dark:hover:border-green-600 relative flex flex-col h-full">
              <div className="absolute top-0 left-0 right-0 h-2 bg-green-500 rounded-t-xl"></div>
              <div className="flex items-center gap-2 mb-4 mt-4">
                <h3 className="text-xl font-bold">Enterprise</h3>
                {recommendedPlan === 'enterprise' && (
                  <div className="bg-green-500 text-white text-xs font-bold uppercase py-1 px-3 rounded-full inline-block">Recommended</div>
                )}
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
                <span className="text-gray-500 dark:text-gray-400"></span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">For large organizations with custom requirements and dedicated support.</p>
              
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Everything in Pro plan</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Custom AI model training</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Unlimited storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">24/7 premium support</span>
                </li>
              </ul>
              
              <Link 
                href="/contact" 
                className="block w-full bg-white text-green-600 border border-green-600 font-medium py-3 px-6 rounded-full hover:bg-green-50 transition-all text-center mt-auto"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Compare Plans</h2>
            
            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-md">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="py-4 px-6 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Features</th>
                    <th className="py-4 px-6 text-center font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Free</th>
                    <th className="py-4 px-6 text-center font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700">Starter</th>
                    <th className="py-4 px-6 text-center font-semibold text-purple-600 dark:text-purple-400 border-b border-gray-200 dark:border-gray-700">Pro</th>
                    <th className="py-4 px-6 text-center font-semibold text-green-600 dark:text-green-400 border-b border-gray-200 dark:border-gray-700">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 font-medium">Users</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Up to 15</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Unlimited</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Unlimited</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 font-medium">Storage</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">4 GB</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">250 GB</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Unlimited</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 font-medium">Automation Workflows</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Limited</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Basic</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Advanced</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Custom</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 font-medium">Analytics</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Basic</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Standard</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">AI-Powered</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Custom AI Models</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 font-medium">Support</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Community</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Email</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Priority</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">24/7 Premium</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300 font-medium">Integrations</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Limited</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Basic</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Advanced</td>
                    <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-300">Custom</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-12 text-center">
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all"
              >
                Need help choosing? Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}