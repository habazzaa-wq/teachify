import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test";

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

  if (isPlatform) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/superadmin/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
