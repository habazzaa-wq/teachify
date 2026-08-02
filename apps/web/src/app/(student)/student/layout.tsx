import { StudentDashboardShell } from "@/features/student-dashboard/components/StudentDashboardShell";

export default function StudentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentDashboardShell>{children}</StudentDashboardShell>;
}
