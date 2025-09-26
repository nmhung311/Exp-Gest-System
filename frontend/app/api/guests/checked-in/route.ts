import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://backend:5008';
  
  try {
    const response = await fetch(`${backendUrl}/api/guests/checked-in`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ message: `Proxy guests checked-in error: ${error.message}` }, { status: 500 });
  }
}
