import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:5008'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendResponse = await fetch(`${backendUrl}/api/checkin`, {
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
    console.error('Error proxying checkin request:', error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const backendUrlWithQuery = queryString ? `${backendUrl}/api/checkin?${queryString}` : `${backendUrl}/api/checkin`
    
    const backendResponse = await fetch(backendUrlWithQuery, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return new NextResponse(errorText, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error proxying checkin GET request:', error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const backendResponse = await fetch(`${backendUrl}/api/checkin`, {
      method: 'PUT',
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
    console.error('Error proxying checkin update request:', error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
