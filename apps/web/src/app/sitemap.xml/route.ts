import { NextResponse } from "next/server";
import { catalogServerService } from "@/features/course-catalog/server-services";
import { buildSitemapIndexXml, courseSitemapPath, sitemapXmlHeaders, SITEMAP_COURSES_PER_PAGE } from "@/lib/seo/sitemap";
import { getRequestOrigin } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

/**
 * Tenant-aware sitemap index (`/sitemap.xml`).
 *
 * Points to `/sitemap-core.xml` (home, catalog, stages) plus one
 * `/sitemap-courses/{n}` chunk per catalog page. The chunk count comes
 * from the real `last_page` of the public catalog API, so the index stays in
 * sync automatically when courses are added, unpublished, or removed — no
 * manual edits. Every child URL is built from the current request origin, so
 * Tenant A's sitemap can never list Tenant B's URLs.
 */
export async function GET() {
  const origin = await getRequestOrigin();

  const locations: string[] = [`${origin}/sitemap-core.xml`];

  try {
    const firstPage = await catalogServerService.getCourses({}, 1, SITEMAP_COURSES_PER_PAGE);
    const lastPage = Math.max(0, Number(firstPage?.lastPage ?? 0));
    for (let page = 1; page <= lastPage; page += 1) {
      locations.push(`${origin}${courseSitemapPath(page)}`);
    }
  } catch {
    // No tenant context (e.g. a platform-only host) or unreachable API: serve
    // the core sitemap rather than 500-ing the whole index. Tenant domains in
    // production always resolve a tenant, so course chunks are listed there.
  }

  return new NextResponse(buildSitemapIndexXml(locations), {
    headers: sitemapXmlHeaders(),
  });
}
