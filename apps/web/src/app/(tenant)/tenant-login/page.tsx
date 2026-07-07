"use client";

import { TenantGuestRoute } from "@/components/auth/TenantGuestRoute";
import { PageContent } from "@/features/auth/components/tenant-login";

function TenantLoginPage() {
  return (
    <TenantGuestRoute>
      <PageContent />
    </TenantGuestRoute>
  );
}

export default TenantLoginPage;
