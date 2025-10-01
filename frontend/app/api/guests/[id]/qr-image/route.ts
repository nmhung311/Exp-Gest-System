import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.INTERNAL_API_BASE_URL || 'https://apievent.expsolution.io'

// Removed generateStaticParams to make this a dynamic API route

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params
    const auth = request.headers.get('authorization') || ''
    
    console.log(`Getting QR image for guest ${guestId}`)
    
    const response = await fetch(`${backendUrl}/api/guests/${guestId}/qr-image`, {
      method: 'GET',
      headers: {
        ...(auth && { authorization: auth }),
      },
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
