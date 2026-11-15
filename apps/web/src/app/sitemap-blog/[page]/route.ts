import { NextResponse } from "next/server";
import { blogServerService } from "@/features/blog/server-service";
import { buildUrlsetXml, publicEntry, sitemapXmlHeaders } from "@/lib/seo/sitemap";
import { getRequestOrigin } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> },
) {
  const { page: pageValue } = await params;
  const page = Number(pageValue);
  if (!Number.isSafeInteger(page) || page < 1) {
    return NextResponse.json({ message: "Invalid sitemap page." }, { status: 404 });
  }

  const [origin, result] = await Promise.all([
    getRequestOrigin(),
    blogServerService.page(page),
  ]);
  const entries = (result?.data ?? []).map((post) => publicEntry(origin, `/blog/${post.slug}`, {
    lastModified: post.updated_at ?? post.published_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return new NextResponse(buildUrlsetXml(entries), { headers: sitemapXmlHeaders() });
}
