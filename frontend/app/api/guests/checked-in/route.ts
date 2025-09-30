import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const { searchParams } = new URL(req.url)
  const base = process.env.INTERNAL_API_BASE_URL || 'http://event-backend:5008'
  const prefix = process.env.BACKEND_PATH_PREFIX || ''
  const eventId = searchParams.get('event_id')
  const limit = searchParams.get('limit') ?? '100'

  if (!eventId) {
    // Không 5xx để tránh CF; UI sẽ tự hiểu
    return NextResponse.json({ error: 'missing_event_id' }, { status: 200 })
  }

  const url = `${base}${prefix}/guests/checked-in?event_id=${encodeURIComponent(eventId)}&limit=${encodeURIComponent(limit)}`

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
      console.error('[proxy] /guests/checked-in upstream', r.status, text?.slice(0,500))
      return NextResponse.json({ error: 'upstream_error', upstreamStatus: r.status, data: jsonOrText }, { status: 200 })
    }
    
    return NextResponse.json(jsonOrText, { status: 200 })
  } catch (e: any) {
    console.error('[proxy] /guests/checked-in fetch failed:', e?.message || e)
    return NextResponse.json({ error: 'proxy_fetch_failed', detail: e?.message || String(e) }, { status: 200 })
  } finally { 
    clearTimeout(id) 
  }
}