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
    const callbackUrl = `${origin}/api/twitter/callback`;
    
    console.log('Initiating Twitter auth with callback URL:', callbackUrl);
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    
    // Pass the callbackUrl as a query parameter instead of in the body
    const requestUrl = `${backendUrl}/api/twitter/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend Twitter auth error:', error);
      return NextResponse.json({ message: error.message || 'Twitter authentication failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Twitter auth error:', error);
    return NextResponse.json({ message: `Twitter auth error: ${error.message}` }, { status: 500 });
  }
}