import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://backend:5008'

// Removed generateStaticParams to make this a dynamic API route

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guestId = params.id
    
    console.log(`Creating QR for guest ${guestId}`)
    
    const response = await fetch(`${backendUrl}/api/guests/${guestId}/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend QR API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create QR code' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('QR data received:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('QR API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
