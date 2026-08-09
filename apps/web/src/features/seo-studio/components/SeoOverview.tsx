"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Archive,
  FileText,
  Gauge,
  Globe,
  HelpCircle,
  History,
  Link2,
  PenLine,
  Plus,
  RefreshCw,
  Tag,
  FileWarning,
} from "lucide-react";
import {
  AppBanner,
  AppButton,
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppErrorState,
  AppLoadingState,
  AppMetricCard,
  AppPageHeader,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/constants/routes";
import { useSeoOverview } from "../hooks";
import { SEO_HEALTH_COLORS, SEO_CONTENT_TYPE_LABEL } from "../constants";
import { SeoStatusBadge } from "./SeoBadges";
import { PermissionGuard } from "@/components/ui";
import type { SeoHealth } from "../types";

function SeoOverview() {
  const t = useTranslations("seo");
  const { data, isLoading, isError, refetch } = useSeoOverview();

  if (isLoading) {
    return <AppLoadingState />;
  }

  if (isError || !data) {
    return <AppErrorState onRetry={() => refetch()} />;
  }

  const { summary, typeBreakdown, scoreDistribution, issues, resourceStats, searchConsole, recentActivity } = data;
  const health = summary.health ?? "poor";

  return (
    <div>
      <AppPageHeader
        title={t("studio")}
        description={t("studioDescription")}
        actions={
          <PermissionGuard permission="seo.create">
            <Link href={routes.seoContentNew}>
              <AppButton>
                <Plus className="h-4 w-4" />
                {t("createContent")}
              </AppButton>
            </Link>
          </PermissionGuard>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <AppMetricCard title={t("totalContents")} value={summary.totalContents} icon={FileText} color="primary" />
        <AppMetricCard title={t("published")} value={summary.published} icon={Globe} color="success" />
        <AppMetricCard title={t("draft")} value={summary.draft} icon={PenLine} color="warning" />
        <AppMetricCard title={t("review")} value={summary.review} icon={RefreshCw} color="info" />
        <AppMetricCard title={t("archived")} value={summary.archived} icon={Archive} color="destructive" />
        <AppMetricCard
          title={t("averageScore")}
          value={summary.averageScore ?? 0}
          suffix=" / 100"
          icon={Gauge}
          color={health === "excellent" || health === "good" ? "success" : "warning"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("scoreDistribution")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="space-y-4">
              {(Object.keys(SEO_HEALTH_COLORS) as SeoHealth[]).map((key) => {
                const count = scoreDistribution[key] ?? 0;
                const total = summary.totalContents || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t(key)}</span>
                      <span className="tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cnBar(SEO_HEALTH_COLORS[key]?.bar)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </AppCardContent>
          </AppCard>

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("typeBreakdown")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(typeBreakdown).map(([type, count]) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium"
                  >
                    {t(SEO_CONTENT_TYPE_LABEL[type as keyof typeof SEO_CONTENT_TYPE_LABEL] ?? "article")}
                    <span className="tabular-nums text-muted-foreground">{count}</span>
                  </span>
                ))}
                {Object.keys(typeBreakdown).length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("noContent")}</p>
                )}
              </div>
            </AppCardContent>
          </AppCard>

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("recentActivity")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noContent")}</p>
              ) : (
                <ul className="divide-y">
                  {recentActivity.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-2 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                      <SeoStatusBadge status={item.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(item.updatedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AppCardContent>
          </AppCard>
        </div>

        <div className="space-y-6">
          <AppCard>
            <AppCardHeader>
              <AppCardTitle>{t("resourceStats")}</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" /> {t("keywordsCount")}
                  </span>
                  <span className="font-medium tabular-nums">{resourceStats.keywords}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <HelpCircle className="h-4 w-4" /> {t("faqsCount")}
                  </span>
                  <span className="font-medium tabular-nums">{resourceStats.faqs}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Link2 className="h-4 w-4" /> {t("internalLinks")}
                  </span>
                  <span className="font-medium tabular-nums">{resourceStats.internalLinks}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <History className="h-4 w-4" /> {t("revisions")}
                  </span>
                  <span className="font-medium tabular-nums">{resourceStats.revisions}</span>
                </li>
              </ul>
            </AppCardContent>
          </AppCard>

          <AppBanner
            variant="info"
            title={`${t("searchConsole")} — ${t("searchConsoleNotConnected")}`}
            description={searchConsole.note}
          />

          <AppCard>
            <AppCardHeader>
              <AppCardTitle className="inline-flex items-center gap-2">
                <FileWarning className="h-4 w-4" />
                {t("issuesTitle")}
              </AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="space-y-5">
              <IssueGroup
                title={t("weakTitles")}
                items={issues.weakTitles.map((i) => i.title)}
              />
              <IssueGroup
                title={t("weakDescriptions")}
                items={issues.weakDescriptions.map((i) => i.title)}
              />
              {issues.duplicateDescriptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("duplicateDescriptions")}</p>
                  <ul className="space-y-1.5">
                    {issues.duplicateDescriptions.map((group, idx) => (
                      <li key={idx} className="rounded-lg bg-muted/40 p-2 text-xs">
                        <p className="line-clamp-1">{group.description}</p>
                        <p className="mt-1 text-muted-foreground">
                          {t("duplicateCount")}: {group.count}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {issues.needsAttention.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("overviewNeedsAttention")}</p>
                  <ul className="space-y-1.5">
                    {issues.needsAttention.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 text-xs">
                        <span className="line-clamp-1 min-w-0 flex-1">{item.title}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{item.score}/100</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AppCardContent>
          </AppCard>
        </div>
      </div>
    </div>
  );
}

function cnBar(bar?: string) {
  return `h-full rounded-full transition-all ${bar ?? "bg-primary"}`;
}

function IssueGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-1.5">
        {items.map((titleText, idx) => (
          <li key={idx} className="line-clamp-1 rounded-lg bg-muted/40 p-2 text-xs">
            {titleText}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { SeoOverview };
