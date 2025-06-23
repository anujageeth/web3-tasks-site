import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, message, signature } = body;

    if (!address || !message || !signature) {
      return NextResponse.json(
        { success: false, message: 'Missing parameters' },
        { status: 400 }
      );
    }

    // Make sure we're using the correct backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    console.log(`Sending verification request to: ${backendUrl}/api/auth/verify`);
    
    // Forward to backend
    const response = await fetch(`${backendUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        address, 
        message, 
        signature: signature.toString() // Ensure signature is a string
      }),
      credentials: 'include',
    });

    // Log response status for debugging
    console.log(`Backend response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = 'Backend verification failed';
      try {
        const errorData = await response.json();
        console.error('Backend error data:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        const errorText = await response.text();
        console.error('Backend error text:', errorText);
      }
      
      return NextResponse.json({ 
        success: false, 
        message: errorMessage 
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Backend success response:', data);

    // Create a new response
    const nextResponse = NextResponse.json(data);
    
    // Get Set-Cookie header (different approach than getAll)
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('Got Set-Cookie header from backend');
      
      // Parse the cookie value
      const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const tokenValue = tokenMatch[1];
        console.log('Setting token cookie in response');
        
        // Set the cookie manually with proper settings for Next.js
        nextResponse.cookies.set({
          name: 'token',
          value: tokenValue,
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      } else {
        console.warn('Could not parse token from Set-Cookie header');
      }
    } else {
      console.warn('No Set-Cookie header found in backend response');
    }

    return nextResponse;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}