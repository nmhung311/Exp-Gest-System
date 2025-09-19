import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://192.168.1.135:5008'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${backendUrl}/api/guests/bulk-rsvp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend bulk rsvp error:', errorText)
      return NextResponse.json(
        { error: 'Failed to bulk rsvp' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Bulk rsvp API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
