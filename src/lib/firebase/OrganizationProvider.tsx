'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  }, [user]);

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