"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Plus, FilePlus2, SearchX } from "lucide-react";
import { StudioButton, StudioChip, StudioWorkspaceHeader } from "@/components/studio";
import { cn } from "@/lib/cn";
import {
  useExams,
  useExamMetrics,
  usePinnedExams,
  useFavoriteExams,
  useRecentExams,
  useBulkExamAction,
  useTogglePinnedExam,
  useToggleFavoriteExam,
  useCreateExam,
  useDuplicateExam,
  useArchiveExam,
  usePublishExam,
  useDeleteExam,
} from "@/features/exam-bank/hooks";
import type { Exam, ExamStatus, ExamVisibility, ViewMode, ExamFilterParams } from "@/features/exam-bank/types";
import { ExamGrid } from "./ExamGrid";
import { ExamToolbar } from "./ExamToolbar";
import { ExamBulkBar } from "./ExamBulkBar";
import { CreateExamDialog } from "./CreateExamDialog";
import { ExamErrorState } from "./ExamErrorState";
import { ExamLoadingGrid } from "./ExamLoadingState";
import { ExamEmptyState } from "./ExamEmptyState";

type QuickFilter = "all" | "pinned" | "recent" | "draft" | "published" | "archived" | "favorites";

const PILLS: { key: QuickFilter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pinned", label: "مثبّتة" },
  { key: "recent", label: "أحدث" },
  { key: "draft", label: "مسودة" },
  { key: "published", label: "منشورة" },
  { key: "archived", label: "مؤرشفة" },
  { key: "favorites", label: "المفضلة" },
];

