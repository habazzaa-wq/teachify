"use client";

import { useEffect, useRef } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NewsTicker } from "@/components/home/NewsTicker";
import { PublicNavbar } from "@/components/home/PublicNavbar";
import { MobileSecondaryNav } from "@/components/home/MobileSecondaryNav";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useUiStore } from "@/stores/ui.store";
import { useTenantStore } from "@/stores/tenant.store";
import { useDashboardThemeStore } from "@/stores/dashboard-theme.store";
import { generateThemeColors } from "@/lib/color";
import { resolveBrandHexColors } from "@/lib/brand";

interface StudentDashboardShellProps {
  children: React.ReactNode;
}

function StudentDashboardShell({ children }: StudentDashboardShellProps) {
  const { tenant } = useActiveTenant();
  const { setColors } = useDashboardThemeStore();
  const platformBranding = useTenantStore((s) => s.platformBranding);
  const theme = useUiStore((s) => s.theme);
  const rootRef = useRef<HTMLDivElement>(null);

  // لوحة الطالب بتستخدم ألوان المنصة العالمية (platformBranding) عشان تكون
  // موحّدة تماماً مع باقي المنصة (الموقع العام + لوحة المدرس) سواء المسجّل
  // دخول أو غير المسجّل.
  useEffect(() => {
    if (!platformBranding) return;
    const { primary, secondary } = resolveBrandHexColors(null, platformBranding);
    setColors(primary, secondary);
  }, [platformBranding, setColors]);

  // نحقن سمة ألوان المنصة على لوحة الطالب (نفس ألوان الموقع العام بالظبط).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !platformBranding) return;
    const styleId = "student-custom-theme";
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    const { primary, secondary } = resolveBrandHexColors(null, platformBranding);
    const colors = generateThemeColors(primary, secondary, theme === "dark");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    const vars = Object.entries(colors)
      .map(([k, v]) => `${k}: ${v};`)
      .join("");
    styleTag.textContent = `.student-theme { ${vars} }`;
  }, [platformBranding, theme]);

  // ملاحظة: ألوان "مظهر لوحة التحكم" الخاصة بالمدرس تُطبَّق على لوحة المدرس
  // وصفحة تسجيل الدخول فقط. لوحة الطالب (والمنصة عموماً) تستخدم ألوان المنصة
  // المستقلة، لذا لا نرث ألوان مظهر المدرس هنا حتى لا تتسرّب إلى باقي المنصة.

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
