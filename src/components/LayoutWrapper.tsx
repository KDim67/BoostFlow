'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSuspensionCheck } from '@/lib/hooks/useSuspensionCheck';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith('/platform-admin');
  const isSuspendedPage = pathname === '/suspended';
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const shouldCheckSuspension = !isSuspendedPage && !isAuthPage;
  useSuspensionCheck(shouldCheckSuspension);

  return (
    <>
      {!isAdminPanel && <Navbar />}
      <main className={isAdminPanel ? "" : "flex-grow pt-16 md:pt-20"}>
        {children}
      </main>
      {!isAdminPanel && <Footer />}
    </>
  );
}