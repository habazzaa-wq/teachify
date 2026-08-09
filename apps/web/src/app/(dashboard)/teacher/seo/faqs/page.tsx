"use client";

import { useTranslations } from "next-intl";
import {
  AppEmptyState,
  AppPage,
  PermissionGuard,
} from "@/components/ui";
import { routes } from "@/constants/routes";
import { SeoContentList } from "@/features/seo-studio";

function SeoFaqsPage() {
  const t = useTranslations("seo");

  return (
    <AppPage maxWidth="xl">
      <PermissionGuard
        permission="seo.view"
        fallback={<AppEmptyState title={t("noAccess")} description={t("noAccessDescription")} />}
      >
        <SeoContentList
          initialType="faq_collection"
          title={t("faqs")}
          description={t("faqsDescription")}
          createHref={`${routes.seoContentNew}?type=faq_collection`}
          createLabel={t("createFaq")}
        />
      </PermissionGuard>
    </AppPage>
  );
}

export default SeoFaqsPage;
