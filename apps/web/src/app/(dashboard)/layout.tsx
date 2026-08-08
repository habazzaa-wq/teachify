import type { Metadata } from "next";
import { AuthProviders } from "@/providers/AuthProviders";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TenantDashboardLayout } from "@/components/layout/TenantDashboardLayout";
import { UploadManager } from "@/features/media-library/upload-manager";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviders>
      <ProtectedRoute>
        <TenantDashboardLayout>
          {children}
          <UploadManager />
        </TenantDashboardLayout>
      </ProtectedRoute>
    </AuthProviders>
  );
}
