import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Try multiple backend URLs
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 
                     process.env.BACKEND_URL || 
                     'http://192.168.1.135:5008';
  
  try {
    // Forward authentication headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['authorization'] = authHeader
    }
    
    // Extract query parameters from request URL
    const url = new URL(request.url)
    const queryParams = url.searchParams.toString()
    const backendUrlWithParams = queryParams 
      ? `${backendUrl}/api/guests?${queryParams}`
      : `${backendUrl}/api/guests`
    
    console.log('[Next.js API] Proxying GET /api/guests')
    console.log('[Next.js API] Backend URL:', backendUrlWithParams)
    console.log('[Next.js API] Query params:', queryParams)
    console.log('[Next.js API] Environment:', {
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      BACKEND_URL: process.env.BACKEND_URL
    })
    
    const response = await fetch(backendUrlWithParams, {
      method: 'GET',
      headers,
    });

    console.log('[Next.js API] Backend response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Next.js API] Backend error:', response.status, errorText)
      return NextResponse.json({ 
        error: `Backend error: ${response.status}`,
        message: errorText,
        backendUrl: backendUrlWithParams
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('[Next.js API] Backend returned', data.guests?.length || 0, 'guests')
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Next.js API] Proxy error:', error.message)
    console.error('[Next.js API] Error stack:', error.stack)
    return NextResponse.json({ 
      message: `Proxy guests error: ${error.message}`,
      backendUrl: backendUrl,
      error: error.toString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://backend:5008';
  const body = await request.json();

  try {
    // Forward authentication headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['authorization'] = authHeader
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
