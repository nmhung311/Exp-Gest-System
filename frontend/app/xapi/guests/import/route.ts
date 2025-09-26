import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") ||
  "http://backend:5008";

// Lấy ACCESS nếu có trong Authorization, nếu không thì xin ACCESS từ refresh cookie
async function ensureAccessAuth(req: NextRequest): Promise<string | null> {
  const h = req.headers.get("authorization");
  if (h?.toLowerCase().startsWith("bearer ")) {
    const t = h.slice(7).trim();
    try {
      const p = JSON.parse(Buffer.from(t.split(".")[1], "base64").toString());
      if (p?.typ === "access") return "Bearer " + t;   // chỉ cho ACCESS đi qua
    } catch {}
  }

  // Không có access trong header thì xin ACCESS bằng refresh cookie (httpOnly)
  const refreshRes = await fetch(`${backendUrl}/api/auth/refresh`, {
    method: "POST",
    // chuyển cookie browser sang backend
    headers: { cookie: req.headers.get("cookie") || "" },
  });
  if (!refreshRes.ok) return null;

  const data = await refreshRes.json(); // kỳ vọng { access: "<JWT>" }
  const access = data?.access || data?.access_token || data?.token;
  if (!access || access.split(".").length !== 3) return null;

  return "Bearer " + access;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await ensureAccessAuth(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.text(); // giữ nguyên payload
    const res = await fetch(`${backendUrl}/api/guests/import`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth, // CHỈ ACCESS
      },
      body,
    });

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (e) {
    console.error("Import route error:", e);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
