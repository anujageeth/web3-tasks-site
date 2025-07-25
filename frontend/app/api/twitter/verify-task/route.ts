import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get task data from request
    const taskData = await request.json();
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/twitter/verify-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify(taskData),
      credentials: 'include'
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to verify task';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      return NextResponse.json({ message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Twitter verify-task API error:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}