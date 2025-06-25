import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface RouteContext {
  params: Promise<{
    id: string;
  }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params; // Await the params Promise
    const cookieStore = await cookies(); // Also await cookies() in Next.js 15
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/events/${id}/join`, {
      method: 'POST',
      headers: {
        'Cookie': `token=${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to join event';
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
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}