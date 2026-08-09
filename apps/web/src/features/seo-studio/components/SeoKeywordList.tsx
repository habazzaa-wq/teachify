"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  AppBadge,
  AppButton,
  AppEmptyState,
  AppErrorState,
  AppInput,
  AppLoadingState,
  AppModal,
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
  AppTextarea,
  Label,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { useCan } from "@/hooks/useCan";
import {
  useCreateSeoKeyword,
  useDeleteSeoKeyword,
  useSeoKeywords,
  useUpdateSeoKeyword,
} from "../hooks";
import {
  SEO_KEYWORD_SORT_OPTIONS,
  SEO_KEYWORD_TYPE_LABEL,
  SEO_KEYWORD_TYPE_OPTIONS,
  SEO_PAGE_SIZE,
  SEO_SEARCH_INTENT_LABEL,
  SEO_SEARCH_INTENT_OPTIONS,
} from "../constants";
import type {
  SeoKeyword,
  SeoKeywordType,
  SeoSearchIntent,
} from "../types";

const KEYWORD_TYPE_VARIANT: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "destructive"> = {
  focus: "success",
  related: "secondary",
  long_tail: "warning",
};

interface KeywordFormState {
  keyword: string;
  keywordType: SeoKeywordType;
  searchIntent: SeoSearchIntent | "";
  notes: string;
}

const EMPTY_FORM: KeywordFormState = {
  keyword: "",
  keywordType: "related",
  searchIntent: "",
  notes: "",
};

