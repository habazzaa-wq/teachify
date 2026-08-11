import dynamic from "next/dynamic";
import { PublicFooter } from "@/components/home/PublicFooter";

const NewsTicker = dynamic(
  () => import("@/components/home/NewsTicker").then((m) => m.NewsTicker),
  { ssr: true }
);

const PublicNavbar = dynamic(
  () => import("@/components/home/PublicNavbar").then((m) => m.PublicNavbar),
  { ssr: true }
);

const MobileSecondaryNav = dynamic(
  () => import("@/components/home/MobileSecondaryNav").then((m) => m.MobileSecondaryNav),
  { ssr: true }
);

/**
 * Public shell for tenant storefronts. The footer carries the tenant brand
 * alongside the platform developer credit, keeping the shell light and focused.
 */
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="community-theme flex min-h-screen flex-col bg-background">
      <NewsTicker />
      <PublicNavbar />
      <MobileSecondaryNav />

      <main className="flex-1">{children}</main>

      <PublicFooter />
    </div>
  );
}

export { PublicLayout };
