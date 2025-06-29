import { NextRequest, NextResponse } from 'next/server';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { OrganizationRole } from '@/lib/types/organization';
import { getUserProfile } from '@/lib/firebase/userProfileService';

/**
 * Checks if a user account is suspended
 * @param userId - The unique identifier for the user
 * @returns Promise<boolean> - true if user is suspended, false otherwise
 * 
 */
async function checkUserSuspension(userId: string): Promise<boolean> {
  try {
    const userProfile = await getUserProfile(userId);
    // Use optional chaining to safely check suspension status
    return userProfile?.suspended === true;
  } catch (error) {
    console.error('Error checking user suspension:', error);
    return false;
  }
}

/**
 * Validates user permissions for accessing organization-specific resources
 * @param req - The incoming Next.js request object
 * @param organizationId - The ID of the organization being accessed
 * @param requiredRole - Minimum role required (defaults to 'viewer')
 * @returns Promise<NextResponse | null> - Redirect response if access denied, null if allowed
 * 
 */
export async function checkOrganizationPermission(
  req: NextRequest,
  organizationId: string,
  requiredRole: OrganizationRole = 'viewer'
): Promise<NextResponse | null> {
  // Extract user ID from custom header (set by authentication middleware)
  const userId = req.headers.get('x-user-id');
  
  // Redirect unauthenticated users to login
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Check if user account is suspended
  const isSuspended = await checkUserSuspension(userId);
  if (isSuspended) {
    return NextResponse.redirect(new URL('/suspended', req.url));
  }
  
  try {
    // Verify user has required role within the organization
    const hasPermission = await hasOrganizationPermission(userId, organizationId, requiredRole);
    
    if (!hasPermission) {
      // Redirect to organizations list if user lacks required permissions
      return NextResponse.redirect(new URL('/organizations', req.url));
    }
    
    // Return null to allow request to proceed
    return null;
  } catch (error) {
    console.error('Error checking organization permission:', error);
    // Redirect to dashboard on permission check failure
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}


/**
 * Main middleware function for organization-based route protection
 * Handles authentication, suspension checks, and role-based access control
 * @param req - The incoming Next.js request object
 * @returns Promise<NextResponse> - Either allows request to proceed or redirects
 * 
 */
export async function organizationAuthMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow access to public routes without any authentication checks
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/suspended') || pathname.startsWith('/api/auth') || pathname.startsWith('/terms-of-service')) {
    return NextResponse.next();
  }
  
  // Check suspension status for authenticated users on all protected routes
  const userId = req.headers.get('x-user-id');
  if (userId) {
    const isSuspended = await checkUserSuspension(userId);
    if (isSuspended) {
      return NextResponse.redirect(new URL('/suspended', req.url));
    }
  }
  
  // Handle organization-specific routes with role-based access control
  if (pathname.startsWith('/organizations/')) {
    // Extract organization ID from URL path: /organizations/{organizationId}/...
    const organizationId = pathname.split('/')[2];
    
    // Redirect to organizations list if no organization ID provided
    if (!organizationId) {
      return NextResponse.redirect(new URL('/organizations', req.url));
    }
    
    // Default to viewer role for basic organization access
    let requiredRole: OrganizationRole = 'viewer';
    
    // Admin-level operations require elevated permissions
    if (pathname.includes('/settings') || pathname.includes('/members/manage')) {
      requiredRole = 'admin';
    }
    
    // Owner-only operations (billing, deletion) require highest permissions
    if (pathname.includes('/billing') || pathname.includes('/delete')) {
      requiredRole = 'owner';
    }
    
    // Validate user permissions for the requested organization and role
    return await checkOrganizationPermission(req, organizationId, requiredRole);
  }
  
  // Allow request to proceed for all other routes
  return NextResponse.next();
}