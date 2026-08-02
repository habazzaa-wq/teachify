"use client";

import { useEffect, useRef } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useDashboardThemeStore } from "@/stores/dashboard-theme.store";
import { generateThemeColors } from "@/lib/color";
import { StudentHeader } from "./StudentHeader";

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

  // Inject the tenant-themed palette across the whole student dashboard.
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

  return (
    <ProtectedRoute>
      <div ref={rootRef} className="student-theme flex min-h-screen flex-col bg-background">
        <StudentHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export { StudentDashboardShell };
