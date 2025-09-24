import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:5008'

// Removed generateStaticParams to make this a dynamic API route

// GET method removed because backend doesn't support GET /api/guests/{id}
// Use GET /api/guests instead and filter by ID on the frontend

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const body = await request.json()
    const backendResponse = await fetch(`${backendUrl}/api/guests/${id}`, {
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
    console.error('Error proxying guest update request:', error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  console.log('🔍 Frontend API DELETE request for guest ID:', id)
  console.log('🌐 Backend URL:', backendUrl)
  console.log('🔗 Full URL:', `${backendUrl}/api/guests/${id}`)
  
  try {
    const backendResponse = await fetch(`${backendUrl}/api/guests/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('📡 Backend response status:', backendResponse.status)
    console.log('📡 Backend response ok:', backendResponse.ok)
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('❌ Backend error response:', errorText)
      return new NextResponse(errorText, { status: backendResponse.status })
    }

    const data = await backendResponse.json()
    console.log('✅ Backend success response:', data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('💥 Frontend API route error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
