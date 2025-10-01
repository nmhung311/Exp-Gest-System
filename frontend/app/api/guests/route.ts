import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic'





export async function GET(request: Request) {
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://apievent.expsolution.io' 
    : (process.env.INTERNAL_API_BASE_URL || 'http://localhost:5008');
  
  try {
    // Forward authentication headers and cookies
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['authorization'] = authHeader
    }
    if (cookieHeader) {
      headers['cookie'] = cookieHeader
    }
    
    const response = await fetch(`${backendUrl}/api/guests`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ message: `Proxy guests error: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://apievent.expsolution.io' 
    : (process.env.INTERNAL_API_BASE_URL || 'http://localhost:5008');
  const body = await request.json();

  try {
    // Forward authentication headers and cookies
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['authorization'] = authHeader
    }
    if (cookieHeader) {
      headers['cookie'] = cookieHeader
    }
    
    const response = await fetch(`${backendUrl}/api/guests`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ message: `Proxy guests POST error: ${error.message}` }, { status: 500 });
  }
}
