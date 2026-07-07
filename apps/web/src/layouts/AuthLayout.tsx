"use client";

import { GraduationCap } from "lucide-react";

/**
 * Centered authentication shell for the login page (and future auth screens).
 */
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4"
    >
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold">أكاديميتي</h1>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export { AuthLayout };
