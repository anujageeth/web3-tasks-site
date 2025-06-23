import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Forward to backend
    await fetch(`${process.env.BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
    });

    // Create response and clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('token');
    
    return response;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}