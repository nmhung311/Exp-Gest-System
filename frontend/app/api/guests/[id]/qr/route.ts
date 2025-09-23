import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://192.168.1.135:5008'

// Required for static export
export async function generateStaticParams() {
  return []
}

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
