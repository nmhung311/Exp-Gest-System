import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.INTERNAL_API_BASE_URL || 'https://apievent.expsolution.io'

export async function POST(req: NextRequest) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), 30000) // 30 second timeout

  try {
    const body = await req.text();
    
    // Forward authentication headers
    const authHeader = req.headers.get('authorization')
    const headers: HeadersInit = {
      "content-type": "application/json",
    };
    
    if (authHeader) {
      headers['authorization'] = authHeader
    }

    console.log("📤 Proxying import request to backend");
    
    const res = await fetch(`${backendUrl}/api/guests/import`, {
      method: "POST",
      headers,
      body,
      signal: ctrl.signal,
    });

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (e: any) {
    console.error("Import route error:", e);
    if (e.name === 'AbortError') {
      return NextResponse.json({ message: "Import request timeout" }, { status: 504 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    clearTimeout(id)
  }
}
