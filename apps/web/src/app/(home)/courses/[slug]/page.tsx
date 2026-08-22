import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { publicCourseServerService } from "@/features/public-course/server-services";
import { PUBLIC_COURSE_QUERY_KEY } from "@/features/public-course/constants";
import { PublicCoursePage } from "@/features/public-course/components/PublicCoursePage";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { routes } from "@/constants/routes";
import { buildSeoMetadata, getSiteName } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, courseJsonLd } from "@/lib/seo/jsonld";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [tenant, origin, course] = await Promise.all([
    getTenantSeoContext(),
    getRequestOrigin(),
    publicCourseServerService.getBySlug(slug),
  ]);

  if (!course) {
    return { title: "الدورة غير موجودة" };
  }

  const title =
    course.seo?.title ||
    [course.title, course.subject?.name].filter(Boolean).join(" | ");
  const description =
    course.seo?.description || course.shortDescription || course.subtitle || course.description;

  return buildSeoMetadata(
    {
      title,
      description,
      keywords: course.seo?.keywords
        ?.split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      canonical: canonicalUrl(origin, `/courses/${course.slug}`),
      ogImage: course.coverImage || course.thumbnail,
      ogImageAlt: course.title,
    },
    tenant,
    origin,
  );
}

export default async function CourseSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const [course, tenant, origin] = await Promise.all([
    publicCourseServerService.getBySlug(slug),
    getTenantSeoContext(),
    getRequestOrigin(),
  ]);

  if (!course) {
    notFound();
  }

  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: [PUBLIC_COURSE_QUERY_KEY, "detail", slug],
      queryFn: () => publicCourseServerService.getBySlug(slug),
    }),
    queryClient.prefetchQuery({
      queryKey: [PUBLIC_COURSE_QUERY_KEY, "modules", slug],
      queryFn: () => publicCourseServerService.getModules(slug),
    }),
    queryClient.prefetchQuery({
      queryKey: [PUBLIC_COURSE_QUERY_KEY, "related", slug],
      queryFn: () => publicCourseServerService.getRelated(slug),
    }),
  ]);

  // Single source of truth for the visible breadcrumbs and the matching
  // BreadcrumbList JSON-LD — the stage crumb is added only when the course has
  // a real educational stage, keeping both signals identical.
  const breadcrumbNodes: Array<{ name: string; href: string }> = [
    { name: "الرئيسية", href: routes.home },
    { name: "جميع الكورسات", href: routes.publicCourse },
  ];
  if (course.educationalStage) {
    breadcrumbNodes.push({
      name: course.educationalStage.name,
      href: `/stages/${course.educationalStage.id}`,
    });
  }
  breadcrumbNodes.push({ name: course.title, href: `/courses/${course.slug}` });

  const breadcrumbJsonLdItems = breadcrumbNodes.map((node) => ({
    name: node.name,
    url: canonicalUrl(origin, node.href),
  }));

  return (
    <>
      <JsonLd data={courseJsonLd(course, origin, getSiteName(tenant))} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbJsonLdItems)} />
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbNodes} />
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PublicCoursePage slug={slug} />
      </HydrationBoundary>
    </>
  );
}
