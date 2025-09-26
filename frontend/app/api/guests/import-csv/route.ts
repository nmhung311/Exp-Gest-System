import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://backend:5008'

export async function POST(request: NextRequest) {
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
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return new NextResponse(errorText, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error proxying guest CSV import request:', error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