function SeoKeywordList() {
  const t = useTranslations("seo");
  const canCreate = useCan("seo.create");
  const canUpdate = useCan("seo.update");
  const canDelete = useCan("seo.delete");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SeoKeywordType | "all">("all");
  const [intentFilter, setIntentFilter] = useState<SeoSearchIntent | "all">("all");
  const [sort, setSort] = useState("created_at");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SeoKeyword | null>(null);
  const [form, setForm] = useState<KeywordFormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<SeoKeyword | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useSeoKeywords({
    search: debouncedSearch || undefined,
    keyword_type: typeFilter,
    search_intent: intentFilter,
    sort: sort as "created_at",
    sort_dir: "desc",
    page,
    per_page: SEO_PAGE_SIZE,
  });

  const createMutation = useCreateSeoKeyword();
  const updateMutation = useUpdateSeoKeyword();
  const deleteMutation = useDeleteSeoKeyword();

  const items = data?.data ?? [];
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (keyword: SeoKeyword) => {
    setEditing(keyword);
    setForm({
      keyword: keyword.keyword,
      keywordType: keyword.keywordType,
      searchIntent: keyword.searchIntent ?? "",
      notes: keyword.notes ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.keyword.trim()) {
      toast.error(t("keywordRequired"));
      return;
    }
    const payload = {
      keyword: form.keyword.trim(),
      keyword_type: form.keywordType,
      search_intent: form.searchIntent || null,
      notes: form.notes.trim() || null,
    };

    const onDone = () => {
      toast.success(t("saveSuccess"));
      setModalOpen(false);
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload }, { onSuccess: onDone });
    } else {
      createMutation.mutate(payload, { onSuccess: onDone });
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("deleteSuccess"));
        setDeleting(null);
      },
    });
  };

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div>
      <AppPageHeader
        title={t("keywords")}
        description={t("keywordsDescription")}
        actions={
          canCreate ? (
            <AppButton onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("createKeyword")}
            </AppButton>
          ) : null
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
            setTypeFilter(val as SeoKeywordType | "all");
            setPage(1);
          }}
        >
          <AppSelectTrigger className="h-9 w-[150px]">
            <AppSelectValue placeholder={t("allKeywords")} />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="all">{t("allKeywords")}</AppSelectItem>
            {SEO_KEYWORD_TYPE_OPTIONS.map((opt) => (
              <AppSelectItem key={opt.value} value={opt.value}>
                {t(opt.label)}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
        <AppSelect
          value={intentFilter}
          onValueChange={(val) => {
            setIntentFilter(val as SeoSearchIntent | "all");
            setPage(1);
          }}
        >
          <AppSelectTrigger className="h-9 w-[150px]">
            <AppSelectValue placeholder={t("allIntents")} />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="all">{t("allIntents")}</AppSelectItem>
            {SEO_SEARCH_INTENT_OPTIONS.map((opt) => (
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
            <AppSelectValue placeholder={t("createdAt")} />
          </AppSelectTrigger>
          <AppSelectContent>
            {SEO_KEYWORD_SORT_OPTIONS.map((opt) => (
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
        <AppEmptyState title={t("noKeywords")} description={t("keywordsDescription")} />
      ) : (
        <>
          <div className="hidden md:block">
            <AppTable>
              <AppTableHeader>
                <AppTableRow>
                  <AppTableHead>{t("keyword")}</AppTableHead>
                  <AppTableHead>{t("keywordType")}</AppTableHead>
                  <AppTableHead>{t("searchIntent")}</AppTableHead>
                  <AppTableHead>{t("linkTarget")}</AppTableHead>
                  <AppTableHead>{t("createdAt")}</AppTableHead>
                  <AppTableHead className="text-end">{t("actions")}</AppTableHead>
                </AppTableRow>
              </AppTableHeader>
              <AppTableBody>
                {items.map((item) => (
                  <AppTableRow key={item.id}>
                    <AppTableCell className="max-w-[240px]">
                      <span className="font-medium">{item.keyword}</span>
                      {item.notes ? (
                        <p className="truncate text-xs text-muted-foreground">{item.notes}</p>
                      ) : null}
                    </AppTableCell>
                    <AppTableCell>
                      <AppBadge variant={KEYWORD_TYPE_VARIANT[item.keywordType] ?? "secondary"}>
                        {t(SEO_KEYWORD_TYPE_LABEL[item.keywordType] ?? "related")}
                      </AppBadge>
                    </AppTableCell>
                    <AppTableCell>
                      {item.searchIntent ? (
                        <span className="text-sm">{t(SEO_SEARCH_INTENT_LABEL[item.searchIntent] ?? item.searchIntent)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </AppTableCell>
                    <AppTableCell>
                      {item.seoContent ? (
                        <span className="block max-w-[220px] truncate text-sm text-muted-foreground">
                          {item.seoContent.title}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </AppTableCell>
                    <AppTableCell>
                      <span className="text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                    </AppTableCell>
                    <AppTableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <AppButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </AppButton>
                        )}
                        {canDelete && (
                          <AppButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </AppButton>
                        )}
                      </div>
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
                  <span className="font-medium">{item.keyword}</span>
                  {canUpdate && (
                    <AppButton
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </AppButton>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <AppBadge variant={KEYWORD_TYPE_VARIANT[item.keywordType] ?? "secondary"}>
                    {t(SEO_KEYWORD_TYPE_LABEL[item.keywordType] ?? "related")}
                  </AppBadge>
                  {item.searchIntent ? (
                    <span>{t(SEO_SEARCH_INTENT_LABEL[item.searchIntent] ?? item.searchIntent)}</span>
                  ) : null}
                </div>
                {item.seoContent ? (
                  <p className="mt-2 truncate text-xs text-muted-foreground">{item.seoContent.title}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
          </div>

          {lastPage > 1 && (
            <AppPagination
              currentPage={data?.currentPage ?? 1}
              lastPage={lastPage}
              total={total}
              onPageChange={setPage}
              className="mt-4"
            />
          )}
        </>
      )}

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? t("editKeyword") : t("createKeyword")}
        footer={
          <>
            <AppButton variant="outline" onClick={() => setModalOpen(false)}>
              {t("cancel")}
            </AppButton>
            <AppButton onClick={handleSubmit} disabled={pending}>
              {t("saveChanges")}
            </AppButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("keyword")}</Label>
            <AppInput
              value={form.keyword}
              onChange={(e) => setForm((prev) => ({ ...prev, keyword: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("keywordType")}</Label>
            <AppSelect
              value={form.keywordType}
              onValueChange={(val) => setForm((prev) => ({ ...prev, keywordType: val as SeoKeywordType }))}
            >
              <AppSelectTrigger>
                <AppSelectValue />
              </AppSelectTrigger>
              <AppSelectContent>
                {SEO_KEYWORD_TYPE_OPTIONS.map((opt) => (
                  <AppSelectItem key={opt.value} value={opt.value}>
                    {t(opt.label)}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("searchIntent")}</Label>
            <AppSelect
              value={form.searchIntent}
              onValueChange={(val) => setForm((prev) => ({ ...prev, searchIntent: val as SeoSearchIntent | "" }))}
            >
              <AppSelectTrigger>
                <AppSelectValue placeholder={t("allIntents")} />
              </AppSelectTrigger>
              <AppSelectContent>
                <AppSelectItem value="">{t("allIntents")}</AppSelectItem>
                {SEO_SEARCH_INTENT_OPTIONS.map((opt) => (
                  <AppSelectItem key={opt.value} value={opt.value}>
                    {t(opt.label)}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("notes")}</Label>
            <AppTextarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
      </AppModal>

      <AppModal
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={t("deleteKeyword")}
        description={deleting ? t("keywordDeleteConfirm") : undefined}
        footer={
          <>
            <AppButton variant="outline" onClick={() => setDeleting(null)}>
              {t("cancel")}
            </AppButton>
            <AppButton variant="destructive" onClick={handleDelete} disabled={pending}>
              {t("deleteContent")}
            </AppButton>
          </>
        }
      />
    </div>
  );
}

export { SeoKeywordList };
