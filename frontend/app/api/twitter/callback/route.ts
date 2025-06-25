import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    // Get tokens from Twitter oauth callback
    const searchParams = request.nextUrl.searchParams;
    const oauth_token = searchParams.get('oauth_token');
    const oauth_verifier = searchParams.get('oauth_verifier');
    
    if (!oauth_token || !oauth_verifier) {
      // Redirect to profile with error
      return redirect(`/profile?error=${encodeURIComponent('Twitter authentication failed: Missing oauth parameters')}`);
    }
    
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return redirect('/login');
    }
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(
      `${backendUrl}/api/twitter/callback?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`,
      {
        method: 'GET',
        headers: {
          'Cookie': `token=${token}`
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twitter callback error:', errorData);
      return redirect(`/profile?error=${encodeURIComponent(errorData.message || 'Twitter authentication failed')}`);
    }
    
    const data = await response.json();
    
    // Redirect back to profile with success message
    return redirect(`/profile?success=${encodeURIComponent(`Successfully connected Twitter as @${data.username}`)}`);
  } catch (error: any) {
    console.error('Twitter callback error:', error);
    return redirect(`/profile?error=${encodeURIComponent(`Twitter authentication failed: ${error.message}`)}`);
  }
}