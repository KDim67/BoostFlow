'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSuspensionCheck } from '@/lib/hooks/useSuspensionCheck';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper component that conditionally renders navigation and footer
 * based on the current route. Handles different layout requirements for
 * admin panels, auth pages, and regular application pages.
 */
export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Route detection for conditional layout rendering
  const isAdminPanel = pathname?.startsWith('/platform-admin');
  const isSuspendedPage = pathname === '/suspended';
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // Skip suspension checks for pages that don't require user authentication
  const shouldCheckSuspension = !isSuspendedPage && !isAuthPage;
  useSuspensionCheck(shouldCheckSuspension);

  return (
    <>
      {/* Hide navbar on admin panel pages */}
      {!isAdminPanel && <Navbar />}
      <main className={isAdminPanel ? "" : "flex-grow pt-16 md:pt-20"}>
        {children}
      </main>
      {/* Hide footer on admin panel pages */}
      {!isAdminPanel && <Footer />}
    </>
  );
}