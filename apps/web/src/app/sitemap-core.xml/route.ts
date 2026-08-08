import { NextResponse } from "next/server";
import { stagesServerService } from "@/features/homepage/educational-stages/server-services";
import { buildUrlsetXml, publicEntry, sitemapXmlHeaders } from "@/lib/seo/sitemap";
import { getRequestOrigin } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

/**
 * Static + stage sitemap (`/sitemap-core.xml`): homepage, course catalog and
 * every public educational stage for the current tenant. Stages are fetched
 * from the same public API the site renders, so deactivated stages disappear
 * automatically and no private data is ever listed.
 */
export async function GET() {
  const origin = await getRequestOrigin();

  const entries = [
    publicEntry(origin, "/", { changeFrequency: "daily", priority: 1 }),
    publicEntry(origin, "/courses", { changeFrequency: "daily", priority: 0.9 }),
  ];

  try {
    const stages = await stagesServerService.getPublicStages();
    for (const stage of stages?.items ?? []) {
      entries.push(
        publicEntry(origin, `/stages/${stage.id}`, {
          changeFrequency: "weekly",
          priority: 0.8,
        }),
      );
    }
  } catch {
    // No tenant context (e.g. a platform-only host) or unreachable API: the
    // sitemap still lists the always-public routes instead of 500-ing.
  }

  return new NextResponse(buildUrlsetXml(entries), {
    headers: sitemapXmlHeaders(),
  });
}
