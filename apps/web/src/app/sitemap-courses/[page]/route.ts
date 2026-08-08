import { NextResponse } from "next/server";
import { catalogServerService } from "@/features/course-catalog/server-services";
import { buildUrlsetXml, publicEntry, sitemapXmlHeaders, SITEMAP_COURSES_PER_PAGE } from "@/lib/seo/sitemap";
import { getRequestOrigin } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ page?: string }>;
}

/**
 * One sitemap chunk of the public course catalog (`/sitemap-courses/{n}`, served
 * as `application/xml`). The catalog API only returns published, public courses,
 * so drafts, hidden courses and private URLs can never be listed here. `lastModified` uses the
 * real `publishedAt ?? createdAt`; when a course becomes non-public it drops
 * out of the next crawl automatically.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { page: rawPage } = await params;
  const page = Math.max(1, Number(rawPage) || 1);

  const origin = await getRequestOrigin();

  const courses = await catalogServerService.getCourses({}, page, SITEMAP_COURSES_PER_PAGE);
  const entries = (courses?.data ?? []).map((course) =>
    publicEntry(origin, `/courses/${course.slug}`, {
      changeFrequency: "weekly",
      priority: 0.7,
      lastModified: course.publishedAt ?? course.createdAt,
    }),
  );

  return new NextResponse(buildUrlsetXml(entries), {
    headers: sitemapXmlHeaders(),
  });
}
