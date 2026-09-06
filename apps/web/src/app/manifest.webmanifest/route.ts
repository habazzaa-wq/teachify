import { buildManifestResponse } from "@/lib/pwa/manifest";

export const dynamic = "force-dynamic";

/**
 * Dynamic tenant-aware web manifest route.
 *
 * - Resolves the same tenant as the rest of the site (server-side), via the
 *   shared getTenantSeoContext().
 * - Never cached publicly: the response explicitly sets `Cache-Control:
 *   no-store`, so a shared CDN cache can never serve one tenant's manifest to
 *   another.
 * - Lives under the app directory (not /public or /_next/static) and is always
 *   generated per request based on the current host.
 */
export async function GET() {
  const { body, headers } = await buildManifestResponse();

  return new Response(JSON.stringify(body), {
    headers,
  });
}
