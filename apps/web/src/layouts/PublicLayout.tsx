import dynamic from "next/dynamic";

const InstallAppBanner = dynamic(
  () =>
    import("@/components/pwa/InstallAppBanner").then((m) => m.InstallAppBanner),
  { ssr: false },
);

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

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NewsTicker />
      <PublicNavbar />
      <MobileSecondaryNav />
      <InstallAppBanner />

      <main className="flex-1">{children}</main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} أكاديميتي. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}

export { PublicLayout };
