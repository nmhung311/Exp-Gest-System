import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get('limit') ?? '50'
  const offset = searchParams.get('offset') ?? '0'
  const auth = req.headers.get('authorization') || ''
  const base = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'
  const url = `${base}/api/events?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`

  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000)
  
  try {
    const r = await fetch(url, {
      headers: { authorization: auth },
      signal: ctrl.signal,
      cache: 'no-store',
    })
    
    const body = await r.text()
    
    if (!r.ok) {
      console.error('[proxy] /events upstream', r.status, body?.slice(0,500))
      return NextResponse.json({ message: 'Upstream error', status: r.status }, { status: 502 })
    }
    
    return new NextResponse(body, {
      headers: { 'content-type': r.headers.get('content-type') || 'application/json' }
    })
  } catch (e: any) {
    console.error('[proxy] /events fetch failed:', e?.message || e)
    return NextResponse.json({ message: 'Proxy events error: fetch failed' }, { status: 500 })
  } finally { 
    clearTimeout(id) 
  }
}