"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlatformAuth } from "@/providers/PlatformAuthProvider";
import { routes } from "@/constants/routes";
import { AppLoadingState } from "@/components/ui/AppLoadingState";

function PlatformGuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = usePlatformAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(routes.superadminDashboard);
    }
  }, [router, status]);

  if (status === "idle" || status === "loading") {
    return <AppLoadingState className="min-h-screen bg-slate-950" />;
  }

  if (status === "authenticated") {
    return <AppLoadingState className="min-h-screen bg-slate-950" />;
  }

  return <>{children}</>;
}

export { PlatformGuestRoute };
