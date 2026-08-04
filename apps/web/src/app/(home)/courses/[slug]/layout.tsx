import { AuthProviders } from "@/providers/AuthProviders";

export default function CourseSlugRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProviders>{children}</AuthProviders>;
}
