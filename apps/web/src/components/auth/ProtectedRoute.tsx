"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { routes } from "@/constants/routes";
import { AppLoadingState } from "@/components/ui/AppLoadingState";

/**
 * Gate for authenticated dashboard routes. Redirects to /login when the session
 * is unauthenticated, and requires an active tenant before rendering children.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  const { activeTenant, hydrated } = useTenantContext();
  const hasTenant = activeTenant !== null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(routes.login);
    }
  }, [router, status]);

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
