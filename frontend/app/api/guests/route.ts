import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:5008';
  
  try {
    const response = await fetch(`${backendUrl}/api/guests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ message: `Proxy guests error: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:5008';
  const body = await request.json();

  try {
    const response = await fetch(`${backendUrl}/api/guests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ message: `Proxy guests POST error: ${error.message}` }, { status: 500 });
  }
}
