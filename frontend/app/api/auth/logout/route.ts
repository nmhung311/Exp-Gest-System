import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'





const backendUrl = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'

export async function POST(request: NextRequest) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 10000) // 10 second timeout
  
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
      signal: ctrl.signal,
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
    // Return success even if backend fails to clear cookies
    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 })
  } finally {
    clearTimeout(id)
  }
}
