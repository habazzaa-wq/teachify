import { AuthProviders } from "@/providers/AuthProviders";

export default function LoginRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProviders>{children}</AuthProviders>;
}
