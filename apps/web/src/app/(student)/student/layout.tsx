import { AuthProviders } from "@/providers/AuthProviders";
import { StudentDashboardShell } from "@/features/student-dashboard/components/StudentDashboardShell";

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
