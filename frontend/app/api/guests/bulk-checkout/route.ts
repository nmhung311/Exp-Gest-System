import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://backend:5008'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward authentication headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['authorization'] = authHeader
    }
    
    const response = await fetch(`${backendUrl}/api/guests/bulk-checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend bulk checkout error:', errorText)
      return NextResponse.json(
        { error: 'Failed to bulk checkout' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Bulk checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
