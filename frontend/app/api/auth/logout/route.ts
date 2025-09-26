import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://backend:5008'

export async function POST(request: NextRequest) {
  try {
    // Forward cookies for logout
    const cookieHeader = request.headers.get('cookie')
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (cookieHeader) {
      headers['cookie'] = cookieHeader
    }

    const response = await fetch(`${backendUrl}/api/auth/logout`, {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new NextResponse(errorText, { status: response.status })
    }

    const data = await response.json()
    
    // Set the response and clear the refresh token cookie
    const response_data = NextResponse.json(data)
    
    // Forward the cookie clearing from backend
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      response_data.headers.set('set-cookie', setCookieHeader)
    }
    
    return response_data
  } catch (error: any) {
    console.error('Error proxying auth logout request:', error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
