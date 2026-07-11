import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TenantDashboardLayout } from "@/components/layout/TenantDashboardLayout";
import { UploadManager } from "@/features/media-library/upload-manager";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <TenantDashboardLayout>
        {children}
        <UploadManager />
      </TenantDashboardLayout>
    </ProtectedRoute>
  );
}
