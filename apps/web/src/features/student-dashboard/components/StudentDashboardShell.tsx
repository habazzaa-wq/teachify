"use client";

import { useEffect, useRef } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NewsTicker } from "@/components/home/NewsTicker";
import { PublicNavbar } from "@/components/home/PublicNavbar";
import { MobileSecondaryNav } from "@/components/home/MobileSecondaryNav";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useDashboardThemeStore } from "@/stores/dashboard-theme.store";
import { generateThemeColors } from "@/lib/color";

interface StudentDashboardShellProps {
  children: React.ReactNode;
}

function StudentDashboardShell({ children }: StudentDashboardShellProps) {
  const { tenant } = useActiveTenant();
  const { primaryColor, secondaryColor, isActive, setColors } = useDashboardThemeStore();
  const theme = useUiStore((s) => s.theme);
  const rootRef = useRef<HTMLDivElement>(null);

  // Auto-apply the tenant's control-panel primary/secondary colors the first
  // time they're available, unless the user already customized them.
  useEffect(() => {
    const branding = tenant?.branding;
    const primary = branding?.primary_color;
    const secondary = branding?.secondary_color;
    if (primary && secondary && !isActive) {
      setColors(primary, secondary);
    }
  }, [tenant, isActive, setColors]);

  // Inject the tenant-themed palette for the shared neutral tokens still used
  // by some of the child UI (drawers, modals, loading states).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const styleId = "student-custom-theme";
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!isActive) {
      if (styleTag) styleTag.remove();
      return;
    }
    const colors = generateThemeColors(primaryColor, secondaryColor, theme === "dark");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    const vars = Object.entries(colors)
      .map(([k, v]) => `${k}: ${v};`)
      .join("");
    styleTag.textContent = `.student-theme { ${vars} }`;
  }, [primaryColor, secondaryColor, isActive, theme]);

  const isDark = theme === "dark";

  return (
    <ProtectedRoute>
      <div ref={rootRef} className="student-theme flex min-h-screen flex-col bg-background">
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
