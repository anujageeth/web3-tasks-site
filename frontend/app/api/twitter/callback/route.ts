import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Get query params from URL
    const url = new URL(request.url);
    const oauth_token = url.searchParams.get('oauth_token');
    const oauth_verifier = url.searchParams.get('oauth_verifier');
    
    if (!oauth_token || !oauth_verifier) {
      return NextResponse.redirect(new URL('/profile?error=Twitter authentication failed', request.url));
    }
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(
      `${backendUrl}/api/twitter/callback?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`,
      {
        headers: {
          'Cookie': `token=${token}`
        },
        credentials: 'include'
      }
    );
    
    // Redirect to profile page regardless of result
    const redirectUrl = new URL('/profile', request.url);
    
    if (!response.ok) {
      // Add error parameter if something went wrong
      redirectUrl.searchParams.set('error', 'Twitter connection failed');
    } else {
      redirectUrl.searchParams.set('success', 'Twitter account connected successfully');
    }
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Twitter callback error:', error);
    return NextResponse.redirect(new URL('/profile?error=Server error', request.url));
  }
}