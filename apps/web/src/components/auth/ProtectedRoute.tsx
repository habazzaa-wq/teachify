"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { useTenantStore } from "@/stores/tenant.store";
import { isStudentOnly } from "@/lib/tenant-access";
import { routes } from "@/constants/routes";
import { AppLoadingState } from "@/components/ui/AppLoadingState";

/**
 * Gate for authenticated dashboard routes. Redirects to the tenant login page
 * when the session is unauthenticated, requires an active tenant before
 * rendering children, and keeps student-only memberships out of the teacher
 * control panel (they belong on their own /student dashboard).
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();
  const { activeTenant, hydrated } = useTenantContext();
  const hasTenant = activeTenant !== null;

  useEffect(() => {
    if (status === "unauthenticated") {
      // An unauthenticated dashboard session belongs on the teacher login
      // page, not the public storefront home page.
      router.replace(routes.tenantLogin);
      return;
    }

    // A student-only membership must never see the teacher control panel,
    // even when signed in through a shared auth endpoint.
    if (status === "authenticated" && pathname.startsWith("/teacher")) {
      const roles = useTenantStore.getState().roles;
      if (isStudentOnly(roles)) {
        router.replace(routes.studentDashboard);
      }
    }
  }, [router, status, pathname]);

  // Bootstrap in flight.
  if (status === "idle" || status === "loading") {
    return <AppLoadingState className="min-h-screen" />;
  }

  if (status !== "authenticated") {
    return <AppLoadingState className="min-h-screen" />;
  }

  // Tenant is mandatory for tenant-scoped requests.
  if (hydrated && !hasTenant) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center"
      >
        <h1 className="text-lg font-semibold">بيئة العمل غير متاحة</h1>
        <p className="text-sm text-muted-foreground">
          يلزم تحديد أكاديمية صالحة قبل التمكن من تحميل المساحة.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}

export { ProtectedRoute };
