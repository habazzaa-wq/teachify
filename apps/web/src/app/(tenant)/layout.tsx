import { AuthProviders } from "@/providers/AuthProviders";

export default function TenantRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProviders>{children}</AuthProviders>;
}
