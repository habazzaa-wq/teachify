import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { routes } from "@/constants/routes";
import { serviceServerService } from "@/features/services/server-services";
import { ServiceDetailPage } from "@/features/services/ServiceDetailPage";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildSeoMetadata, getSiteName } from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";
import { toAbsoluteAssetUrl } from "@/lib/url";

interface PageProps {
  params: Promise<{ serviceId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { serviceId } = await params;
  const [tenant, origin, service] = await Promise.all([
    getTenantSeoContext(),
    getRequestOrigin(),
    serviceServerService.getPublicService(serviceId),
  ]);

  if (!service) {
    return { title: "الخدمة غير موجودة" };
  }

  return buildSeoMetadata(
    {
      title: service.title,
      description: service.summary || service.description,
      canonical: canonicalUrl(origin, `${routes.publicServices}/${service.id}`),
      ogImage: toAbsoluteAssetUrl(service.image_url),
      ogImageAlt: service.title,
    },
    tenant,
    origin,
  );
}

export default async function ServiceDetailRoute({ params }: PageProps) {
  const { serviceId } = await params;
  const [service, allServices, tenant, origin] = await Promise.all([
    serviceServerService.getPublicService(serviceId),
    serviceServerService.getPublicServices(),
    getTenantSeoContext(),
    getRequestOrigin(),
  ]);

  if (!service) {
    notFound();
  }

  const href = `${routes.publicServices}/${service.id}`;
  const breadcrumbNodes = [
    { name: "الرئيسية", href: routes.home },
    { name: "الخدمات", href: routes.publicServices },
    { name: service.title, href },
  ];

  const breadcrumbs = breadcrumbNodes.map((node) => ({
    name: node.name,
    url: canonicalUrl(origin, node.href),
  }));

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    ...(service.summary ? { description: service.summary } : {}),
    url: canonicalUrl(origin, href),
    ...(toAbsoluteAssetUrl(service.image_url)
      ? { image: toAbsoluteAssetUrl(service.image_url) }
      : {}),
    provider: { "@type": "Organization", name: getSiteName(tenant) },
  };

  const related = allServices.filter((item) => item.id !== service.id).slice(0, 3);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={serviceSchema} />
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbNodes} />
      </div>
      <ServiceDetailPage service={service} related={related} />
    </>
  );
}
