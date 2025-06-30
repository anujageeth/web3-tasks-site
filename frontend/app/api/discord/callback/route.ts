import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    console.log('Discord callback received:', { code: !!code, state: !!state });
    
    if (!code || !state) {
      console.error('Missing OAuth parameters');
      return NextResponse.redirect(new URL('/profile/edit?error=Missing OAuth parameters', url.origin));
    }
    
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      console.error('No authentication token found');
      return NextResponse.redirect(new URL('/profile/edit?error=Authentication required', url.origin));
    }
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/discord/callback?code=${code}&state=${state}`, {
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Backend Discord callback error:', error);
      return NextResponse.redirect(new URL(`/profile/edit?error=${encodeURIComponent(error.message || 'Discord connection failed')}`, url.origin));
    }
    
    const data = await response.json();
    console.log('Discord connection successful:', data);
    
    // Redirect back to profile edit page with success message
    return NextResponse.redirect(new URL('/profile/edit?success=Discord connected successfully', url.origin));
  } catch (error: any) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(new URL(`/profile/edit?error=${encodeURIComponent(error.message || 'Discord connection error')}`, url.origin));
  }
}