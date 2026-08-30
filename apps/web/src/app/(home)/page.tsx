import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { HeroSection } from "@/components/home/HeroSection";
import { LazyMount } from "@/components/home/LazyMount";
import { JsonLd } from "@/components/seo/JsonLd";
import { heroKeys } from "@/features/homepage/hero/query-keys";
import { heroServerService } from "@/features/homepage/hero/server-services";
import { whyChooseUsKeys } from "@/features/homepage/why-choose-us/keys";
import { whyChooseUsServerService } from "@/features/homepage/why-choose-us/server-services";
import { stagesKeys } from "@/features/homepage/educational-stages/keys";
import { stagesServerService } from "@/features/homepage/educational-stages/server-services";
import { communitySectionKeys } from "@/features/homepage/community/keys";
import { communitySectionServerService } from "@/features/homepage/community/server-services";
import { getQueryClient } from "@/lib/get-query-client";
import { routes } from "@/constants/routes";
import {
  buildSeoMetadata,
  getHomepageDescription,
  getHomepageTitle,
  getSiteName,
} from "@/lib/seo/metadata";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/jsonld";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";

const WhyChooseUsOrbit = dynamic(
  () => import("@/components/home/WhyChooseUsOrbit").then((m) => m.WhyChooseUsOrbit),
  { ssr: true }
);

const FeaturedStagesSection = dynamic(
  () => import("@/components/home/featured-stages/FeaturedStagesSection").then((m) => m.FeaturedStagesSection),
  { ssr: true }
);

const PublicCommunitySection = dynamic(
  () => import("@/features/homepage/community/components/PublicCommunitySection").then((m) => m.PublicCommunitySection),
  { ssr: true }
);

function SectionFallback({ className }: { className?: string }) {
  return (
    <section className={`relative w-full overflow-hidden py-12 sm:py-16 lg:py-24 ${className ?? ""}`} dir="rtl">
      <div className="mx-auto flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/40" />
      </div>
    </section>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, origin, hero] = await Promise.all([
    getTenantSeoContext(),
    getRequestOrigin(),
    heroServerService.getPublicHero(),
  ]);

  const siteName = getSiteName(tenant);
  const homepageTitle = getHomepageTitle(tenant);
  const homepageDescription = getHomepageDescription(tenant);
  const description =
    homepageDescription ||
    hero?.subtitle?.trim() ||
    `استكشف ${siteName} — دورات تعليمية ومناهج شرح للمراحل الدراسية المختلفة عبر الإنترنت`;

  return buildSeoMetadata(
    {
      title: { absolute: homepageTitle || siteName },
      description,
      canonical: canonicalUrl(origin, routes.home),
      ogImage: hero?.teacherImage || null,
      ogImageAlt: hero?.teacherName || siteName,
    },
    tenant,
    origin,
  );
}

async function HomePage() {
  const queryClient = getQueryClient();

  const [hero, whyChooseUs, stages, communitySection, tenant, origin] = await Promise.all([
    heroServerService.getPublicHero(),
    whyChooseUsServerService.getPublicWhyChooseUs(),
    stagesServerService.getPublicStages(),
    communitySectionServerService.getPublicCommunitySection(),
    getTenantSeoContext(),
    getRequestOrigin(),
  ]);

  if (hero) {
    queryClient.setQueryData(heroKeys.public, hero);
  }
  if (whyChooseUs) {
    queryClient.setQueryData(whyChooseUsKeys.public, whyChooseUs);
  }
  if (stages) {
    queryClient.setQueryData(stagesKeys.public, stages);
  }
  queryClient.setQueryData(communitySectionKeys.public, communitySection);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd data={organizationJsonLd(tenant, origin)} />
      <JsonLd data={webSiteJsonLd(tenant, origin)} />
      <HeroSection />
      <LazyMount minHeight="520px">
        <Suspense fallback={<SectionFallback />}>
          <WhyChooseUsOrbit />
        </Suspense>
      </LazyMount>
      <LazyMount minHeight="720px">
        <Suspense fallback={<SectionFallback />}>
          <FeaturedStagesSection />
        </Suspense>
      </LazyMount>
      <LazyMount minHeight="520px">
        <Suspense fallback={<SectionFallback />}>
          <PublicCommunitySection />
        </Suspense>
      </LazyMount>
    </HydrationBoundary>
  );
}

export default HomePage;
