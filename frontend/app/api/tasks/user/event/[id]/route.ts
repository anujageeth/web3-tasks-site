import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const eventId = params.id;
    
    // Forward to backend with cookie
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/tasks/user/event/${eventId}`, {
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to get user tasks' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}