import type { Metadata } from "next";
import { AuthProviders } from "@/providers/AuthProviders";
import { StudentDashboardShell } from "@/features/student-dashboard/components/StudentDashboardShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StudentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviders>
      <StudentDashboardShell>{children}</StudentDashboardShell>
    </AuthProviders>
  );
}
