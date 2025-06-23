import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const testCookie = cookieStore.get('test-cookie')?.value;
  
  const response = NextResponse.json({
    hasCookie: !!testCookie,
    cookieValue: testCookie || 'none',
    allCookies: cookieStore.getAll().map(c => c.name)
  });
  
  // Set a test cookie
  response.cookies.set('test-cookie', 'test-value', {
    httpOnly: true,
    path: '/',
    maxAge: 3600,
    sameSite: 'lax'
  });
  
  return response;
}