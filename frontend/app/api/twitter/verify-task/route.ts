import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    const body = await request.json();
    const { taskId, taskType, linkUrl } = body;
    
    if (!taskId || !taskType || !linkUrl) {
      return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }
    
    // Forward to backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/twitter/verify-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({ taskId, taskType, linkUrl }),
      credentials: 'include'
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Twitter verification error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}