import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organization Management | Platform Admin',
  description: 'Global organization management for platform administrators',
};

export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}