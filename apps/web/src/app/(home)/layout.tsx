import { PublicLayout } from "@/layouts/PublicLayout";
import { getSiteName } from "@/lib/seo/metadata";
import { getTenantSeoContext } from "@/lib/seo/tenant-context";

export default async function HomeRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenantSeoContext();

  return <PublicLayout tenantName={getSiteName(tenant)}>{children}</PublicLayout>;
}
