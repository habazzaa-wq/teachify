"use client";

import { useCallback, useMemo, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileQuestion } from "lucide-react";
import { AppPagination, AppConfirmDialog } from "@/components/ui";
import { StudioButton, StudioEmptyState } from "@/components/studio";
import { cn } from "@/lib/cn";
import {
  useQuestions,
  useQuestionMetrics,
  useBulkQuestionAction,
  useDeleteQuestion,
  useDuplicateQuestion,
  useArchiveQuestion,
  usePublishQuestion,
} from "@/features/exam-bank/hooks";
import { DEFAULT_QUESTION_FILTERS } from "@/features/exam-bank/constants";
import type {
  Question,
  QuestionType,
  Difficulty,
  QuestionStatus,
  QuestionVisibility,
  QuestionFilterParams,
} from "@/features/exam-bank/types";
import { QuestionRow } from "./QuestionRow";
import { QuestionToolbar } from "./QuestionToolbar";
import { QuestionBulkBar } from "./QuestionBulkBar";
import { CreateQuestionDialog } from "./CreateQuestionDialog";
import { EditQuestionDialog } from "./EditQuestionDialog";
import { QuestionLoadingGrid } from "./QuestionLoadingState";

export function QuestionBank() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<QuestionVisibility | "all">("all");
  const [sort, setSort] = useState(DEFAULT_QUESTION_FILTERS.sort ?? "created_at");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const lastIndexRef = useRef<number | null>(null);

  const filters: QuestionFilterParams = useMemo(
    () => ({
      ...DEFAULT_QUESTION_FILTERS,
      search: search || undefined,
      type: typeFilter,
      difficulty: difficultyFilter,
      status: statusFilter,
      visibility: visibilityFilter,
      sort,
      page,
      perPage: 24,
    }),
    [search, typeFilter, difficultyFilter, statusFilter, visibilityFilter, sort, page],
  );

  const { data, isLoading } = useQuestions(filters);
  const { data: metrics } = useQuestionMetrics();
  const bulkAction = useBulkQuestionAction();
  const deleteQuestion = useDeleteQuestion();
  const duplicateQuestion = useDuplicateQuestion();
  const archiveQuestion = useArchiveQuestion();
  const publishQuestion = usePublishQuestion();

  const questions = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.lastPage ?? 1;

  const resetFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("all");
    setDifficultyFilter("all");
    setStatusFilter("all");
    setVisibilityFilter("all");
    setSort("created_at");
    setPage(1);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastIndexRef.current = null;
  }, []);

  const handleToggle = useCallback(
    (id: string, index: number, selected: boolean, e?: MouseEvent) => {
      const next = new Set(selectedIds);
      const shift = !!e?.shiftKey;
      const ctrl = !!e?.ctrlKey || !!e?.metaKey;
      if (shift && lastIndexRef.current !== null) {
        const lo = Math.min(lastIndexRef.current, index);
        const hi = Math.max(lastIndexRef.current, index);
        for (let i = lo; i <= hi; i++) {
          const q = questions[i];
          if (q) next.add(q.id);
        }
      } else if (ctrl) {
        if (selected) next.delete(id);
        else next.add(id);
      } else {
        if (next.has(id) && next.size === 1) next.delete(id);
        else {
          next.clear();
          next.add(id);
        }
      }
      lastIndexRef.current = index;
      setSelectedIds(next);
    },
    [questions, selectedIds],
  );

  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const numericIds = useMemo(() => selectedIdsArray.map((id) => Number(id)), [selectedIdsArray]);

  const handleBulk = useCallback(
    (op: "duplicate" | "archive" | "delete" | "restore") => {
      if (numericIds.length === 0) return;
      bulkAction.mutate(
        { type: op, ids: numericIds },
        { onSuccess: clearSelection },
      );
    },
    [numericIds, bulkAction, clearSelection],
  );

  const handleBulkMove = useCallback(
    (categoryId: string) => {
      if (numericIds.length === 0) return;
      bulkAction.mutate(
        { type: "move", ids: numericIds, categoryId: Number(categoryId) },
        { onSuccess: clearSelection },
      );
    },
    [numericIds, bulkAction, clearSelection],
  );

  const metricsText = useMemo(() => {
    if (!metrics) return null;
    return `إجمالي ${metrics.total} سؤال · ${metrics.published} منشور · ${metrics.draft} مسودة · ${metrics.archived} مؤرشف`;
  }, [metrics]);

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-studio-fg">بنك الأسئلة</h1>
          {metricsText && (
            <p className="mt-1 text-sm text-studio-fg-muted">{metricsText}</p>
          )}
        </div>
        {selectedIds.size > 0 && (
          <StudioButton variant="soft" size="sm" onClick={clearSelection}>
            إلغاء التحديد ({selectedIds.size})
          </StudioButton>
        )}
      </div>

      <QuestionToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        typeFilter={typeFilter}
        onTypeChange={(v) => {
          setTypeFilter(v);
          setPage(1);
        }}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={(v) => {
          setDifficultyFilter(v);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        visibilityFilter={visibilityFilter}
        onVisibilityChange={(v) => {
          setVisibilityFilter(v);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(v) => {
          setSort(v);
          setPage(1);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreate={() => setCreateOpen(true)}
        totalCount={total}
      />

      <AnimatePresence mode="popLayout">
        {isLoading ? (
          <QuestionLoadingGrid key="loading" viewMode={viewMode} />
        ) : questions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-10"
          >
            <StudioEmptyState
              icon={<FileQuestion className="h-8 w-8" />}
              title="لا توجد أسئلة"
              description="ابدأ بإنشاء سؤال جديد أو عدّل عوامل التصفية."
              action={
                <StudioButton onClick={() => setCreateOpen(true)} className="gap-2">
                  إنشاء سؤال
                </StudioButton>
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "flex flex-col gap-3",
            )}
          >
            <AnimatePresence mode="popLayout">
              {questions.map((question, index) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  selected={selectedIds.has(question.id)}
                  selectable
                  onClick={(q) => setEditId(q.id)}
                  onToggleSelect={(selected, e) =>
                    handleToggle(question.id, index, selected, e)
                  }
                  onDuplicate={(q) => duplicateQuestion.mutate(q.id)}
                  onArchive={(q) => archiveQuestion.mutate(q.id)}
                  onPublish={(q) => publishQuestion.mutate(q.id)}
                  onDelete={(q) => setPendingDeleteId(q.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && total > (filters.perPage ?? 24) && (
        <div className="pt-2">
          <AppPagination
            currentPage={page}
            lastPage={lastPage}
            total={total}
            onPageChange={setPage}
          />
        </div>
      )}

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <QuestionBulkBar
            count={selectedIds.size}
            onDuplicate={() => handleBulk("duplicate")}
            onArchive={() => handleBulk("archive")}
            onDelete={() => handleBulk("delete")}
            onRestore={() => handleBulk("restore")}
            onMoveCategory={handleBulkMove}
            onClear={clearSelection}
          />
        )}
      </AnimatePresence>

      <CreateQuestionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
        }}
      />

      <EditQuestionDialog
        questionId={editId}
        open={editId !== null}
        onOpenChange={(o) => {
          if (!o) setEditId(null);
        }}
      />

      <AppConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDeleteId(null);
        }}
        title="حذف السؤال"
        description="هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        destructive
        loading={deleteQuestion.isPending}
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteQuestion.mutate(pendingDeleteId, {
              onSettled: () => setPendingDeleteId(null),
            });
          }
        }}
      />
    </div>
  );
}
