import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") ||
  "http://backend:5008";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    // Chuyển cookies từ request sang backend
    const cookieHeader = req.headers.get("cookie");
    const headers: HeadersInit = {
      "content-type": "application/json",
    };
    
    if (cookieHeader) {
      headers["cookie"] = cookieHeader;
    }

    console.log("📤 Proxying import request to backend");
    
    const res = await fetch(`${backendUrl}/api/guests/import`, {
      method: "POST",
      headers,
      body,
    });

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (e) {
    console.error("Import route error:", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
