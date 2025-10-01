import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.INTERNAL_API_BASE_URL || 'https://apievent.expsolution.io'

export async function POST(request: NextRequest) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000) // 15 second timeout

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
    
    const backendResponse = await fetch(`${backendUrl}/api/checkin`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return new NextResponse(errorText, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error proxying checkin request:', error)
    if (error.name === 'AbortError') {
      return NextResponse.json({ message: "Check-in request timeout" }, { status: 504 });
    }
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  } finally {
    clearTimeout(id)
  }
}

export async function GET(request: NextRequest) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000) // 15 second timeout

  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const backendUrlWithQuery = queryString ? `${backendUrl}/api/checkin?${queryString}` : `${backendUrl}/api/checkin`
    
    // Forward authentication headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['authorization'] = authHeader
    }
    
    const backendResponse = await fetch(backendUrlWithQuery, {
      method: 'GET',
      headers,
      signal: ctrl.signal,
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return new NextResponse(errorText, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error proxying checkin GET request:', error)
    if (error.name === 'AbortError') {
      return NextResponse.json({ message: "Check-in GET request timeout" }, { status: 504 });
    }
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  } finally {
    clearTimeout(id)
  }
}

export async function PUT(request: NextRequest) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000) // 15 second timeout

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
    
    const backendResponse = await fetch(`${backendUrl}/api/checkin`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return new NextResponse(errorText, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error proxying checkin update request:', error)
    if (error.name === 'AbortError') {
      return NextResponse.json({ message: "Check-in update request timeout" }, { status: 504 });
    }
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  } finally {
    clearTimeout(id)
  }
}
