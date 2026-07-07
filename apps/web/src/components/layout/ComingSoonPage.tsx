"use client";

import { useTranslations } from "next-intl";
import { Construction } from "lucide-react";
import { AppEmptyState } from "@/components/ui";

interface ComingSoonPageProps {
  /** Translation key under the "nav" namespace for the page title. */
  titleKey: string;
}

/**
 * Placeholder page rendered for foundation nav routes whose feature UI is not
 * built yet. Keeps the navigation wiring end-to-end without building pages.
 */
function ComingSoonPage({ titleKey }: ComingSoonPageProps) {
  const t = useTranslations("nav");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t(titleKey)}</h1>
      <AppEmptyState
        icon={Construction}
        title={t("comingSoon")}
        description={t("comingSoonDescription")}
      />
    </div>
  );
}

export { ComingSoonPage };
