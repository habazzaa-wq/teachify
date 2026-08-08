import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { STAGE_COURSES_QUERY_KEY, STAGE_QUERY_KEY } from "@/features/stage-courses/constants";
import { stageServerService } from "@/features/stage-courses/server-services";
import { StagePage } from "@/features/stage-courses/components/StagePage";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { routes } from "@/constants/routes";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";

interface PageProps {
  params: Promise<{ stageId: string }>;
}

function toStageId(raw: string): number {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stageId } = await params;
  const id = toStageId(stageId);
  if (!id) {
    return { title: "المرحلة الدراسية" };
  }

  const [tenant, origin, stage, courses] = await Promise.all([
    getTenantSeoContext(),
    getRequestOrigin(),
    stageServerService.getStage(id),
    stageServerService.getCourses(id, {}, 1),
  ]);

  if (!stage) {
    return { title: "المرحلة الدراسية غير موجودة" };
  }

  const subjectNames = [
    ...new Set(
      (courses?.data ?? [])
        .map((course) => course.subject?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  const description =
    stage.description ??
    (subjectNames.length > 0
      ? `استكشف دورات ${stage.name} في ${subjectNames.slice(0, 5).join("، ")} وأكثر، وسجّل الآن لبدء رحلة التعلّم.`
      : `استكشف الدورات التعليمية المتاحة في المرحلة الدراسية ${stage.name}`);

  return buildSeoMetadata(
    {
      title: `دورات ${stage.name}`,
      description,
      canonical: canonicalUrl(origin, `/stages/${stage.id}`),
      ogImage: stage.image,
      ogImageAlt: stage.name,
    },
    tenant,
    origin,
  );
}

export default async function StagePageRoute({ params }: PageProps) {
  const { stageId } = await params;
  const id = toStageId(stageId);
  if (!id) {
    notFound();
  }

  const [stage, courses, origin] = await Promise.all([
    stageServerService.getStage(id),
    stageServerService.getCourses(id, {}, 1),
    getRequestOrigin(),
  ]);

  if (!stage) {
    notFound();
  }

  const queryClient = getQueryClient();
  queryClient.setQueryData([STAGE_QUERY_KEY, "public", id], stage);
  queryClient.setQueryData([STAGE_COURSES_QUERY_KEY, id, {}, 1], courses);

  const stageUrl = canonicalUrl(origin, `/stages/${stage.id}`);
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
        url: canonicalUrl(origin, `/courses/${course.slug}`),
      },
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "الرئيسية", url: canonicalUrl(origin, routes.home) },
          { name: stage.name, url: stageUrl },
        ])}
      />
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ name: "الرئيسية", href: routes.home }, { name: stage.name }]} />
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StagePage stageId={id} />
      </HydrationBoundary>
    </>
  );
}
