import { PublicLayout } from "@/layouts/PublicLayout";

export default function HomeRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
