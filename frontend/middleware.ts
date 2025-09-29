import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // 🚫 CHẶN REDIRECT - Tắt hoàn toàn middleware redirects
  // Không redirect, không rewrite, không làm gì cả
  // Chỉ pass through tất cả requests
  
  return NextResponse.next()
}

export const config = { 
  matcher: ['/((?!_next|static|images|favicon.ico).*)'] 
}
