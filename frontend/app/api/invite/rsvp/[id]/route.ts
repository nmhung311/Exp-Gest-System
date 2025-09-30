import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(`${backendUrl}/api/invite/rsvp/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'Failed to get RSVP data' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('RSVP GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const response = await fetch(`${backendUrl}/api/invite/rsvp/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'Failed to submit RSVP' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('RSVP POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log(`Updating RSVP for guest ${id}:`, body)
    
    const response = await fetch(`${backendUrl}/api/invite/rsvp/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend RSVP PUT error:', errorText)
      return NextResponse.json(
        { error: 'Failed to update RSVP status' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('RSVP update successful:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('RSVP PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}