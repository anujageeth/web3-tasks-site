import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://cryptoken-tasks-backend-335e4e542fb7.herokuapp.com';
    const body = await request.json();
    
    console.log('Forwarding verify request to:', `${backendUrl}/api/auth/verify`);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    console.log('Backend response status:', response.status);
    
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Verification failed' },
        { status: response.status }
      );
    }

    // Forward the Set-Cookie header if present
    const setCookie = response.headers.get('Set-Cookie');
    const nextResponse = NextResponse.json(data);
    
    if (setCookie) {
      nextResponse.headers.set('Set-Cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Error forwarding auth verify request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}