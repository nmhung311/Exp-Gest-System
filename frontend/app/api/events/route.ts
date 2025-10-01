import { NextRequest, NextResponse } from 'next/server'
import { fetchWithFallback, toListShape } from '../_lib/proxy'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get('limit') ?? '50'
  const offset = searchParams.get('offset') ?? '0'
  const auth = req.headers.get('authorization') || ''
  const base = process.env.INTERNAL_API_BASE_URL || 'http://localhost:5008'
  const qs = `?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
  const paths = [`/api/events${qs}`, `/events${qs}`]

  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000)
  
  try {
    const r = await fetchWithFallback(base, paths, {
      headers: { authorization: auth },
      signal: ctrl.signal,
      cache: 'no-store',
    })
    
    console.info('[proxy] /api/events ->', r.url, r.status)
    
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

export async function POST(req: NextRequest) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000)
  
  try {
    const body = await req.json()
    const auth = req.headers.get('authorization') || ''
    const base = process.env.INTERNAL_API_BASE_URL || 'http://localhost:5008'
    const paths = ['/api/events', '/events']

    const r = await fetchWithFallback(base, paths, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        authorization: auth 
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    
    console.info('[proxy] POST /api/events ->', r.url, r.status)
    
    if (!r.ok) {
      return NextResponse.json({ error: 'upstream_error', upstreamStatus: r.status, data: r.data }, { status: r.status })
    }
    
    return NextResponse.json(r.data, { status: r.status })
  } catch (e: any) {
    console.error('[proxy] POST /api/events failed:', e?.message || e)
    return NextResponse.json({ error: 'proxy_fetch_failed', detail: e?.message || String(e) }, { status: 500 })
  } finally { 
    clearTimeout(id) 
  }
}