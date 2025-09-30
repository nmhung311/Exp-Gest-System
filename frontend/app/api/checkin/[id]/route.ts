import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'

// Removed generateStaticParams to make this a dynamic API route

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000) // 15 second timeout

  try {
    const { id } = await params
    
    // Forward authentication headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (authHeader) {
      headers['authorization'] = authHeader
    }
    
    const backendResponse = await fetch(`${backendUrl}/api/checkin/${id}`, {
      method: 'DELETE',
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
    console.error('Error proxying checkin delete request:', error)
    if (error.name === 'AbortError') {
      return NextResponse.json({ message: "Check-in delete request timeout" }, { status: 504 });
    }
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  } finally {
    clearTimeout(id)
  }
}
