"use client";

import dynamic from "next/dynamic";
import {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui";
import { PlatformGuestRoute } from "@/components/auth/PlatformGuestRoute";
import { PlatformAuthLayout } from "@/layouts/PlatformAuthLayout";

const PlatformLoginForm = dynamic(
  () =>
    import("@/features/platform-admins/components/PlatformLoginForm").then(
      (m) => m.PlatformLoginForm,
    ),
);

function SuperAdminLoginPage() {
  return (
    <PlatformGuestRoute>
      <PlatformAuthLayout>
        <AppCard className="border-slate-800 bg-slate-900/80 text-slate-50 shadow-2xl backdrop-blur">
          <AppCardHeader className="text-center">
            <AppCardTitle className="text-slate-50">
              تسجيل دخول Super Admin
            </AppCardTitle>
            <AppCardDescription className="text-slate-400">
              Platform-wide access · separate from tenant login
            </AppCardDescription>
          </AppCardHeader>
          <AppCardContent>
            <PlatformLoginForm />
          </AppCardContent>
        </AppCard>
      </PlatformAuthLayout>
    </PlatformGuestRoute>
  );
}

export default SuperAdminLoginPage;
