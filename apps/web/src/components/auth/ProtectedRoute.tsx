"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { useAuthStore } from "@/stores/auth.store";
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
  const { status, isHydrated, isBootstrapping } = useAuth();
  const { activeTenant, hydrated } = useTenantContext();
  const hasTenant = activeTenant !== null;

  useEffect(() => {
    // If we haven't hydrated the auth store yet, don't make any decisions.
    if (!isHydrated) {
      return;
    }

    const storeToken = useAuthStore.getState().accessToken;
    const storageData = typeof window !== "undefined" ? localStorage.getItem("auth-state") : null;
    const storageToken = storageData ? JSON.parse(storageData)?.state?.accessToken : null;
    const token = storeToken || storageToken;

    // truly unauthenticated or hydrated with no token? wait until we are SURE.
    if (status === "unauthenticated") {
      // If we have any sign of a token OR we are still bootstrapping, WAIT.
      if (token || isBootstrapping) {
        console.warn("[ProtectedRoute] status is unauthenticated but token exists or bootstrapping. Waiting.");
        return;
      }

      // If tenant is not yet resolved, we can't safely redirect to tenantLogin
      if (!activeTenant) {
        console.warn("[ProtectedRoute] status is unauthenticated and no token, but tenant not ready. Waiting.");
        return;
      }

      // Truly unauthenticated: redirect to login
      console.log("[ProtectedRoute] Redirecting to login because status is unauthenticated and NO token found.");
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
  }, [router, status, pathname, isHydrated, activeTenant]);

  // Bootstrap in flight or token found but not yet verified.
  const storeToken = useAuthStore.getState().accessToken;
  const storageData = typeof window !== "undefined" ? localStorage.getItem("auth-state") : null;
  const storageToken = storageData ? JSON.parse(storageData)?.state?.accessToken : null;
  const hasToken = Boolean(storeToken || storageToken);

  if (!isHydrated || !activeTenant || isBootstrapping || status === "idle" || status === "loading" || (status === "unauthenticated" && hasToken)) {
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
