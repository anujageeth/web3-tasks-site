import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const state = url.searchParams.get('state');
    
    if (!state) {
      return NextResponse.json({ message: 'Missing state parameter' }, { status: 400 });
    }

    // Get Telegram Bot token from env variables
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
      console.error('Telegram Bot Token not configured');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }
    
    // Generate the Telegram auth URL with state
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const callbackUrl = `${frontendUrl}/api/telegram/callback`;
    
    // We'll create this URL to forward to our backend, which will generate the actual Telegram login link
    const telegramAuthUrl = `${backendUrl}/api/telegram/auth?state=${state}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    // Forward to backend with cookie
    const response = await fetch(telegramAuthUrl, {
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });

    // Get the URL from backend response
    if (!response.ok) {
      console.error('Failed to get Telegram auth URL from backend');
      return NextResponse.json({ message: 'Failed to initialize Telegram login' }, { status: response.status });
    }
    
    const { url: loginUrl } = await response.json();
    
    // Redirect to Telegram login URL
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}