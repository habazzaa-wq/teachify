import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TenantDashboardLayout } from "@/components/layout/TenantDashboardLayout";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <TenantDashboardLayout>{children}</TenantDashboardLayout>
    </ProtectedRoute>
  );
}
