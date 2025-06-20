import { NextRequest, NextResponse } from 'next/server';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { OrganizationRole } from '@/lib/types/organization';
import { getUserProfile } from '@/lib/firebase/userProfileService';

async function checkUserSuspension(userId: string): Promise<boolean> {
  try {
    const userProfile = await getUserProfile(userId);
    return userProfile?.suspended === true;
  } catch (error) {
    console.error('Error checking user suspension:', error);
    return false;
  }
}

export async function checkOrganizationPermission(
  req: NextRequest,
  organizationId: string,
  requiredRole: OrganizationRole = 'viewer'
): Promise<NextResponse | null> {
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  const isSuspended = await checkUserSuspension(userId);
  if (isSuspended) {
    return NextResponse.redirect(new URL('/suspended', req.url));
  }
  
  try {
    const hasPermission = await hasOrganizationPermission(userId, organizationId, requiredRole);
    
    if (!hasPermission) {
    return NextResponse.redirect(new URL('/organizations', req.url));
    }
    
    return null;
  } catch (error) {
    console.error('Error checking organization permission:', error);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}


export async function organizationAuthMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/suspended') || pathname.startsWith('/api/auth') || pathname.startsWith('/terms-of-service')) {
    return NextResponse.next();
  }
  
  const userId = req.headers.get('x-user-id');
  if (userId) {
    const isSuspended = await checkUserSuspension(userId);
    if (isSuspended) {
      return NextResponse.redirect(new URL('/suspended', req.url));
    }
  }
  
  if (pathname.startsWith('/organizations/')) {
    const organizationId = pathname.split('/')[2];
    
    if (!organizationId) {
      return NextResponse.redirect(new URL('/organizations', req.url));
    }
    
    let requiredRole: OrganizationRole = 'viewer';
    
    if (pathname.includes('/settings') || pathname.includes('/members/manage')) {
      requiredRole = 'admin';
    }
    
    if (pathname.includes('/billing') || pathname.includes('/delete')) {
      requiredRole = 'owner';
    }
    
    return await checkOrganizationPermission(req, organizationId, requiredRole);
  }
  
  return NextResponse.next();
}