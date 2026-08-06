import type { Metadata } from "next";
import { headers } from "next/headers";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { env } from "@/config/env";
import { catalogKeys } from "@/features/course-catalog/keys";
import { catalogServerService } from "@/features/course-catalog/server-services";
import type {
  CatalogFilters,
  CatalogPricingFilter,
  CatalogSort,
} from "@/features/course-catalog/types";
import { CatalogPage } from "@/features/course-catalog/components/CatalogPage";

async function pageOrigin(): Promise<string> {
  const h = await headers();
  const protocol = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  return `${protocol}://${host}`;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `جميع الكورسات | ${env.appName}`,
    description:
      "استعرض جميع الدورات التعليمية المتاحة، وصفِّ النتائج حسب المرحلة الدراسية أو المادة أو المدرّس أو السعر، وابدأ رحلة تعلّم جديدة.",
    alternates: { canonical: "/courses" },
    openGraph: {
      title: `جميع الكورسات | ${env.appName}`,
      description:
        "استعرض جميع الدورات التعليمية المتاحة وابدأ رحلة تعلّم جديدة.",
      type: "website",
      locale: "ar_SA",
      siteName: env.appName,
    },
    twitter: {
      card: "summary_large_image",
      title: `جميع الكورسات | ${env.appName}`,
      description:
        "استعرض جميع الدورات التعليمية المتاحة وابدأ رحلة تعلّم جديدة.",
    },
  };
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const initialFilters: CatalogFilters = {
    search: firstParam(sp.search) || undefined,
    stageId: firstParam(sp.educational_stage_id) || undefined,
    subjectId: firstParam(sp.subject_id) || undefined,
    teacherId: firstParam(sp.instructor_id) || undefined,
    pricing: (firstParam(sp.pricing_type) as CatalogPricingFilter) || undefined,
    sort: (firstParam(sp.sort) as CatalogSort) || undefined,
  };
  const initialPage = Math.max(1, Number(firstParam(sp.page)) || 1);

  const queryClient = getQueryClient();

  const [stages, courses] = await Promise.all([
    catalogServerService.getStages(),
    catalogServerService.getCourses(initialFilters, initialPage),
  ]);

  if (stages) {
    queryClient.setQueryData(catalogKeys.stages, stages);
  }
  if (courses) {
    queryClient.setQueryData(catalogKeys.courses(initialFilters, initialPage), courses);
  }

  const origin = await pageOrigin();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "جميع الكورسات",
    numberOfItems: courses?.total ?? 0,
    itemListElement: (courses?.data ?? []).map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: course.title,
        url: `${origin}/courses/${course.slug}`,
      },
    })),
  };

  const stateKey = Object.entries(sp)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(Array.isArray(value) ? value.join(",") : String(value))}`)
    .join("&");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CatalogPage key={stateKey} initialFilters={initialFilters} initialPage={initialPage} />
      </HydrationBoundary>
    </>
  );
}
