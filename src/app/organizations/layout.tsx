'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * OrganizationsLayout component.
 * This layout component provides a consistent structure for pages within the organizations section of the application.
 * It includes a header area and renders its children within a main content area.
 *
 */
export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        </div>
        {/* Content */}
        {children}
      </div>
    </div>
  );
}