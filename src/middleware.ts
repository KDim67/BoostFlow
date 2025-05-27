import { NextRequest, NextResponse } from 'next/server';
import { organizationAuthMiddleware } from './middleware/organizationAuth';

export function middleware(request: NextRequest) {
  return organizationAuthMiddleware(request);
}

export const config = {
  matcher: [
    // '/organizations/:path*',
  ],
};
