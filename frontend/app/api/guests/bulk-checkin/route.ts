import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://192.168.1.135:5008'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get event_id from localStorage or request
    const eventId = body.event_id || null
    
    const requestBody = {
      ...body,
      event_id: eventId
    }
    
    console.log('Bulk checkin request:', requestBody)
    console.log('Backend URL:', `${backendUrl}/api/guests/bulk-checkin`)
    
    const response = await fetch(`${backendUrl}/api/guests/bulk-checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend bulk checkin error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        url: `${backendUrl}/api/guests/bulk-checkin`
      })
      return NextResponse.json(
        { 
          error: 'Failed to bulk checkin',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Bulk checkin API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        backendUrl
      },
      { status: 500 }
    )
  }
}
