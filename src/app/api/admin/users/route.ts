import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/services/platform/platformAdminService';

export async function GET(request: NextRequest) {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}