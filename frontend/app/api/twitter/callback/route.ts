import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get tokens from Twitter oauth callback
    const searchParams = request.nextUrl.searchParams;
    const oauth_token = searchParams.get('oauth_token');
    const oauth_verifier = searchParams.get('oauth_verifier');
    
    console.log('Twitter callback received:', {
      hasOauthToken: !!oauth_token,
      hasOauthVerifier: !!oauth_verifier
    });
    
    if (!oauth_token || !oauth_verifier) {
      console.error('Missing OAuth parameters');
      return NextResponse.redirect(
        new URL(`/profile?error=${encodeURIComponent('Twitter authentication failed: Missing oauth parameters')}`, 
        request.url)
      );
    }
    
    // Get user token
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    console.log('User authentication token present:', !!token);
    
    // Get the origin for forming URLs
    const origin = new URL(request.url).origin;
    
    if (!token) {
      console.warn('No authentication token found during Twitter callback');
      return NextResponse.redirect(new URL('/login', origin));
    }
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    console.log('Forwarding to backend:', `${backendUrl}/api/twitter/callback`);
    
    const response = await fetch(
      `${backendUrl}/api/twitter/callback?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`,
      {
        method: 'GET',
        headers: {
          'Cookie': `token=${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }
    );

    // Log response status
    console.log('Backend response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Twitter authentication failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('Backend error response:', errorData);
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      // Redirect with error message
      return NextResponse.redirect(
        new URL(`/profile?error=${encodeURIComponent(errorMessage)}`, origin)
      );
    }
    
    // Success case
    let username = '';
    try {
      const data = await response.json();
      username = data.username || '';
      console.log('Twitter connection successful for username:', username);
    } catch (e) {
      console.error('Could not parse success response:', e);
    }
    
    // Redirect back to profile with success message
    return NextResponse.redirect(
      new URL(`/profile?success=${encodeURIComponent(`Successfully connected Twitter${username ? ` as @${username}` : ''}`)}`, 
      origin)
    );
  } catch (error: any) {
    console.error('Twitter callback error:', error);
    // Get the origin for forming URLs
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(
      new URL(`/profile?error=${encodeURIComponent(`Twitter authentication failed: ${error.message}`)}`, 
      origin)
    );
  }
}