import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test";

/**
 * The Teachify brand marketing website lives under the hidden `/marketing`
 * route and is served on the platform root (`/`) via an internal rewrite, so
 * the public brand site and the tenant storefront can both resolve at "/" on
 * different hosts without a route-group conflict.
 */
const MARKETING_PATH = "/marketing";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/tenant-not-found"
  ) {
    return NextResponse.next();
  }

  const isPlatform =
    hostname === BASE_DOMAIN ||
    hostname === `www.${BASE_DOMAIN}` ||
    hostname === `api.${BASE_DOMAIN}` ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-hostname", hostname);

  if (!isPlatform) {
    // Tenant host — make the resolved domain explicit for server services and
    // SEO helpers (they still fall back to the Host header if absent).
    requestHeaders.set("x-tenant-domain", hostname);
  }

  if (isPlatform) {
    if (pathname === "/") {
      // Brand marketing website on the platform root (teachify.tech).
      const url = request.nextUrl.clone();
      url.pathname = MARKETING_PATH;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Tenant hosts resolve the storefront at "/". The brand marketing site is
  // platform-only, so keep `/marketing*` from being served to tenants.
  if (pathname === MARKETING_PATH || pathname.startsWith(`${MARKETING_PATH}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
