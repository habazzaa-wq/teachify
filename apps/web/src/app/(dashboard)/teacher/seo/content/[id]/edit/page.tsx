"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AppEmptyState,
  AppPage,
  PermissionGuard,
} from "@/components/ui";
import { SeoContentEditor } from "@/features/seo-studio";

function SeoContentEditPage() {
  const t = useTranslations("seo");
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;

  return (
    <AppPage maxWidth="xl">
      <PermissionGuard
        permission="seo.view"
        fallback={<AppEmptyState title={t("noAccess")} description={t("noAccessDescription")} />}
      >
        <SeoContentEditor key={id} id={id} />
      </PermissionGuard>
    </AppPage>
  );
}

export default SeoContentEditPage;
