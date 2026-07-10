"use client";

import { NewsTicker } from "@/components/home/NewsTicker";
import { PublicNavbar } from "@/components/home/PublicNavbar";

/**
 * Public academy shell: news ticker first, then content + footer.
 * Used for unauthenticated marketing/landing/public academy pages.
 */
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NewsTicker />
      <PublicNavbar />

      <main className="flex-1">
        <div className="container py-8">{children}</div>
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} أكاديميتي. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}

export { PublicLayout };
