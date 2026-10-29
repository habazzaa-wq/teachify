"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import { hasStaffAccess } from "@/lib/tenant-access";
import { routes } from "@/constants/routes";
import { AppLoadingState } from "@/components/ui/AppLoadingState";

function TenantGuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, isHydrated, isBootstrapping } = useAuth();
  const { activeTenant } = useTenantContext();

  useEffect(() => {
    // Wait for hydration and tenant before making redirect decisions
    if (!isHydrated || !activeTenant) return;

    if (status === "authenticated") {
      const roles = useTenantStore.getState().roles;
      console.log("[TenantGuestRoute] Authenticated, redirecting to dashboard.");
      router.replace(hasStaffAccess(roles) ? routes.dashboard : routes.studentDashboard);
    }
  }, [status, activeTenant, router, isHydrated]);

  // If we are authenticated, we are already redirecting (see useEffect).
  // Show loader to prevent flashing the login form.
  if (status === "authenticated" && activeTenant) {
    return <AppLoadingState className="min-h-screen" />;
  }

  // While re-validating a persisted session (bootstrap), don't flash the login form.
  const storeToken = useAuthStore.getState().accessToken;
  const storageData = typeof window !== "undefined" ? localStorage.getItem("auth-state") : null;
  const storageToken = storageData ? JSON.parse(storageData)?.state?.accessToken : null;
  const hasToken = Boolean(storeToken || storageToken);

  if (!isHydrated || isBootstrapping || status === "loading" || (status === "idle" && hasToken)) {
    return <AppLoadingState className="min-h-screen" />;
  }

  return <>{children}</>;
}

export { TenantGuestRoute };
