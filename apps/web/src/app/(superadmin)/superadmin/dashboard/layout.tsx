import { PlatformDashboardLayout } from "@/layouts/PlatformDashboardLayout";

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformDashboardLayout>{children}</PlatformDashboardLayout>;
}
