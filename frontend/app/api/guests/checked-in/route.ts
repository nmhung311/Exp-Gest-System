import { NextResponse } from 'next/server'
import { fetchWithFallback, toListShape } from '../../_lib/proxy'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const { searchParams } = new URL(req.url)
  const base = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'
  const eventId = searchParams.get('event_id')
  const limit = searchParams.get('limit') ?? '100'

  if (!eventId) {
    return NextResponse.json({ items: [], meta: {}, error: 'missing_event_id' }, { status: 200 })
  }

  const qs = `?event_id=${encodeURIComponent(eventId)}&limit=${encodeURIComponent(limit)}`
  const paths = [`/api/guests/checked-in${qs}`, `/guests/checked-in${qs}`]

  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000)
  
  try {
    const r = await fetchWithFallback(base, paths, {
      headers: { authorization: auth },
      signal: ctrl.signal,
      cache: 'no-store',
    })
    
    console.info('[proxy] /api/guests/checked-in ->', r.url, r.status)
    
    if (!r.ok) {
      return NextResponse.json({ items: [], meta: {}, error: 'upstream_error', upstreamStatus: r.status, data: r.data }, { status: 200 })
    }
    
    const { items, meta } = toListShape(r.data)
    return NextResponse.json({ items, meta }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ items: [], meta: {}, error: 'proxy_fetch_failed', detail: e?.message || String(e) }, { status: 200 })
  } finally { 
    clearTimeout(id) 
  }
}