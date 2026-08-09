"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AppEmptyState,
  AppLoadingState,
  AppPage,
  PermissionGuard,
} from "@/components/ui";
import { SeoContentEditor } from "@/features/seo-studio";
import type { SeoContentType } from "@/features/seo-studio/types";

const ALLOWED_TYPES: SeoContentType[] = [
  "article",
  "guide",
  "faq_collection",
  "custom_page",
  "course",
  "stage",
  "subject",
  "category",
];

function SeoContentNewEditor() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as SeoContentType | null;
  const initialType =
    type && ALLOWED_TYPES.includes(type) ? type : undefined;

  return <SeoContentEditor initialType={initialType} />;
}

function SeoContentNewPage() {
  const t = useTranslations("seo");

  return (
    <AppPage maxWidth="xl">
      <PermissionGuard
        permission="seo.view"
        fallback={<AppEmptyState title={t("noAccess")} description={t("noAccessDescription")} />}
      >
        <Suspense fallback={<AppLoadingState />}>
          <SeoContentNewEditor />
        </Suspense>
      </PermissionGuard>
    </AppPage>
  );
}

export default SeoContentNewPage;
