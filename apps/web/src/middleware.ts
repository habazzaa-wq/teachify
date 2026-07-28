import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveApiUrl } from "@/config/env";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test";

const CACHE_TTL = 300_000; // 5 minutes for successful lookups
const NEGATIVE_CACHE_TTL = 10_000; // 10 seconds for failed lookups (API down / 404)
const domainCache = new Map<string, { data: any; timestamp: number }>();

async function getTenantData(hostname: string, requestUrl: URL): Promise<any | null> {
  const cached = domainCache.get(hostname);
  if (cached) {
    const ttl = cached.data ? CACHE_TTL : NEGATIVE_CACHE_TTL;
    if (Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  try {
    const url = `${resolveApiUrl(requestUrl)}/api/v1/tenant/by-domain?domain=${encodeURIComponent(hostname)}`;
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(5000),
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.error(`Middleware tenant lookup for ${hostname} returned HTTP ${res.status}`);
      domainCache.set(hostname, { data: null, timestamp: Date.now() });
      return null;
    }
    
    const data = await res.json();
    domainCache.set(hostname, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.error(`Middleware tenant lookup failed for ${hostname}:`, err);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const pathname = request.nextUrl.pathname;

  // 1. Skip if it's a platform internal route or static asset
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/tenant-not-found"
  ) {
    return NextResponse.next();
  }

  // 2. Identify if it's a platform domain
  const isPlatform = 
    hostname === BASE_DOMAIN || 
    hostname === `www.${BASE_DOMAIN}` ||
    hostname === `api.${BASE_DOMAIN}` || 
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-hostname", hostname);

  if (isPlatform) {
    // If it's the root of the platform, redirect to superadmin dashboard
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/superadmin/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 3. Resolve Tenant
  const tenantData = await getTenantData(hostname, request.nextUrl);

  if (!tenantData || tenantData.status !== "active") {
    const url = request.nextUrl.clone();
    url.pathname = "/tenant-not-found";
    return NextResponse.rewrite(url);
  }

  // 4. Inject Tenant Context
  requestHeaders.set("x-tenant-id", tenantData.id.toString());
  requestHeaders.set("x-tenant-slug", tenantData.slug);
  requestHeaders.set("x-tenant-domain", hostname);
  requestHeaders.set("x-tenant-context", Buffer.from(JSON.stringify(tenantData)).toString("base64"));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
