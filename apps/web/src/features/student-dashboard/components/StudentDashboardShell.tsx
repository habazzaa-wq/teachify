"use client";

import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NewsTicker } from "@/components/home/NewsTicker";
import { PublicNavbar } from "@/components/home/PublicNavbar";
import { MobileSecondaryNav } from "@/components/home/MobileSecondaryNav";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";

interface StudentDashboardShellProps {
  children: ReactNode;
}

function StudentDashboardShell({ children }: StudentDashboardShellProps) {
  const { tenant } = useActiveTenant();
  const theme = useUiStore((s) => s.theme);

  // لوحة الطالب بتستخدم ألوان المنصة العالمية (platformBranding) اللي بتطبّقها
  // BrandThemeProvider على .student-theme — فمفيش حاجة نحقنها هنا، وده بيضمن
  // اتحاد الألوان مع باقي المنصة (الموقع العام + لوحة المدرس) سواء المسجّل
  // دخول أو غير المسجّل، ومن غير أي اعتماد على localStorage أو مظهر المدرس.

  const isDark = theme === "dark";

  return (
    <ProtectedRoute>
      <div className="student-theme flex min-h-screen flex-col bg-background">
        {/* Home page chrome — same news bar, navbar and mobile nav as the main site */}
        <NewsTicker />
        <PublicNavbar />
        <MobileSecondaryNav />

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 md:py-10 lg:pr-28 xl:pr-32">
          {children}
        </main>

        <footer
          className="border-t py-6"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "var(--brand-primary)",
          }}
        >
          <div className="container text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {tenant?.name ?? "أكاديميتي"}. جميع الحقوق محفوظة.
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}

export { StudentDashboardShell };
