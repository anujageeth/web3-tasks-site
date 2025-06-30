import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const url = new URL(request.url);
    // Get all query parameters from Telegram
    const telegramData = Object.fromEntries(url.searchParams.entries());
    
    // Extract the state parameter we set earlier
    const state = telegramData.state;
    
    if (!state) {
      console.error('Missing state parameter in callback');
      return NextResponse.redirect(new URL('/profile/edit?error=invalid_state', request.url));
    }

    // Forward to backend with cookie and Telegram data
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/telegram/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify(telegramData),
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Failed to verify Telegram data with backend');
      return NextResponse.redirect(new URL('/profile/edit?error=verification_failed', request.url));
    }

    // Success - redirect back to profile edit page
    return NextResponse.redirect(new URL('/profile/edit?connected=telegram', request.url));
  } catch (error) {
    console.error('Telegram callback error:', error);
    return NextResponse.redirect(new URL('/profile/edit?error=server_error', request.url));
  }
}