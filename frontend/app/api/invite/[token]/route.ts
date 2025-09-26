import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://backend:5008'

// Removed generateStaticParams to make this a dynamic API route

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    
    console.log(`Loading invite data for token: ${token}`)
    
    const response = await fetch(`${backendUrl}/api/invite/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend invite API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to load invite data' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('Invite data received:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Invite API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
