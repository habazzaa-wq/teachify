import { env } from "@/config/env";
import { canonicalUrl, resolveAssetUrl } from "./url";
import type { TenantSeoContext } from "./tenant-context";
import type { PublicCourse } from "@/features/public-course/types";

export type JsonLdObject = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function organizationJsonLd(
  tenant: TenantSeoContext | null,
  origin: string,
): JsonLdObject {
  const name = tenant?.name?.trim() || env.appName;
  const logo = resolveAssetUrl(tenant?.branding?.logo ?? null, origin);

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${origin}/#organization`,
    name,
    url: origin,
    ...(logo ? { logo: { "@type": "ImageObject", url: logo } } : {}),
  };
}

export function webSiteJsonLd(
  tenant: TenantSeoContext | null,
  origin: string,
): JsonLdObject {
  const name = tenant?.name?.trim() || env.appName;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/courses?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    ...(tenant ? { publisher: { "@id": `${origin}/#organization` } } : {}),
  };
}

export function courseJsonLd(
  course: PublicCourse,
  origin: string,
  providerName: string,
): JsonLdObject {
  const url = canonicalUrl(origin, `/courses/${course.slug}`);
  const image = resolveAssetUrl(course.coverImage ?? course.thumbnail, origin);

  const offers: JsonLdObject[] = [];
  if (course.pricingType === "free") {
    offers.push({
      "@type": "Offer",
      category: "free",
      price: "0",
      priceCurrency: course.currency ?? "SAR",
      availability: "https://schema.org/InStock",
      url,
    });
  } else if (typeof course.price === "number") {
    offers.push({
      "@type": "Offer",
      price: course.price.toFixed(2),
      priceCurrency: course.currency ?? "SAR",
      availability: "https://schema.org/InStock",
      url,
    });
  }

  const description =
    course.seo?.description ?? course.shortDescription ?? course.description ?? null;

  const audience =
    course.targetAudience.length > 0
      ? {
          "@type": "EducationalAudience",
          educationalRole: "student",
          audienceType: course.targetAudience.join("، "),
        }
      : null;

  const timeRequired =
    typeof course.duration === "number" && course.duration > 0
      ? `PT${course.duration}M`
      : null;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    url,
    inLanguage: course.language || "ar",
    provider: {
      "@type": "Organization",
      name: providerName,
      url: origin,
    },
    ...(course.educationalStage ? { educationalLevel: course.educationalStage.name } : {}),
    ...(course.subject ? { teaches: course.subject.name } : {}),
    ...(course.requirements.length ? { coursePrerequisites: course.requirements.join("، ") } : {}),
    ...(audience ? { audience } : {}),
    ...(timeRequired ? { timeRequired } : {}),
    ...(offers.length ? { offers } : {}),
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
