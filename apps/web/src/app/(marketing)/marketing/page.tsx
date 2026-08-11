import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getRequestOrigin, canonicalUrl } from "@/lib/seo/url";
import {
  SITE_NAME,
  SITE_NAME_AR,
  SITE_TAGLINE,
  CONTACT_EMAIL,
  DEVELOPER_WHATSAPP,
} from "@/features/marketing/data/content";
import { HeroSection } from "@/features/marketing/sections/Hero";
import { EcosystemSection } from "@/features/marketing/sections/Ecosystem";
import { WhyTeachifySection } from "@/features/marketing/sections/WhyTeachify";
import { PlatformShowcase } from "@/features/marketing/sections/PlatformShowcase";
import { ForTeachersSection } from "@/features/marketing/sections/ForTeachers";
import { StudentExperienceSection } from "@/features/marketing/sections/StudentExperience";
import { ExamsSection } from "@/features/marketing/sections/Exams";
import { CommunitySection } from "@/features/marketing/sections/Community";
import { AnalyticsSection } from "@/features/marketing/sections/Analytics";
import { SeoGrowthSection } from "@/features/marketing/sections/SeoGrowth";
import { BrandingSection } from "@/features/marketing/sections/Branding";
import { DemosSection } from "@/features/marketing/sections/Demos";
import { HowItWorksSection } from "@/features/marketing/sections/HowItWorks";
import { FeatureMatrixSection } from "@/features/marketing/sections/FeatureMatrix";
import { SocialProofSection } from "@/features/marketing/sections/SocialProof";
import { FinalCtaSection } from "@/features/marketing/sections/FinalCta";

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin();
  const url = canonicalUrl(origin, "/");

  return {
    title: `${SITE_NAME} — ${SITE_NAME_AR} | منصتك التعليمية المتكاملة`,
    description:
      "تيتشيفاي منصة تعليمية كاملة بهويتك: كورسات، امتحانات، طلاب، مدفوعات، شهادات ومجتمع — بدون أي كود، وتنطلق في أيام. احجز منصتك الآن.",
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName: SITE_NAME,
      title: `${SITE_NAME} — منصتك التعليمية بهويتك`,
      description:
        "منصة تعليمية متكاملة بهويتك: كورسات، امتحانات، مدفوعات، شهادات ومجتمع. احجز منصتك الآن وابدأ ببيئة تجريبية كاملة.",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — منصتك التعليمية بهويتك`,
      description: "منصة تعليمية متكاملة بهويتك. احجز منصتك الآن.",
    },
  };
}

export default async function MarketingHomePage() {
  const origin = await getRequestOrigin();
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: SITE_NAME,
    alternateName: SITE_NAME_AR,
    url: origin,
    description: SITE_TAGLINE,
    email: CONTACT_EMAIL,
    sameAs: [DEVELOPER_WHATSAPP],
  };

  const webSiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: SITE_NAME,
    inLanguage: "ar",
    publisher: { "@id": `${origin}/#organization` },
  };

  return (
    <>
      <JsonLd data={orgLd} />
      <JsonLd data={webSiteLd} />
      <h1 className="sr-only">
        {SITE_NAME} — {SITE_NAME_AR} — منصتك التعليمية المتكاملة بهويتك وبكل قوة
      </h1>
      <HeroSection />
      <EcosystemSection />
      <WhyTeachifySection />
      <PlatformShowcase />
      <ForTeachersSection />
      <StudentExperienceSection />
      <ExamsSection />
      <CommunitySection />
      <AnalyticsSection />
      <SeoGrowthSection />
      <BrandingSection />
      <DemosSection />
      <HowItWorksSection />
      <FeatureMatrixSection />
      <SocialProofSection />
      <FinalCtaSection />
    </>
  );
}
