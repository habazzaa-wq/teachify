"use client";

import { useTranslations } from "next-intl";
import {
  AppEmptyState,
  AppPage,
  PermissionGuard,
} from "@/components/ui";
import { SeoOverview } from "@/features/seo-studio";

function SeoStudioPage() {
  const t = useTranslations("seo");

  return (
    <AppPage maxWidth="xl">
      <PermissionGuard
        permission="seo.view"
        fallback={<AppEmptyState title={t("noAccess")} description={t("noAccessDescription")} />}
      >
        <SeoOverview />
      </PermissionGuard>
    </AppPage>
  );
}

export default SeoStudioPage;
