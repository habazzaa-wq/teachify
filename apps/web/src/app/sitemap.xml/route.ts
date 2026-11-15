import { NextResponse } from "next/server";
import { catalogServerService } from "@/features/course-catalog/server-services";
import { buildSitemapIndexXml, courseSitemapPath, sitemapXmlHeaders, SITEMAP_COURSES_PER_PAGE } from "@/lib/seo/sitemap";
import { getRequestOrigin } from "@/lib/seo/url";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { blogServerService } from "@/features/blog/server-service";

export const dynamic = "force-dynamic";

/**
 * Tenant-aware sitemap index (`/sitemap.xml`).
 *
 * Points to `/sitemap-core.xml` (home, catalog, stages) plus paginated
 * `/sitemap-courses/{n}` and `/sitemap-blog/{n}` chunks. The chunk counts come
 * from the real `last_page` of the public catalog API, so the index stays in
 * sync automatically when courses are added, unpublished, or removed — no
 * manual edits. Every child URL is built from the current request origin, so
 * Tenant A's sitemap can never list Tenant B's URLs.
 *
 * Tenants that disable the "include default pages" sitemap setting drop the
 * `/sitemap-core.xml` entry from the index (tenant course chunks remain).
 */
export async function GET() {
  const [origin, tenant] = await Promise.all([getRequestOrigin(), getTenantSeoContext()]);

  const includeDefault = tenant?.seo?.sitemapIncludeDefault !== false;
  const locations: string[] = includeDefault ? [`${origin}/sitemap-core.xml`] : [];

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

  if (includeDefault && tenant?.feature_flags?.has_blog) {
    try {
      const firstPage = await blogServerService.page(1);
      for (let page = 1; page <= (firstPage?.meta.last_page ?? 0); page += 1) {
        locations.push(`${origin}/sitemap-blog/${page}`);
      }
    } catch {
      // The core sitemap remains available if the blog API cannot be reached.
    }
  }

  return new NextResponse(buildSitemapIndexXml(locations), {
    headers: sitemapXmlHeaders(),
  });
}
