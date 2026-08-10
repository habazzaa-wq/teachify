import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ExamSessionRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="community-theme">{children}</div>;
}
