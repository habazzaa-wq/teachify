"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { usePlatformAuth } from "@/providers/PlatformAuthProvider";
import { routes } from "@/constants/routes";
import { AppCard, AppCardContent } from "@/components/ui";

function SuperAdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AppCard className="border-0 shadow-none">
        <AppCardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
            <Shield className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Admin platform</p>
            <p className="text-xs text-muted-foreground">Verifying session...</p>
          </div>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left animate-[shimmer_2s_linear_infinite] rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, platformAdmin } = usePlatformAuth();
  const [requestPending, setRequestPending] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      setRequestPending(true);
    } else {
      setRequestPending(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated" || status === "idle") {
      router.replace(routes.superadminLogin);
      return;
    }

    if (status === "authenticated" && !platformAdmin) {
      router.replace(routes.superadminLogin);
    }
  }, [platformAdmin, router, status]);

  if (status === "loading" && requestPending) {
    return <SuperAdminLoading />;
  }

  if (status !== "authenticated" || !platformAdmin) {
    return null;
  }

  return <>{children}</>;
}

export default SuperAdminGuard;
