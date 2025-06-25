import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Fix: Use the correct type pattern for Next.js 15 API routes
interface Params {
  params: {
    id: string;
  }
}

// GET handler
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/events/${id}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to get event' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// POST handler - fixed type signature
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get request data
    const requestData = await request.json();
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/events/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to update event';
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

// PUT handler
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Get request data
    const requestData = await request.json();
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to update event' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `token=${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to delete event' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}