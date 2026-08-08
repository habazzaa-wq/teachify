import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AuthProviders } from "@/providers/AuthProviders";
import { CommunityProvider } from "@/features/community/providers/CommunityProvider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NewsTicker = dynamic(
  () => import("@/components/home/NewsTicker").then((m) => m.NewsTicker),
  { ssr: true },
);

const PublicNavbar = dynamic(
  () => import("@/components/home/PublicNavbar").then((m) => m.PublicNavbar),
  { ssr: true },
);

const MobileSecondaryNav = dynamic(
  () =>
    import("@/components/home/MobileSecondaryNav").then((m) => m.MobileSecondaryNav),
  { ssr: true },
);

export default function CommunityRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviders>
      <CommunityProvider>
        <div className="community-theme flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
          <NewsTicker />
          <PublicNavbar />
          <MobileSecondaryNav />
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </CommunityProvider>
    </AuthProviders>
  );
}
