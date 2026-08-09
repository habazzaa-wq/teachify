"use client";

import { useTranslations } from "next-intl";
import {
  AppEmptyState,
  AppPage,
  PermissionGuard,
} from "@/components/ui";
import { SeoContentList } from "@/features/seo-studio";

function SeoContentPage() {
  const t = useTranslations("seo");

  return (
    <AppPage maxWidth="xl">
      <PermissionGuard
        permission="seo.view"
        fallback={<AppEmptyState title={t("noAccess")} description={t("noAccessDescription")} />}
      >
        <SeoContentList />
      </PermissionGuard>
    </AppPage>
  );
}

export default SeoContentPage;
