'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './useAuth';
import { getUserOrganizations, getOrganization } from './organizationService';
import { Organization, OrganizationWithDetails } from '../types/organization';

interface OrganizationContextType {
  activeOrganization: OrganizationWithDetails | null;
  organizations: OrganizationWithDetails[];
  isLoading: boolean;
  error: string | null;
  setActiveOrganization: (organization: OrganizationWithDetails) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [activeOrganization, setActiveOrganization] = useState<OrganizationWithDetails | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();

  const refreshOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setActiveOrganization(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const userOrgs = await getUserOrganizations(user.uid);
      setOrganizations(userOrgs);
      
      // Check if we're on an organization-specific page
      const orgIdFromUrl = pathname?.match(/\/organizations\/([^/]+)/)?.[1];
      
      if (orgIdFromUrl) {
        // If URL contains organization ID, prioritize that
        const urlOrg = userOrgs.find(org => org.id === orgIdFromUrl);
        if (urlOrg) {
          setActiveOrganization(urlOrg);
          localStorage.setItem('lastActiveOrganization', urlOrg.id);
          return;
        }
      }
      
      // Fallback to localStorage or first organization
      const lastActiveOrgId = localStorage.getItem('lastActiveOrganization');
      
      if (lastActiveOrgId) {
        const activeOrg = userOrgs.find(org => org.id === lastActiveOrgId);
        if (activeOrg) {
          setActiveOrganization(activeOrg);
        } else if (userOrgs.length > 0) {
          setActiveOrganization(userOrgs[0]);
          localStorage.setItem('lastActiveOrganization', userOrgs[0].id);
        } else {
          setActiveOrganization(null);
        }
      } else if (userOrgs.length > 0) {
        setActiveOrganization(userOrgs[0]);
        localStorage.setItem('lastActiveOrganization', userOrgs[0].id);
      } else {
        setActiveOrganization(null);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshOrganizations();
  }, [user, pathname]);

  // Listen for organization logo updates
  useEffect(() => {
    const handleLogoUpdate = (event: CustomEvent) => {
      const { organizationId, logoUrl } = event.detail;
      
      // Update organizations list
      setOrganizations(prev => prev.map(org => 
        org.id === organizationId ? { ...org, logoUrl } : org
      ));
      
      // Update active organization if it matches
      setActiveOrganization(prev => 
        prev?.id === organizationId ? { ...prev, logoUrl } : prev
      );
    };

    window.addEventListener('organizationLogoUpdated', handleLogoUpdate as EventListener);
    
    return () => {
      window.removeEventListener('organizationLogoUpdated', handleLogoUpdate as EventListener);
    };
  }, []);

  const handleSetActiveOrganization = (organization: OrganizationWithDetails) => {
    setActiveOrganization(organization);
    localStorage.setItem('lastActiveOrganization', organization.id);
  };

  const value = {
    activeOrganization,
    organizations,
    isLoading,
    error,
    setActiveOrganization: handleSetActiveOrganization,
    refreshOrganizations
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}