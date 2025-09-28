import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const { pathname } = new URL(req.url)

  // Chỉ redirect đúng trang chủ của subdomain
  if (host === 'event.expsolution.io' && pathname === '/') {
    return NextResponse.redirect('https://expsolution.io/', 308)
  }

  // Mọi route khác giữ nguyên
  return NextResponse.next()
}

export const config = { 
  matcher: ['/((?!_next|static|images|favicon.ico).*)'] 
}
