import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutPageContent } from "@/features/about-page/components/AboutPageContent";
import { aboutPageServerService } from "@/features/about-page/server-services";
import { mergeAboutPageSettings } from "@/features/about-page/types";
import { buildSeoMetadata, getSiteName } from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, origin, about] = await Promise.all([
    getTenantSeoContext(),
    getRequestOrigin(),
    aboutPageServerService.getPublicAbout(),
  ]);
  const content = mergeAboutPageSettings(about);

  return buildSeoMetadata(
    {
      title: { absolute: `${content.hero.title} ${content.hero.accent} — ${getSiteName(tenant)}` },
      description: content.hero.description,
      canonical: canonicalUrl(origin, "/about"),
      noindex: !content.enabled,
    },
    tenant,
    origin,
  );
}

export default async function AboutPage() {
  const about = await aboutPageServerService.getPublicAbout();
  const content = mergeAboutPageSettings(about);

  if (!content.enabled) notFound();

  return <AboutPageContent content={content} />;
}
