"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import {
  AppButton,
  AppEmptyState,
  AppErrorState,
  AppInput,
  AppLoadingState,
  AppPageHeader,
  AppPagination,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
  PermissionGuard,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/constants/routes";
import { useSeoContents } from "../hooks";
import {
  SEO_CONTENT_SORT_OPTIONS,
  SEO_CONTENT_TYPE_OPTIONS,
  SEO_CONTENT_TYPE_LABEL,
  SEO_PAGE_SIZE,
  SEO_STATUS_OPTIONS,
} from "../constants";
import type { SeoContentStatus, SeoContentType } from "../types";
import { SeoContentRowActions } from "./SeoContentRowActions";
import { SeoHealthBadge, SeoStatusBadge } from "./SeoBadges";

interface SeoContentListProps {
  initialType?: SeoContentType;
  title?: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
}

function SeoContentList({ initialType, title, description, createHref, createLabel }: SeoContentListProps) {
  const t = useTranslations("seo");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SeoContentType | "all">(initialType ?? "all");
  const [statusFilter, setStatusFilter] = useState<SeoContentStatus | "all">("all");
  const [sort, setSort] = useState("updated_at");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useSeoContents({
    search: debouncedSearch || undefined,
    content_type: typeFilter,
    status: statusFilter,
    sort: sort as "updated_at",
    sort_dir: "desc",
    page,
    per_page: SEO_PAGE_SIZE,
  });

  const items = data?.data ?? [];
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;

  const handlePageChange = useCallback((next: number) => {
    setPage(next);
  }, []);

  return (
    <div>
      <AppPageHeader
        title={title ?? t("content")}
        description={description}
        actions={
          <PermissionGuard permission="seo.create">
            <Link href={createHref ?? routes.seoContentNew}>
              <AppButton>
                <Plus className="h-4 w-4" />
                {createLabel ?? t("createContent")}
              </AppButton>
            </Link>
          </PermissionGuard>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <AppInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="h-9 ps-9"
          />
        </div>
        <AppSelect
          value={typeFilter}
          onValueChange={(val) => {
            setTypeFilter(val as SeoContentType | "all");
            setPage(1);
          }}
        >
          <AppSelectTrigger className="h-9 w-[160px]">
            <AppSelectValue placeholder={t("allTypes")} />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="all">{t("allTypes")}</AppSelectItem>
            {SEO_CONTENT_TYPE_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {t(opt.label)}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
        <AppSelect
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val as SeoContentStatus | "all");
            setPage(1);
          }}
        >
          <AppSelectTrigger className="h-9 w-[140px]">
            <AppSelectValue placeholder={t("allStatuses")} />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="all">{t("allStatuses")}</AppSelectItem>
            {SEO_STATUS_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {t(opt.label)}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
        <AppSelect
          value={sort}
          onValueChange={(val) => {
            setSort(val);
            setPage(1);
          }}
        >
          <AppSelectTrigger className="h-9 w-[140px]">
            <AppSelectValue placeholder={t("updatedAt")} />
          </AppSelectTrigger>
          <AppSelectContent>
            {SEO_CONTENT_SORT_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {t(opt.label)}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
      </div>

      {isLoading ? (
        <AppLoadingState />
      ) : isError ? (
        <AppErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <AppEmptyState
          title={t("noContent")}
          description={t("noContentDescription")}
          action={
            <PermissionGuard permission="seo.create">
              <Link href={createHref ?? routes.seoContentNew}>
                <AppButton size="sm">
                  <Plus className="h-4 w-4" />
                  {createLabel ?? t("createContent")}
                </AppButton>
              </Link>
            </PermissionGuard>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <AppTable>
              <AppTableHeader>
                <AppTableRow>
                  <AppTableHead>{t("title")}</AppTableHead>
                  <AppTableHead>{t("type")}</AppTableHead>
                  <AppTableHead>{t("status")}</AppTableHead>
                  <AppTableHead>{t("health")}</AppTableHead>
                  <AppTableHead>{t("updatedAt")}</AppTableHead>
                  <AppTableHead className="text-end">{t("actions")}</AppTableHead>
                </AppTableRow>
              </AppTableHeader>
              <AppTableBody>
                {items.map((item) => (
                  <AppTableRow key={item.id}>
                    <AppTableCell className="max-w-[320px]">
                      <Link
                        href={routes.seoContentEdit.replace("[id]", item.id)}
                        className="block truncate font-medium text-foreground hover:text-primary"
                      >
                        {item.title}
                      </Link>
                      {item.publicPath ? (
                        <span dir="ltr" className="block truncate text-xs text-muted-foreground">
                          {item.publicPath}
                        </span>
                      ) : null}
                    </AppTableCell>
                    <AppTableCell>
                      <span className="text-sm">{t(SEO_CONTENT_TYPE_LABEL[item.contentType] ?? "article")}</span>
                    </AppTableCell>
                    <AppTableCell>
                      <SeoStatusBadge status={item.status} />
                    </AppTableCell>
                    <AppTableCell>
                      {item.score ? (
                        <SeoHealthBadge health={item.score.health} score={item.score.score} />
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("noHealth")}</span>
                      )}
                    </AppTableCell>
                    <AppTableCell>
                      <span className="text-sm text-muted-foreground">{formatDateTime(item.updatedAt)}</span>
                    </AppTableCell>
                    <AppTableCell className="text-end">
                      <SeoContentRowActions content={item} />
                    </AppTableCell>
                  </AppTableRow>
                ))}
              </AppTableBody>
            </AppTable>
          </div>

          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={routes.seoContentEdit.replace("[id]", item.id)}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {item.title}
                  </Link>
                  <SeoContentRowActions content={item} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t(SEO_CONTENT_TYPE_LABEL[item.contentType] ?? "article")}</span>
                  <SeoStatusBadge status={item.status} />
                  {item.score ? (
                    <SeoHealthBadge health={item.score.health} score={item.score.score} />
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.updatedAt)}</p>
              </div>
            ))}
          </div>

          {lastPage > 1 && (
            <AppPagination
              currentPage={data?.currentPage ?? 1}
              lastPage={lastPage}
              total={total}
              onPageChange={handlePageChange}
              className="mt-4"
            />
          )}
        </>
      )}
    </div>
  );
}

export { SeoContentList };
