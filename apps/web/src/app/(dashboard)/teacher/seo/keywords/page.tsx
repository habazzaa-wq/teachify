"use client";

import { useTranslations } from "next-intl";
import {
  AppEmptyState,
  AppPage,
  PermissionGuard,
} from "@/components/ui";
import { SeoKeywordList } from "@/features/seo-studio";

function SeoKeywordsPage() {
  const t = useTranslations("seo");

  return (
    <AppPage maxWidth="xl">
      <PermissionGuard
        permission="seo.view"
        fallback={<AppEmptyState title={t("noAccess")} description={t("noAccessDescription")} />}
      >
        <SeoKeywordList />
      </PermissionGuard>
    </AppPage>
  );
}

export default SeoKeywordsPage;
