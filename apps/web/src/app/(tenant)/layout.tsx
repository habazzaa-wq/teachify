import type { Metadata } from "next";
import { AuthProviders } from "@/providers/AuthProviders";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TenantRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviders>
      <div className="community-theme">{children}</div>
    </AuthProviders>
  );
}
