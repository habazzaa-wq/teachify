import { NextResponse } from "next/server";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { getRequestOrigin } from "@/lib/seo/url";
import { buildManifest, manifestResponseHeaders } from "@/lib/pwa/manifest";

/**
 * Tenant-aware web manifest.
 *
 * This is implemented as a route handler (rather than the native `app/manifest.ts`
 * metadata file) because Next.js 16's native manifest route hardcodes
 * `Cache-Control: public, max-age=0, must-revalidate` and never emits `no-store`.
 * The manifest is host/tenant dependent and must never be publicly cached, so we
 * serve it here with an explicit `Cache-Control: no-store`.
 *
 * Tenant resolution reuses the repository's existing `getTenantSeoContext()`, so
 * the manifest resolves exactly the same tenant as the rendered site. Because the
 * route lies outside the proxy matcher it reads the request host directly, exactly
 * like the other metadata routes (robots/sitemap).
 */

// Always render per request — the manifest is tenant/host-dependent, never static.
export const dynamic = "force-dynamic";

export async function GET() {
  const [tenant, origin] = await Promise.all([getTenantSeoContext(), getRequestOrigin()]);
  const manifest = buildManifest({ tenant, origin });

  return new NextResponse(JSON.stringify(manifest), {
    headers: manifestResponseHeaders(),
  });
}
