"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, RotateCcw, Plus, Layers, Search, X } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogDescription,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogTitle,
  PermissionGuard,
} from "@/components/ui";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import {
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
} from "@/components/ui/AppSelect";
import { AppPagination } from "@/components/ui/AppPagination";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  StudioButton,
  StudioSurfaceCard,
  StudioStatusChip,
  StudioEmptyState,
} from "@/components/studio";
import { cn } from "@/lib/cn";
import { studioAnimationVariants } from "@/components/studio";
import { CATEGORY_STATUS_CONFIG } from "@/features/exam-bank/constants";
import {
  useCategories,
  useDeleteCategory,
  useRestoreCategory,
} from "@/features/exam-bank/hooks";
import type { CategoryStatus, QuestionCategory } from "@/features/exam-bank/types";
import { CreateCategoryDialog } from "./CreateCategoryDialog";

const STATUS_OPTIONS: { value: CategoryStatus | "all"; label: string }[] = [
  { value: "all", label: "جميع الحالات" },
  { value: "active", label: CATEGORY_STATUS_CONFIG.active.label },
  { value: "inactive", label: CATEGORY_STATUS_CONFIG.inactive.label },
  { value: "archived", label: CATEGORY_STATUS_CONFIG.archived.label },
];

export function CategoriesTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<QuestionCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestionCategory | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<QuestionCategory | null>(null);

  const { data, isLoading, isError, refetch } = useCategories({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    perPage: 24,
  });

  const deleteMutation = useDeleteCategory();
  const restoreMutation = useRestoreCategory();

  const categories = useMemo(() => data?.data ?? [], [data]);
  const isBulkDeleting = deleteMutation.isPending;
  const isBulkRestoring = restoreMutation.isPending;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === categories.length ? new Set() : new Set(categories.map((c) => c.id)),
    );
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedIds(new Set());
  };

  const handleBulkRestore = async () => {
    for (const id of selectedIds) {
      await restoreMutation.mutateAsync(id);
    }
    setSelectedIds(new Set());
  };

  const openCreate = () => {
    setEditCategory(null);
    setDialogOpen(true);
  };

  const openEdit = (category: QuestionCategory) => {
    setEditCategory(category);
    setDialogOpen(true);
  };

  const allSelected = categories.length > 0 && selectedIds.size === categories.length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-studio-fg">فئات الأسئلة</h2>
          <p className="mt-1 text-sm text-studio-fg-muted">
            نظّم أسئلتك ضمن فئات منطقية لسهولة الوصول وإعادة الاستخدام.
          </p>
        </div>
        <StudioButton variant="primary" size="md" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          فئة جديدة
        </StudioButton>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-fg-subtle" />
          <AppInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث عن فئة..."
            className="ps-10"
          />
        </div>
        <div className="w-full sm:w-56">
          <AppSelect
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as CategoryStatus | "all");
              setPage(1);
            }}
          >
            <AppSelectTrigger>
              <AppSelectValue placeholder="الحالة" />
            </AppSelectTrigger>
            <AppSelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <motion.div
          initial={studioAnimationVariants.fadeInDown.initial}
          animate={studioAnimationVariants.fadeInDown.animate}
          className="flex items-center justify-between rounded-lg border border-studio-accent-border bg-studio-accent-soft px-4 py-3"
        >
          <span className="text-sm font-medium text-studio-accent">
            تم تحديد {selectedIds.size} {selectedIds.size === 1 ? "فئة" : "فئات"}
          </span>
          <div className="flex items-center gap-2">
            <StudioButton
              variant="soft"
              size="sm"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={handleBulkRestore}
              loading={isBulkRestoring}
            >
              استرجاع
            </StudioButton>
            <StudioButton
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={handleBulkDelete}
              loading={isBulkDeleting}
            >
              حذف
            </StudioButton>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-md p-1.5 text-studio-fg-muted transition-colors hover:bg-studio-soft"
              aria-label="إلغاء التحديد"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <CategoryGridSkeleton />
      ) : isError ? (
        <StudioEmptyState
          icon={<Search className="h-8 w-8" />}
          title="تعذّر تحميل الفئات"
          description="حدث خطأ أثناء جلب البيانات."
          action={
            <StudioButton variant="soft" size="sm" onClick={() => refetch()}>
              إعادة المحاولة
            </StudioButton>
          }
        />
      ) : categories.length === 0 ? (
        <StudioEmptyState
          icon={<Layers className="h-8 w-8" />}
          title={search || statusFilter !== "all" ? "لا توجد نتائج" : "لا توجد فئات بعد"}
          description={
            search || statusFilter !== "all"
              ? "جرّب تعديل معايير البحث أو التصفية."
              : "ابدأ بإنشاء أول فئة لتنظيم أسئلتك."
          }
          action={
            !search && statusFilter === "all" ? (
              <StudioButton variant="soft" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                فئة جديدة
              </StudioButton>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-studio-fg-muted">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 accent-studio-accent"
              />
              تحديد الكل
            </label>
          </div>
          <motion.div
            variants={studioAnimationVariants.fadeInUp}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((category) => {
              const selected = selectedIds.has(category.id);
              const isArchived = category.status === "archived";
              return (
                <StudioSurfaceCard
                  key={category.id}
                  hoverable
                  padding="md"
                  className={cn(
                    "relative",
                    selected && "ring-2 ring-studio-accent ring-offset-2 ring-offset-studio-bg",
                  )}
                  onClick={() => toggleSelect(category.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {category.color ? (
                        <span
                          className="h-9 w-9 shrink-0 rounded-lg"
                          style={{ backgroundColor: category.color }}
                          aria-hidden
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-soft text-studio-fg-subtle">
                          <Layers className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-studio-fg">{category.name}</h3>
                        <StudioStatusChip status={category.status} />
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelect(category.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 accent-studio-accent"
                      aria-label={`تحديد ${category.name}`}
                    />
                  </div>

                  {category.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-studio-fg-muted">
                      {category.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-studio-fg-subtle">
                      {category.questionCount ?? 0} سؤال
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(category);
                        }}
                        className="rounded-md p-1.5 text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
                        aria-label={`تعديل ${category.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isArchived ? (
                        <PermissionGuard permission="question-categories.restore">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRestoreTarget(category);
                            }}
                            className="rounded-md p-1.5 text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-accent"
                            aria-label={`استرجاع ${category.name}`}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                      ) : (
                        <PermissionGuard permission="question-categories.delete">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(category);
                            }}
                            className="rounded-md p-1.5 text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-danger"
                            aria-label={`حذف ${category.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                      )}
                    </div>
                  </div>
                </StudioSurfaceCard>
              );
            })}
          </motion.div>

          {data && data.lastPage > 1 && (
            <div className="pt-4">
              <AppPagination
                currentPage={data.currentPage}
                lastPage={data.lastPage}
                total={data.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <CreateCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editCategory={editCategory}
        onCreated={() => {
          setSelectedIds(new Set());
        }}
      />

      <AppConfirmDelete
        open={deleteTarget !== null}
        title="حذف الفئة"
        description={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ يمكنك استرجاعها لاحقاً.`}
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(deleteTarget.id);
              return next;
            });
          }
          setDeleteTarget(null);
        }}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      />

      <AppConfirmDelete
        open={restoreTarget !== null}
        title="استرجاع الفئة"
        description={`هل تريد استرجاع "${restoreTarget?.name}"؟`}
        confirmLabel="استرجاع"
        loading={restoreMutation.isPending}
        onConfirm={async () => {
          if (restoreTarget) {
            await restoreMutation.mutateAsync(restoreTarget.id);
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(restoreTarget.id);
              return next;
            });
          }
          setRestoreTarget(null);
        }}
        onOpenChange={(o) => {
          if (!o) setRestoreTarget(null);
        }}
      />
    </div>
  );
}

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

function AppConfirmDelete({
  open,
  title,
  description,
  confirmLabel = "حذف",
  loading,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <AppDialogTitle>{title}</AppDialogTitle>
          <AppDialogDescription>{description}</AppDialogDescription>
        </AppDialogHeader>
        <AppDialogFooter className="mt-6 gap-2">
          <AppButton variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </AppButton>
          <AppButton
            variant="destructive"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}
