import type { Metadata } from "next";
import { headers } from "next/headers";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { env } from "@/config/env";
import { catalogKeys } from "@/features/course-catalog/hooks";
import { catalogServerService } from "@/features/course-catalog/server-services";
import { CatalogPage } from "@/features/course-catalog/components/CatalogPage";

async function pageOrigin(): Promise<string> {
  const h = await headers();
  const protocol = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  return `${protocol}://${host}`;
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

export default async function CoursesPage() {
  const queryClient = getQueryClient();

  const [stages, courses] = await Promise.all([
    catalogServerService.getStages(),
    catalogServerService.getCourses({}, 1),
  ]);

  if (stages) {
    queryClient.setQueryData(catalogKeys.stages, stages);
  }
  if (courses) {
    queryClient.setQueryData(catalogKeys.courses({}, 1), courses);
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CatalogPage />
      </HydrationBoundary>
    </>
  );
}
