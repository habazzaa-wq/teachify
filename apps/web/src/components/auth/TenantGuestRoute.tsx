"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { useTenantStore } from "@/stores/tenant.store";
import { hasStaffAccess } from "@/lib/tenant-access";
import { routes } from "@/constants/routes";
import { AppLoadingState } from "@/components/ui/AppLoadingState";

function TenantGuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  const { activeTenant } = useTenantContext();

  useEffect(() => {
    if (status === "authenticated" && activeTenant) {
      const roles = useTenantStore.getState().roles;
      router.replace(hasStaffAccess(roles) ? routes.dashboard : routes.studentDashboard);
    }
  }, [status, activeTenant, router]);

  if (status === "authenticated" && activeTenant) {
    return <AppLoadingState className="min-h-screen" />;
  }

  return <>{children}</>;
}

export { TenantGuestRoute };
