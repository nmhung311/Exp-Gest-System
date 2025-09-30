import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'





const backendUrl = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'

export async function POST(request: NextRequest) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 30000) // 30 second timeout

  try {
    const formData = await request.formData()
    
    // Forward authentication headers
    const authHeader = request.headers.get('authorization')
    const headers: HeadersInit = {}
    if (authHeader) {
      headers['authorization'] = authHeader
    }
    
    const backendResponse = await fetch(`${backendUrl}/api/guests/import-csv`, {
      method: 'POST',
      headers,
      body: formData,
      signal: ctrl.signal,
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return new NextResponse(errorText, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error proxying guest CSV import request:', error)
    if (error.name === 'AbortError') {
      return NextResponse.json({ message: "CSV import request timeout" }, { status: 504 });
    }
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  } finally {
    clearTimeout(id)
  }
}
