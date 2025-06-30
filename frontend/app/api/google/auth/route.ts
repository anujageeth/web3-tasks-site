import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the frontend URL for the proper callback
    const url = new URL(request.url);
    const origin = url.origin;
    const callbackUrl = `${origin}/api/google/callback`;
    
    console.log('Initiating Google auth with callback URL:', callbackUrl);
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    
    // Pass the callbackUrl as a query parameter
    const requestUrl = `${backendUrl}/api/google/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend Google auth error:', error);
      return NextResponse.json({ message: error.message || 'Google authentication failed' }, { status: response.status });
    }

    const data = await response.json();
    
    // Make sure we're returning the auth URL in the expected format
    if (!data.authUrl) {
      console.error('No authUrl in backend response:', data);
      return NextResponse.json({ message: 'Invalid response from Google auth service' }, { status: 500 });
    }
    
    return NextResponse.json({ authUrl: data.authUrl });
  } catch (error: any) {
    console.error('Google auth error:', error);
    return NextResponse.json({ message: `Google auth error: ${error.message}` }, { status: 500 });
  }
}