import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Forward to backend with cookie
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/telegram/disconnect`, {
      method: 'POST',
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Failed to disconnect Telegram';
      try {
        const data = await response.json();
        errorMessage = data.message || errorMessage;
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      return NextResponse.json({ message: errorMessage }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}