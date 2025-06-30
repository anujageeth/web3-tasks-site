import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Forward logout request to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    
    // Get the current token to send with the logout request
    const token = request.cookies.get('token')?.value;
    
    if (token) {
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Cookie': `token=${token}`
        },
        credentials: 'include'
      });
    }
    
    // Create response
    const response = NextResponse.json({ success: true });
    
    // Clear the cookie with all possible configurations
    response.cookies.delete('token');
    response.cookies.set({
      name: 'token',
      value: '',
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    
    // Even if there's an error, clear the cookie
    const response = NextResponse.json({ success: false, message: 'Logout error' }, { status: 500 });
    response.cookies.delete('token');
    response.cookies.set({
      name: 'token',
      value: '',
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
  }
}