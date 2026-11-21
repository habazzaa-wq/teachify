import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";
import { canonicalUrl, getRequestOrigin } from "@/lib/seo/url";
import { routes } from "@/constants/routes";
import { ServicesPage } from "@/features/services/ServicesPage";

export async function generateMetadata(): Promise<Metadata> {
  const [tenant, origin] = await Promise.all([getTenantSeoContext(), getRequestOrigin()]);

  return buildSeoMetadata(
    {
      title: "الخدمات",
      description:
        "استكشف الخدمات التعليمية المخصصة، وتعرّف على المميزات والتفاصيل، وتواصل مباشرة مع مقدم الخدمة المناسب لاحتياجك.",
      canonical: canonicalUrl(origin, routes.publicServices),
    },
    tenant,
    origin,
  );
}

export default function Page() {
  return <ServicesPage />;
}
