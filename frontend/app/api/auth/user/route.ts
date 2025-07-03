import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://cryptoken-tasks-backend-335e4e542fb7.herokuapp.com';
    
    console.log('Forwarding request to:', `${backendUrl}/api/auth/user`);
    console.log('Request cookies:', request.headers.get('cookie'));
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    console.log('Backend response status:', response.status);
    
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Authentication failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding auth user request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}