"use client";

import dynamic from "next/dynamic";
import { HeroSection } from "@/components/home/HeroSection";

const WhyChooseUsOrbit = dynamic(() => import("@/components/home/WhyChooseUsOrbit").then((m) => ({ default: m.WhyChooseUsOrbit })), { ssr: false });
const EducationalStagesSection = dynamic(() => import("@/components/home/EducationalStagesSection").then((m) => ({ default: m.EducationalStagesSection })), { ssr: false });
const CoursesSection = dynamic(() => import("@/components/home/CoursesSection").then((m) => ({ default: m.CoursesSection })), { ssr: false });

function HomePage() {
  return (
    <>
      <HeroSection />
      <WhyChooseUsOrbit />
      <EducationalStagesSection />
      <CoursesSection />
    </>
  );
}

export default HomePage;
