import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:5008'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const backendResponse = await fetch(`${backendUrl}/api/guests/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return new NextResponse(errorText, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error proxying guest import request:', error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
