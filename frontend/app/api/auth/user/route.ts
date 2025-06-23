import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    console.log('Token found in cookies:', !!token);

    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Forward to backend with cookie
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    console.log(`Fetching user from: ${backendUrl}/api/auth/user`);

    const response = await fetch(`${backendUrl}/api/auth/user`, {
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });

    console.log('User fetch response status:', response.status);

    if (!response.ok) {
      console.error('Failed to get user data from backend');
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}