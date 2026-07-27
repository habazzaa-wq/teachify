"use client";

import { HeroSection } from "@/components/home/HeroSection";
import { WhyChooseUsOrbit } from "@/components/home/WhyChooseUsOrbit";
import { EducationalStagesSection } from "@/components/home/EducationalStagesSection";
import { CoursesSection } from "@/components/home/CoursesSection";

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
