import Link from 'next/link';

export const metadata = {
  title: 'Forgot Password - BoostFlow',
  description: 'Reset your BoostFlow account password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Forgot <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Password</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        </div>
      </section>

      {/* Forgot Password Form */}
      <section className="py-12 bg-white dark:bg-gray-900 flex-grow flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <Link href="/" className="inline-block">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BoostFlow</span>
                </Link>
              </div>
              
              <form className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{' '}
                  <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                    Back to login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}