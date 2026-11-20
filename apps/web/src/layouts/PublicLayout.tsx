import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PublicFooter } from "@/components/home/PublicFooter";
import { WhatsAppFloatButton } from "@/components/home/WhatsAppFloatButton";
import { InstallAppBannerMount } from "@/components/pwa/InstallAppBannerMount";
import { PublicNewsTicker } from "@/components/home/PublicNewsTicker";

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
      <Suspense fallback={<div aria-hidden="true" className="h-11" />}>
        <PublicNewsTicker />
      </Suspense>
      <PublicNavbar />
      <MobileSecondaryNav />
      <InstallAppBannerMount />

      <main className="flex-1">{children}</main>

      <PublicFooter />
      <WhatsAppFloatButton />
    </div>
  );
}

export { PublicLayout };
