import dynamic from "next/dynamic";
import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";

const WhyChooseUsOrbit = dynamic(
  () => import("@/components/home/WhyChooseUsOrbit").then((m) => m.WhyChooseUsOrbit),
  { ssr: true }
);

const EducationalStagesSection = dynamic(
  () => import("@/components/home/EducationalStagesSection").then((m) => m.EducationalStagesSection),
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

function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<SectionFallback />}>
        <WhyChooseUsOrbit />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <EducationalStagesSection />
      </Suspense>
    </>
  );
}

export default HomePage;
