"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, ClipboardList, Award, FileQuestion } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppButton,
} from "@/components/ui";
import { AppInput } from "@/components/ui/AppInput";
import {
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
} from "@/components/ui/AppSelect";
import { AppCheckbox } from "@/components/ui/AppCheckbox";
import { StudioSurfaceCard, StudioEmptyState, StudioChip } from "@/components/studio";
import { EXAM_STATUS_CONFIG, EXAM_STATUS_OPTIONS } from "@/features/exam-bank/constants";
import { useExams } from "@/features/exam-bank/hooks";
import type { Exam, ExamPickerResult, ExamStatus } from "@/features/exam-bank/types";

interface ExamPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (result: ExamPickerResult) => void;
  mode?: "single" | "multi";
  allowedStatuses?: ExamStatus[];
}

function ExamStatusChip({ status }: { status: ExamStatus }) {
  const config = EXAM_STATUS_CONFIG[status];
  const variant: "default" | "success" | "danger" =
    config.color === "success" ? "success" : config.color === "destructive" ? "danger" : "default";
  return (
    <StudioChip variant={variant} size="sm">
      {config.label}
    </StudioChip>
  );
}

function ExamPicker({
  open,
  onClose,
  onSelect,
  mode = "single",
  allowedStatuses,
}: ExamPickerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useExams({
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as ExamStatus) : undefined,
    perPage: 50,
  });

  const exams = useMemo(() => {
    const list = data?.data ?? [];
    if (!allowedStatuses || allowedStatuses.length === 0) return list;
    return list.filter((e) => allowedStatuses.includes(e.status));
  }, [data, allowedStatuses]);

  const handleSelect = useCallback(
    (exam: Exam) => {
      if (mode === "single") {
        onSelect({ id: exam.id, ids: [exam.id] });
        onClose();
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(exam.id)) next.delete(exam.id);
        else next.add(exam.id);
        return next;
      });
    },
    [mode, onSelect, onClose],
  );

  const handleConfirm = useCallback(() => {
    if (selectedIds.size > 0) {
      const ids = [...selectedIds];
      if (ids[0] !== undefined) onSelect({ id: ids[0], ids });
      onClose();
    }
  }, [selectedIds, onSelect, onClose]);

  return (
    <AppDialog open={open} onOpenChange={onClose}>
      <AppDialogContent className="max-w-5xl" style={{ maxHeight: "90vh" }}>
        <AppDialogHeader>
          <AppDialogTitle>اختيار اختبار</AppDialogTitle>
          <AppDialogDescription>ابحث واختر اختباراً من القائمة لإضافته للدرس.</AppDialogDescription>
        </AppDialogHeader>

        <div className="flex flex-col gap-3 pb-4 pt-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-fg-subtle" />
            <AppInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن اختبار..."
              className="ps-10"
            />
          </div>
          <div className="w-full sm:w-56">
            <AppSelect
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ExamStatus | "all")}
            >
              <AppSelectTrigger>
                <AppSelectValue placeholder="الحالة" />
              </AppSelectTrigger>
              <AppSelectContent>
                {EXAM_STATUS_OPTIONS.map((opt) => (
                  <AppSelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isError ? (
            <StudioEmptyState
              icon={<Search className="h-8 w-8" />}
              title="تعذّر تحميل الاختبارات"
              description="حدث خطأ أثناء جلب البيانات."
              action={
                <AppButton variant="outline" size="sm" onClick={() => refetch()}>
                  إعادة المحاولة
                </AppButton>
              }
            />
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-studio-soft" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <StudioEmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="لا توجد اختبارات"
              description="لم يتم العثور على اختبارات مطابقة لبحثك."
            />
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => {
                const selected = selectedIds.has(exam.id);
                return (
                  <StudioSurfaceCard
                    key={exam.id}
                    hoverable
                    padding="md"
                    onClick={() => handleSelect(exam)}
                    className={
                      mode === "multi" && selected
                        ? "ring-2 ring-studio-accent ring-offset-2 ring-offset-studio-bg"
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {mode === "multi" ? (
                          <AppCheckbox
                            checked={selected}
                            onCheckedChange={() => handleSelect(exam)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`تحديد ${exam.title}`}
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-studio-soft text-studio-fg-subtle">
                            <ClipboardList className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-studio-fg">{exam.title}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <ExamStatusChip status={exam.status} />
                            <span className="inline-flex items-center gap-1 text-xs text-studio-fg-subtle">
                              <FileQuestion className="h-3.5 w-3.5" />
                              {exam.questionCount} سؤال
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-studio-fg-subtle">
                              <Award className="h-3.5 w-3.5" />
                              {exam.totalPoints} نقطة
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </StudioSurfaceCard>
                );
              })}
            </div>
          )}
        </div>

        {mode === "multi" && (
          <div className="flex items-center justify-between border-t border-studio-border pt-4">
            <span className="text-sm text-studio-fg-muted">
              {selectedIds.size} {selectedIds.size === 1 ? "محدد" : "محددين"}
            </span>
            <div className="flex gap-3">
              <AppButton variant="outline" onClick={onClose}>
                إلغاء
              </AppButton>
              <AppButton onClick={handleConfirm} disabled={selectedIds.size === 0}>
                تأكيد الاختيار
              </AppButton>
            </div>
          </div>
        )}
      </AppDialogContent>
    </AppDialog>
  );
}

function useExamPicker() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    props: {
      open: isOpen,
      onClose: () => setIsOpen(false),
    } as const,
  };
}

export { ExamPicker, useExamPicker };
export type { ExamPickerProps, ExamPickerResult };
