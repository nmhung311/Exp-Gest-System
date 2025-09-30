import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const base = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'
  const url = `${base}/api/guests/checked-in`

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
      console.error('[proxy] /guests/checked-in upstream', r.status, body?.slice(0,500))
      return NextResponse.json({ message: 'Upstream error', status: r.status }, { status: 502 })
    }
    
    return new NextResponse(body, {
      headers: { 'content-type': r.headers.get('content-type') || 'application/json' }
    })
  } catch (e: any) {
    console.error('[proxy] /guests/checked-in fetch failed:', e?.message || e)
    return NextResponse.json({ message: 'Proxy guests checked-in error: fetch failed' }, { status: 500 })
  } finally { 
    clearTimeout(id) 
  }
}