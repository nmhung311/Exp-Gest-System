import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get('limit') ?? '50'
  const offset = searchParams.get('offset') ?? '0'
  const auth = req.headers.get('authorization') || ''
  const base = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'
  const prefix = process.env.BACKEND_PATH_PREFIX || ''
  const url = `${base}${prefix}/events?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`

  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 15000)
  
  try {
    const r = await fetch(url, {
      headers: { authorization: auth },
      signal: ctrl.signal,
      cache: 'no-store',
    })
    
    const text = await r.text()
    const jsonOrText = (() => { try { return JSON.parse(text) } catch { return { raw: text } } })()
    
    if (!r.ok) {
      console.error('[proxy] /events upstream', r.status, text?.slice(0,500))
      // Tránh CF 5xx page: trả 200 + payload lỗi cho UI xử lý
      return NextResponse.json({ error: 'upstream_error', upstreamStatus: r.status, data: jsonOrText }, { status: 200 })
    }
    
    return NextResponse.json(jsonOrText, { status: 200 })
  } catch (e: any) {
    console.error('[proxy] /events fetch failed:', e?.message || e)
    // Tránh CF 5xx
    return NextResponse.json({ error: 'proxy_fetch_failed', detail: e?.message || String(e) }, { status: 200 })
  } finally { 
    clearTimeout(id) 
  }
}