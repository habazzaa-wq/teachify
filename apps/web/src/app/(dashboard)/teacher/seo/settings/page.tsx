"use client";

import { useTranslations } from "next-intl";
import {
  AppEmptyState,
  AppPage,
  PermissionGuard,
} from "@/components/ui";
import { SeoSettings } from "@/features/seo-studio";

function SeoSettingsPage() {
  const t = useTranslations("seo");

  return (
    <AppPage maxWidth="xl">
      <PermissionGuard
        permission="seo.view"
        fallback={<AppEmptyState title={t("noAccess")} description={t("noAccessDescription")} />}
      >
        <SeoSettings />
      </PermissionGuard>
    </AppPage>
  );
}

export default SeoSettingsPage;
