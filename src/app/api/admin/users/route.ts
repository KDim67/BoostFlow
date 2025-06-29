import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/services/platform/platformAdminService';

/**
 * Admin API endpoint to retrieve all users in the platform
 * GET /api/admin/users
 * 
 * @param request - Next.js request object (unused but required by API route signature)
 * @returns JSON response containing array of users or error message
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all users from the platform admin service
    const users = await getAllUsers();
    
    // Return successful response with users data
    return NextResponse.json({ users });
  } catch (error) {
    // Log error for debugging purposes
    console.error('Error fetching users:', error);
    
    // Return error response with 500 status code
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}