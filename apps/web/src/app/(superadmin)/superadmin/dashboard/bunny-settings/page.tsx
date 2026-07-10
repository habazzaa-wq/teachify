"use client";

import SuperAdminGuard from "@/components/auth/SuperAdminGuard";
import { AppPage, AppPageHeader } from "@/components/ui";
import { BunnyWorkspace } from "@/features/platform-bunny";

export default function PlatformBunnySettingsPage() {
  return (
    <SuperAdminGuard>
      <AppPage maxWidth="xl">
        <AppPageHeader
          title="إعدادات Bunny.net"
          description="إدارة حساب منصة Bunny.net المركزي المستخدم لرفع وسائط جميع العملاء"
        />
        <div className="mt-8">
          <BunnyWorkspace />
        </div>
      </AppPage>
    </SuperAdminGuard>
  );
}
