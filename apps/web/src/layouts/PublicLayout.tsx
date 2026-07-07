"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { routes } from "@/constants/routes";

/**
 * Public academy shell: RTL navbar + responsive content container + footer.
 * Used for unauthenticated marketing/landing/public academy pages.
 */
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href={routes.home} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">أكاديميتي</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href={routes.login} className="hover:text-foreground">
              تسجيل الدخول
            </Link>
          </nav>
        </div>
      </header>

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