function SectionShell({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-studio-fg">{title}</h2>
        {count !== undefined ? (
          <StudioChip variant="default" className="px-2 py-0.5 text-[11px]">
            {count}
          </StudioChip>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ExamHome() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<ExamVisibility | "all">("all");
  const [sort, setSort] = useState<string>("updated_at");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  const togglePin = useTogglePinnedExam();
  const toggleFavorite = useToggleFavoriteExam();
  const duplicateExam = useDuplicateExam();
  const archiveExam = useArchiveExam();
  const publishExam = usePublishExam();
  const deleteExam = useDeleteExam();
  const bulkAction = useBulkExamAction();
  const createExam = useCreateExam();

  const statusFilter: ExamStatus | "all" =
    activeFilter === "draft" || activeFilter === "published" || activeFilter === "archived"
      ? activeFilter
      : "all";

  const buildParams = useCallback(
    (status?: ExamStatus): ExamFilterParams => ({
      search: search.trim() || undefined,
      status,
      visibility: visibilityFilter === "all" ? undefined : visibilityFilter,
      sort,
      sortDir: "desc",
      perPage: 60,
    }),
    [search, visibilityFilter, sort],
  );

  const metricsQuery = useExamMetrics();
  const pinnedQuery = usePinnedExams();
  const recentQuery = useRecentExams();
  const favoritesQuery = useFavoriteExams();
  const draftQuery = useExams(buildParams("draft"));
  const publishedQuery = useExams(buildParams("published"));
  const archivedQuery = useExams(buildParams("archived"));

  const applySearch = useCallback(
    (list: Exam[] | undefined): Exam[] => {
      const items = list ?? [];
      const q = search.trim().toLowerCase();
      if (!q) return items;
      return items.filter((e) => e.title.toLowerCase().includes(q));
    },
    [search],
  );

  const pinnedExams = useMemo(() => applySearch(pinnedQuery.data), [applySearch, pinnedQuery.data]);
  const recentExams = useMemo(() => applySearch(recentQuery.data), [applySearch, recentQuery.data]);
  const favoriteExams = useMemo(() => applySearch(favoritesQuery.data), [applySearch, favoritesQuery.data]);

  const metrics = metricsQuery.data;
  const total = Number(metrics?.total ?? 0);

  const showAll = activeFilter === "all";
  const showSection = (key: QuickFilter) => showAll || activeFilter === key;

  const handleExamClick = useCallback(
    (exam: Exam) => router.push(`/teacher/exams/${exam.id}`),
    [router],
  );

  const handleStatusFilterChange = (value: ExamStatus | "all") => {
    if (value === "all") setActiveFilter("all");
    else setActiveFilter(value);
  };

  const handleSelectionChange = useCallback((ids: Set<string>) => setSelectedIds(ids), []);

  const handleBulk = useCallback(
    (type: "delete" | "archive" | "duplicate" | "publish") => {
      const ids = Array.from(selectedIds).map(Number);
      if (ids.length === 0) return;
      bulkAction.mutate(
        { type, ids },
        { onSuccess: () => setSelectedIds(new Set()) },
      );
    },
    [selectedIds, bulkAction],
  );

  const handleCreate = useCallback(
    (exam: Exam) => router.push(`/teacher/exams/${exam.id}`),
    [router],
  );

  const statsText = metrics
    ? [
        `إجمالي ${total} اختبار`,
        `${Number(metrics.published ?? 0)} منشورة`,
        `${Number(metrics.draft ?? 0)} مسودة`,
        `${Number(metrics.archived ?? 0)} مؤرشفة`,
        `${Number(metrics.pinned ?? 0)} مثبّتة`,
      ].join(" · ")
    : "";

  const renderStatusSection = (
    title: string,
    key: QuickFilter,
    query: ReturnType<typeof useExams>,
  ) => {
    if (!showSection(key)) return null;
    const exams = query.data?.data ?? [];
    if (query.isLoading) {
      return (
        <SectionShell title={title}>
          <ExamLoadingGrid viewMode={viewMode} />
        </SectionShell>
      );
    }
    if (query.isError) {
      return (
        <SectionShell title={title}>
          <ExamErrorState onRetry={() => query.refetch()} />
        </SectionShell>
      );
    }
    if (exams.length === 0) {
      if (showAll) return null;
      return (
        <SectionShell title={title}>
          <ExamEmptyState icon={SearchX} title="لا توجد اختبارات" description="لا توجد نتائج مطابقة لهذا التصفية." />
        </SectionShell>
      );
    }
    return (
      <SectionShell title={title} count={exams.length}>
        <ExamGrid
          exams={exams}
          viewMode={viewMode}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onExamClick={handleExamClick}
          onTogglePin={(id) => togglePin.mutate(id)}
          onToggleFavorite={(id) => toggleFavorite.mutate(id)}
          onDuplicate={(id) => duplicateExam.mutate(id)}
          onArchive={(id) => archiveExam.mutate(id)}
          onDelete={(id) => deleteExam.mutate(id)}
          onPublish={(id) => publishExam.mutate(id)}
        />
      </SectionShell>
    );
  };

  const renderSimpleSection = (
    title: string,
    key: QuickFilter,
    exams: Exam[],
    query: { isLoading: boolean; isError: boolean; refetch: () => void },
  ) => {
    if (!showSection(key)) return null;
    if (query.isLoading) {
      return (
        <SectionShell title={title}>
          <ExamLoadingGrid viewMode={viewMode} count={4} />
        </SectionShell>
      );
    }
    if (query.isError) {
      return (
        <SectionShell title={title}>
          <ExamErrorState onRetry={() => query.refetch()} />
        </SectionShell>
      );
    }
    if (exams.length === 0) {
      if (showAll) return null;
      return (
        <SectionShell title={title}>
          <ExamEmptyState icon={SearchX} title="لا توجد اختبارات" description="لا توجد نتائج مطابقة لهذا التصفية." />
        </SectionShell>
      );
    }
    return (
      <SectionShell title={title} count={exams.length}>
        <ExamGrid
          exams={exams}
          viewMode={viewMode}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onExamClick={handleExamClick}
          onTogglePin={(id) => togglePin.mutate(id)}
          onToggleFavorite={(id) => toggleFavorite.mutate(id)}
          onDuplicate={(id) => duplicateExam.mutate(id)}
          onArchive={(id) => archiveExam.mutate(id)}
          onDelete={(id) => deleteExam.mutate(id)}
          onPublish={(id) => publishExam.mutate(id)}
        />
      </SectionShell>
    );
  };

  const isInitialLoading =
    metricsQuery.isLoading ||
    (showAll && draftQuery.isLoading && publishedQuery.isLoading && archivedQuery.isLoading);

  const anyLoading =
    draftQuery.isLoading ||
    publishedQuery.isLoading ||
    archivedQuery.isLoading ||
    pinnedQuery.isLoading ||
    recentQuery.isLoading ||
    favoritesQuery.isLoading ||
    metricsQuery.isLoading;

  const anyError =
    draftQuery.isError ||
    publishedQuery.isError ||
    archivedQuery.isError ||
    pinnedQuery.isError ||
    recentQuery.isError ||
    favoritesQuery.isError;

  const visibleCount =
    (draftQuery.data?.data.length ?? 0) +
    (publishedQuery.data?.data.length ?? 0) +
    (archivedQuery.data?.data.length ?? 0) +
    pinnedExams.length +
    recentExams.length +
    favoriteExams.length;

  return (
    <div className="min-h-screen bg-studio-bg text-studio-fg">
      <StudioWorkspaceHeader
        left={
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold text-studio-fg">مكتبة الاختبارات</h1>
            {statsText ? (
              <p className="text-xs text-studio-fg-muted">{statsText}</p>
            ) : null}
          </div>
        }
        right={
          <StudioButton variant="primary" onClick={() => setCreateOpen(true)} icon={<Plus className="h-4 w-4" />}>
            إنشاء اختبار
          </StudioButton>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
        <ExamToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={handleStatusFilterChange}
          visibilityFilter={visibilityFilter}
          onVisibilityChange={setVisibilityFilter}
          sort={sort}
          onSortChange={setSort}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreate={() => setCreateOpen(true)}
          totalCount={total}
        />

        {/* Quick filter pills */}
        <div className="flex flex-wrap items-center gap-2 py-4">
          {PILLS.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setActiveFilter(pill.key)}
              className="focus:outline-none"
              aria-pressed={activeFilter === pill.key}
            >
              <StudioChip
                variant={activeFilter === pill.key ? "accent" : "default"}
                className={cn("cursor-pointer px-3 py-1 text-xs", activeFilter === pill.key && "shadow-sm")}
              >
                {pill.label}
              </StudioChip>
            </button>
          ))}
        </div>

        {/* Global empty (no exams at all) */}
        {!isInitialLoading && metrics && total === 0 ? (
          <ExamEmptyState
            icon={FilePlus2}
            title="لا توجد اختبارات بعد"
            description="ابدأ بإنشاء أول اختبار في مكتبة الاختبارات الخاصة بك."
            action={
              <StudioButton variant="primary" onClick={() => setCreateOpen(true)} icon={<Plus className="h-4 w-4" />}>
                إنشاء اختبار
              </StudioButton>
            }
          />
        ) : anyError && !showAll ? (
          <ExamErrorState
            onRetry={() => {
              draftQuery.refetch();
              publishedQuery.refetch();
              archivedQuery.refetch();
              pinnedQuery.refetch();
              recentQuery.refetch();
              favoritesQuery.refetch();
              metricsQuery.refetch();
            }}
          />
        ) : isInitialLoading ? (
          <div className="space-y-6 pt-2">
            <ExamLoadingGrid viewMode={viewMode} count={8} />
          </div>
        ) : (
          <div className="space-y-8 pt-2">
            {renderSimpleSection("مثبّتة", "pinned", pinnedExams, pinnedQuery)}
            {renderSimpleSection("أحدث الاختبارات", "recent", recentExams, recentQuery)}
            {renderStatusSection("مسودة", "draft", draftQuery)}
            {renderStatusSection("منشورة", "published", publishedQuery)}
            {renderStatusSection("مؤرشفة", "archived", archivedQuery)}
            {renderSimpleSection("المفضلة", "favorites", favoriteExams, favoritesQuery)}

            {showAll && !anyLoading && visibleCount === 0 ? (
              <ExamEmptyState
                icon={SearchX}
                title="لا توجد نتائج"
                description="لم يتم العثور على اختبارات مطابقة لبحثك أو عوامل التصفية."
              />
            ) : null}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 ? (
          <ExamBulkBar
            count={selectedIds.size}
            onDuplicate={() => handleBulk("duplicate")}
            onArchive={() => handleBulk("archive")}
            onDelete={() => handleBulk("delete")}
            onPublish={() => handleBulk("publish")}
            onClear={() => setSelectedIds(new Set())}
          />
        ) : null}
      </AnimatePresence>

      <CreateExamDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreate} />
    </div>
  );
}

export default ExamHome;
