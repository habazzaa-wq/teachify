import { describe, expect, it } from "vitest";
import type { PublicCourse } from "@/features/public-course/types";
import { breadcrumbJsonLd, courseJsonLd, organizationJsonLd, webSiteJsonLd } from "./jsonld";

function baseCourse(): PublicCourse {
  return {
    id: "1",
    tenantId: "1",
    title: "الجبر للصف الأول الثانوي",
    slug: "algebra-for-secondary",
    subtitle: null,
    shortDescription: "دورة شاملة في الجبر",
    description: null,
    fullDescription: null,
    thumbnail: null,
    coverImage: null,
    status: "published",
    visibility: "public",
    difficulty: "beginner",
    language: "ar",
    duration: 90,
    pricingType: "free",
    price: null,
    currency: "SAR",
    discountPrice: null,
    enrollmentLimit: null,
    startDate: null,
    endDate: null,
    certificateEnabled: false,
    featured: false,
    seo: { title: null, description: null, keywords: null },
    tags: [],
    requirements: [],
    learningOutcomes: [],
    targetAudience: [],
    instructor: null,
    educationalStage: { id: "3", name: "الثانوية" },
    subject: { id: "5", name: "الرياضيات" },
    category: null,
    studentsCount: 0,
    sectionsCount: 0,
    lessonsCount: 0,
    publishedAt: null,
    archivedAt: null,
    createdAt: "2026-01-01T00:00:00+00:00",
    updatedAt: "2026-01-01T00:00:00+00:00",
  };
}

describe("courseJsonLd", () => {
  const origin = "https://a.academy.test";

  it("uses only real course data (no fake ratings/reviews/students)", () => {
    const ld = courseJsonLd(baseCourse(), origin, "أكاديمية أ");
    expect(ld["@type"]).toBe("Course");
    expect(ld.aggregateRating).toBeUndefined();
    expect(ld.review).toBeUndefined();
    expect(ld.name).toBe("الجبر للصف الأول الثانوي");
  });

  it("emits truthful free offer with zero price", () => {
    const ld = courseJsonLd(baseCourse(), origin, "أكاديمية أ");
    const offers = ld.offers as Array<Record<string, unknown>>;
    expect(offers).toHaveLength(1);
    const offer = offers[0] as Record<string, unknown>;
    expect(offer.price).toBe("0");
    expect(offer.category).toBe("free");
    expect(offer.priceCurrency).toBe("SAR");
  });

  it("emits paid offer only when a real price exists", () => {
    const course: PublicCourse = { ...baseCourse(), pricingType: "one_time", price: 99.5 };
    const ld = courseJsonLd(course, origin, "أكاديمية أ");
    const offers = ld.offers as Array<Record<string, unknown>>;
    expect(offers).toHaveLength(1);
    const offer = offers[0] as Record<string, unknown>;
    expect(offer.price).toBe("99.50");
  });

  it("does not emit offers when no real price exists for a paid course", () => {
    const course: PublicCourse = { ...baseCourse(), pricingType: "one_time", price: null };
    const ld = courseJsonLd(course, origin, "أكاديمية أ");
    expect(ld.offers).toBeUndefined();
  });

  it("includes provider origin, educationalLevel, teaches and inLanguage", () => {
    const ld = courseJsonLd(baseCourse(), origin, "أكاديمية أ");
    const provider = ld.provider as Record<string, unknown>;
    expect(provider.url).toBe(origin);
    expect(provider.name).toBe("أكاديمية أ");
    expect(ld.educationalLevel).toBe("الثانوية");
    expect(ld.teaches).toBe("الرياضيات");
    expect(ld.inLanguage).toBe("ar");
  });

  it("adds audience and timeRequired only from real data", () => {
    const course = {
      ...baseCourse(),
      targetAudience: ["طلاب المرحلة الثانوية"],
    };
    const ld = courseJsonLd(course, origin, "أكاديمية أ");
    expect(ld.timeRequired).toBe("PT90M");
    expect((ld.audience as Record<string, unknown>).audienceType).toBe(
      "طلاب المرحلة الثانوية",
    );
  });

  it("omits audience/timeRequired when data is absent", () => {
    const ld = courseJsonLd(baseCourse(), origin, "أكاديمية أ");
    expect(ld.audience).toBeUndefined();
    expect(ld.timeRequired).toBe("PT90M"); // duration is present and real
  });
});

describe("webSiteJsonLd", () => {
  it("includes a SearchAction targeting the real catalog search", () => {
    const ld = webSiteJsonLd(null, "https://a.academy.test");
    const action = ld.potentialAction as Record<string, unknown>;
    expect(action["@type"]).toBe("SearchAction");
    const target = action.target as Record<string, unknown>;
    expect(target.urlTemplate).toBe("https://a.academy.test/courses?search={search_term_string}");
  });
});

describe("organizationJsonLd", () => {
  it("uses the tenant name when present", () => {
    const ld = organizationJsonLd(
      { id: 1, name: "أكاديمية أ", slug: "a", domain: "a.academy.test", status: "active", branding: { logo: null, favicon: null, primaryColor: null, secondaryColor: null, accentColor: null, font: null, darkLogo: null, lightLogo: null } },
      "https://a.academy.test",
    );
    expect(ld.name).toBe("أكاديمية أ");
    expect(ld.url).toBe("https://a.academy.test");
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers items from 1 with exact URLs", () => {
    const ld = breadcrumbJsonLd([
      { name: "الرئيسية", url: "https://a.academy.test/" },
      { name: "الثانوية", url: "https://a.academy.test/stages/3" },
    ]);
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    const first = items[0] as Record<string, unknown>;
    const second = items[1] as Record<string, unknown>;
    expect(first.position).toBe(1);
    expect(first.name).toBe("الرئيسية");
    expect(second.item).toBe("https://a.academy.test/stages/3");
  });
});
