import { NextRequest, NextResponse } from "next/server";

const INTERNAL_API_BASE = process.env.INTERNAL_API_URL ?? "http://127.0.0.1";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  try {
    const url = `${INTERNAL_API_BASE}/api/v1/tenant/by-domain?domain=${encodeURIComponent(domain)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[internal/resolve-tenant] fetch failed:", err);
    return NextResponse.json({ error: "Internal lookup failed" }, { status: 502 });
  }
}
