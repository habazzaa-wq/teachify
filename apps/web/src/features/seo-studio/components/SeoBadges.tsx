"use client";

import { useTranslations } from "next-intl";
import { AppBadge, AppProgress, AppStatusBadge } from "@/components/ui";
import { SEO_STATUS_MAP } from "../constants";
import type { SeoContentStatus, SeoHealth } from "../types";

function SeoStatusBadge({ status }: { status: SeoContentStatus }) {
  const t = useTranslations("seo");
  const config = SEO_STATUS_MAP[status] ?? SEO_STATUS_MAP.draft;
  return (
    <AppStatusBadge
      status={config.badge}
      label={t(status)}
      className="whitespace-nowrap"
    />
  );
}

const HEALTH_VARIANT: Record<string, "success" | "default" | "warning" | "destructive"> = {
  excellent: "success",
  good: "default",
  fair: "warning",
  poor: "destructive",
};

function SeoHealthBadge({ health, score }: { health: SeoHealth | string | null; score?: number }) {
  const t = useTranslations("seo");
  const key = health ?? "poor";
  return (
    <AppBadge variant={HEALTH_VARIANT[key] ?? "destructive"} className="gap-1 whitespace-nowrap">
      {typeof score === "number" && <span className="tabular-nums">{score}</span>}
      {t(key)}
    </AppBadge>
  );
}

function SeoScoreBar({ score }: { score: number }) {
  const variant =
    score >= 65 ? "success" : score >= 45 ? "warning" : "destructive";
  return (
    <AppProgress
      value={score}
      max={100}
      size="sm"
      variant={variant}
      className="w-20"
    />
  );
}

export { SeoStatusBadge, SeoHealthBadge, SeoScoreBar };
