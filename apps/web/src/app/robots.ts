import type { MetadataRoute } from "next";
import { getRequestOrigin } from "@/lib/seo/url";

/**
 * Tenant-aware robots.txt. Private/authenticated areas are additionally
 * marked `noindex` via page/layout metadata (the reliable signal for Google);
 * these disallow rules are a secondary layer and never block CSS/JS/assets.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getRequestOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/teacher/",
        "/student/",
        "/community/",
        "/superadmin/",
        "/tenant-not-found",
        "/exam-sessions/",
        "/exam-results/",
        "/wallet/",
        "/api/",
        "/sanctum/",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
