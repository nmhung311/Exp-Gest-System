import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple JWT parsing for middleware (server-side)
function parseJWT(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
    const decodedPayload = Buffer.from(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    const parsedPayload = JSON.parse(decodedPayload)
    
    return parsedPayload
  } catch (error) {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  const publicRoutes = [
    '/invite',
    '/login', 
    '/register',
    '/signup',
    '/admin',
    '/api/auth/login',
    '/api/auth/register',
    '/api/invite',
    '/_next',
    '/favicon.ico',
    '/logothiep.png'
  ]
  
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Protect admin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/(admin)')) {
    // Check if user is authenticated via refresh token cookie
    const refreshToken = request.cookies.get('refresh-token')
    
    if (!refreshToken || !refreshToken.value) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Allow access - access token will be handled by API calls
    return NextResponse.next()
  }
  
  // For all other routes, redirect to main site
  if (pathname === '/') {
    return NextResponse.redirect(new URL('https://event.expsolution.io/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
