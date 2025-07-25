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
    const callbackUrl = `${origin}/api/discord/callback`;
    
    console.log('Initiating Discord auth with callback URL:', callbackUrl);
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    
    // Pass the callbackUrl as a query parameter
    const requestUrl = `${backendUrl}/api/discord/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend Discord auth error:', error);
      return NextResponse.json({ message: error.message || 'Discord authentication failed' }, { status: response.status });
    }

    const data = await response.json();
    
    // Make sure we're returning the auth URL in the expected format
    if (!data.authUrl) {
      console.error('No authUrl in backend response:', data);
      return NextResponse.json({ message: 'Invalid response from Discord auth service' }, { status: 500 });
    }
    
    return NextResponse.json({ authUrl: data.authUrl });
  } catch (error: any) {
    console.error('Discord auth error:', error);
    return NextResponse.json({ message: `Discord auth error: ${error.message}` }, { status: 500 });
  }
}