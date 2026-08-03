import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { publicCourseServerService } from "@/features/public-course/server-services";
import { PUBLIC_COURSE_QUERY_KEY } from "@/features/public-course/constants";
import { PublicCoursePage } from "@/features/public-course/components/PublicCoursePage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await publicCourseServerService.getBySlug(slug);

  if (!course) {
    return { title: "الدورة غير موجودة" };
  }

  return {
    title: course.seo?.title || course.title,
    description: course.seo?.description || course.shortDescription || course.subtitle,
    keywords: course.seo?.keywords?.split(",") || [],
    openGraph: {
      title: course.seo?.title || course.title,
      description: course.seo?.description || course.shortDescription || "",
      images: course.coverImage ? [course.coverImage] : course.thumbnail ? [course.thumbnail] : [],
      type: "website",
    },
  };
}

export default async function CourseSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await publicCourseServerService.getBySlug(slug);

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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicCoursePage slug={slug} />
    </HydrationBoundary>
  );
}
