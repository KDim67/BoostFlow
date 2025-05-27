import { NextRequest, NextResponse } from 'next/server';
import { hasOrganizationPermission } from '@/lib/firebase/organizationService';
import { OrganizationRole } from '@/lib/types/organization';


export async function checkOrganizationPermission(
  req: NextRequest,
  organizationId: string,
  requiredRole: OrganizationRole = 'viewer'
): Promise<NextResponse | null> {
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url));
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