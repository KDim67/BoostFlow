'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './useAuth';
import { getUserOrganizations, getOrganization } from './organizationService';
import { Organization, OrganizationWithDetails } from '../types/organization';

/**
 * Context type definition for organization management
 * Provides access to user's organizations and active organization state
 */
interface OrganizationContextType {
  activeOrganization: OrganizationWithDetails | null; // Currently selected organization
  organizations: OrganizationWithDetails[]; // All organizations user belongs to
  isLoading: boolean; // Loading state for async operations
  error: string | null; // Error message if operations fail
  setActiveOrganization: (organization: OrganizationWithDetails) => void; // Function to change active org
  refreshOrganizations: () => Promise<void>; // Function to reload organizations from server
}

// Create React context for organization state management
const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

/**
 * React Context Provider for organization management
 * Handles organization state, active organization selection, and persistence
 * Automatically syncs with URL parameters and localStorage for seamless UX
 */
export function OrganizationProvider({ children }: { children: ReactNode }) {
  // State management for organization data
  const [activeOrganization, setActiveOrganization] = useState<OrganizationWithDetails | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dependencies for organization logic
  const { user } = useAuth(); // Current authenticated user
  const pathname = usePathname(); // Current URL path for organization detection

  /**
   * Fetches user organizations and determines active organization
   * Priority order: URL parameter > localStorage > first organization
   * Handles edge cases like invalid stored IDs and empty organization lists
   */
  const refreshOrganizations = async () => {
    // Early return if user is not authenticated
    if (!user) {
      setOrganizations([]);
      setActiveOrganization(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all organizations user belongs to
      const userOrgs = await getUserOrganizations(user.uid);
      setOrganizations(userOrgs);
      
      // Extract organization ID from URL path (e.g., /organizations/org-123)
      const orgIdFromUrl = pathname?.match(/\/organizations\/([^/]+)/)?.[1];
      
      if (orgIdFromUrl) {
        // URL-based organization takes highest priority for deep linking
        const urlOrg = userOrgs.find(org => org.id === orgIdFromUrl);
        if (urlOrg) {
          setActiveOrganization(urlOrg);
          localStorage.setItem('lastActiveOrganization', urlOrg.id);
          return;
        }
      }
      
      // Fallback hierarchy: localStorage > first available organization
      const lastActiveOrgId = localStorage.getItem('lastActiveOrganization');
      
      if (lastActiveOrgId) {
        // Try to restore previously active organization
        const activeOrg = userOrgs.find(org => org.id === lastActiveOrgId);
        if (activeOrg) {
          setActiveOrganization(activeOrg);
        } else if (userOrgs.length > 0) {
          // Stored org no longer exists, fallback to first available
          setActiveOrganization(userOrgs[0]);
          localStorage.setItem('lastActiveOrganization', userOrgs[0].id);
        } else {
          // No organizations available
          setActiveOrganization(null);
        }
      } else if (userOrgs.length > 0) {
        // No stored preference, use first organization
        setActiveOrganization(userOrgs[0]);
        localStorage.setItem('lastActiveOrganization', userOrgs[0].id);
      } else {
        // User has no organizations
        setActiveOrganization(null);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger organization refresh when user changes or URL path changes
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

    // Register global event listener for logo updates
    window.addEventListener('organizationLogoUpdated', handleLogoUpdate as EventListener);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('organizationLogoUpdated', handleLogoUpdate as EventListener);
    };
  }, []);

  /**
   * Handler for manually setting active organization
   * Updates both state and localStorage for persistence
   */
  const handleSetActiveOrganization = (organization: OrganizationWithDetails) => {
    setActiveOrganization(organization);
    localStorage.setItem('lastActiveOrganization', organization.id);
  };

  // Context value object containing all organization state and methods
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