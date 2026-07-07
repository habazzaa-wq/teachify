"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { AppLoadingState } from "@/components/ui/AppLoadingState";

function TenantGuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  const { activeTenant } = useTenantContext();

  useEffect(() => {
    if (status === "authenticated" && activeTenant) {
      router.replace("/dashboard");
    }
  }, [status, activeTenant, router]);

  if (status === "authenticated" && activeTenant) {
    return <AppLoadingState className="min-h-screen" />;
  }

  return <>{children}</>;
}

export { TenantGuestRoute };
