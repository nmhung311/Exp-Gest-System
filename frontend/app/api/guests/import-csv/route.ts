import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://192.168.1.135:5008'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const backendResponse = await fetch(`${backendUrl}/api/guests/import-csv`, {
      method: 'POST',
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
