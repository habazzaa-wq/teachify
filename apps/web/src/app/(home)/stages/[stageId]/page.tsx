import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { env } from "@/config/env";
import { STAGE_COURSES_QUERY_KEY, STAGE_QUERY_KEY } from "@/features/stage-courses/constants";
import { stageServerService } from "@/features/stage-courses/server-services";
import { StagePage } from "@/features/stage-courses/components/StagePage";

interface PageProps {
  params: Promise<{ stageId: string }>;
}

function toStageId(raw: string): number {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

async function pageOrigin(): Promise<string> {
  const h = await headers();
  const protocol = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  return `${protocol}://${host}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stageId } = await params;
  const id = toStageId(stageId);
  if (!id) {
    return { title: "المرحلة الدراسية" };
  }

  const stage = await stageServerService.getStage(id);
  if (!stage) {
    return { title: "المرحلة الدراسية غير موجودة" };
  }

  const description =
    stage.description ?? `استكشف الدورات التعليمية المتاحة في المرحلة الدراسية ${stage.name}`;

  return {
    title: `${stage.name} | ${env.appName}`,
    description,
    alternates: { canonical: `/stages/${stage.id}` },
    openGraph: {
      title: `${stage.name} | ${env.appName}`,
      description,
      type: "website",
      locale: "ar_SA",
      siteName: env.appName,
      images: stage.image ? [{ url: stage.image, alt: stage.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${stage.name} | ${env.appName}`,
      description,
      images: stage.image ? [stage.image] : [],
    },
  };
}

export default async function StagePageRoute({ params }: PageProps) {
  const { stageId } = await params;
  const id = toStageId(stageId);
  if (!id) {
    notFound();
  }

  const [stage, courses] = await Promise.all([
    stageServerService.getStage(id),
    stageServerService.getCourses(id, {}, 1),
  ]);

  if (!stage) {
    notFound();
  }

  const queryClient = getQueryClient();
  queryClient.setQueryData([STAGE_QUERY_KEY, "public", id], stage);
  queryClient.setQueryData([STAGE_COURSES_QUERY_KEY, id, {}, 1], courses);

  const origin = await pageOrigin();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: stage.name,
    description: stage.description ?? undefined,
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
        <StagePage stageId={id} />
      </HydrationBoundary>
    </>
  );
}
