import { Amiri } from "next/font/google";
import { PublicLayout } from "@/layouts/PublicLayout";

/**
 * Editorial display face for the public pages (headings, catalogue stamps).
 * Deliberately distinct from the tenant body face (`--font-sans`, default
 * Cairo) so the section reads as printed matter, not another sans header.
 */
const displayFont = Amiri({
  subsets: ["arabic", "latin"],
  weight: "700",
  variable: "--font-display",
  display: "swap",
});

export default function HomeRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={displayFont.variable}>
      <PublicLayout>{children}</PublicLayout>
    </div>
  );
}