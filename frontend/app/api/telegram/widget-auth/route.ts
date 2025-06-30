import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get the data from the Telegram widget
    const telegramData = await request.json();
    
    if (!telegramData || !telegramData.id) {
      return NextResponse.json({ message: 'Invalid Telegram data' }, { status: 400 });
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
      
      // Try to get more detailed error
      let errorMessage = 'Verification failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      return NextResponse.json({ 
        success: false, 
        message: errorMessage 
      }, { status: response.status });
    }

    // Success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram callback error:', error);
    return NextResponse.json({ 
      success: false,
      message: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}