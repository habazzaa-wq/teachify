import dynamic from "next/dynamic";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { HeroSection } from "@/components/home/HeroSection";
import { LazyMount } from "@/components/home/LazyMount";
import { heroKeys } from "@/features/homepage/hero/query-keys";
import { heroServerService } from "@/features/homepage/hero/server-services";
import { whyChooseUsKeys } from "@/features/homepage/why-choose-us/keys";
import { whyChooseUsServerService } from "@/features/homepage/why-choose-us/server-services";
import { stagesKeys } from "@/features/homepage/educational-stages/keys";
import { stagesServerService } from "@/features/homepage/educational-stages/server-services";
import { getQueryClient } from "@/lib/get-query-client";

const WhyChooseUsOrbit = dynamic(
  () => import("@/components/home/WhyChooseUsOrbit").then((m) => m.WhyChooseUsOrbit),
  { ssr: true }
);

const EducationalStagesSection = dynamic(
  () => import("@/components/home/EducationalStagesSection").then((m) => m.EducationalStagesSection),
  { ssr: true }
);

const HomeCommunitySection = dynamic(
  () => import("@/features/community/components/community-section/HomeCommunitySection").then((m) => m.HomeCommunitySection),
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

async function HomePage() {
  const queryClient = getQueryClient();

  const [hero, whyChooseUs, stages] = await Promise.all([
    heroServerService.getPublicHero(),
    whyChooseUsServerService.getPublicWhyChooseUs(),
    stagesServerService.getPublicStages(),
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HeroSection />
      <LazyMount minHeight="520px">
        <Suspense fallback={<SectionFallback />}>
          <WhyChooseUsOrbit />
        </Suspense>
      </LazyMount>
      <LazyMount minHeight="560px">
        <Suspense fallback={<SectionFallback />}>
          <EducationalStagesSection />
        </Suspense>
      </LazyMount>
      <LazyMount minHeight="520px">
        <Suspense fallback={<SectionFallback />}>
          <HomeCommunitySection />
        </Suspense>
      </LazyMount>
    </HydrationBoundary>
  );
}

export default HomePage;
