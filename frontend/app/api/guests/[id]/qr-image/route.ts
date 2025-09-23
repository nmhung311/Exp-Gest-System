import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:5008'

// Required for static export
export async function generateStaticParams() {
  return []
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guestId = params.id
    
    console.log(`Getting QR image for guest ${guestId}`)
    
    const response = await fetch(`${backendUrl}/api/guests/${guestId}/qr-image`, {
      method: 'GET',
    })
    
    if (!response.ok) {
      console.error('Backend QR image API error:', response.status)
      return NextResponse.json(
        { error: 'Failed to get QR image' },
        { status: response.status }
      )
    }
    
    const imageBuffer = await response.arrayBuffer()
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename=qr_guest_${guestId}.png`,
      },
    })
  } catch (error) {
    console.error('QR image API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
