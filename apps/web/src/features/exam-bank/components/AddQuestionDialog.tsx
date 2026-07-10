"use client";

import { useMemo, useState } from "react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppDialogFooter,
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppCheckbox,
} from "@/components/ui";
import { StudioButton, StudioChip } from "@/components/studio";
import { cn } from "@/lib/cn";
import { useQuestions, useAddExamQuestion } from "@/features/exam-bank/hooks";
import { QUESTION_TYPE_CONFIG, QUESTION_TYPE_OPTIONS } from "@/features/exam-bank/constants";
import type { Question, QuestionType } from "@/features/exam-bank/types";
import { toast } from "sonner";

interface AddQuestionDialogProps {
  examId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: () => void;
}

export function AddQuestionDialog({ examId, open, onOpenChange, onAdded }: AddQuestionDialogProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuestions(
    open ? { search: search || undefined, type: (type === "all" ? undefined : (type as QuestionType)) } : undefined,
  );
  const questions: Question[] = data?.data ?? [];

  const addQuestion = useAddExamQuestion();

  const results = useMemo(() => questions, [questions]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      await Promise.all(
        ids.map((id) =>
          addQuestion.mutateAsync({ id: examId, payload: { question_id: Number(id) } }),
        ),
      );
      toast.success(`تمت إضافة ${ids.length} سؤال للاختبار`);
      setSelectedIds(new Set());
      onOpenChange(false);
      onAdded?.();
    } catch {
      toast.error("فشل إضافة الأسئلة");
    }
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className={cn("!bg-studio-surface !text-studio-fg max-w-5xl border-studio-border")}>
        <AppDialogHeader>
          <AppDialogTitle>إضافة أسئلة للاختبار</AppDialogTitle>
          <AppDialogDescription>ابحث واختر الأسئلة من بنك الأسئلة.</AppDialogDescription>
        </AppDialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex gap-3">
            <AppInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن سؤال..."
              aria-label="بحث"
              className="bg-studio-bg"
            />
            <AppSelect value={type} onValueChange={setType}>
              <AppSelectTrigger className="w-48 bg-studio-bg" aria-label="نوع السؤال">
                <AppSelectValue placeholder="النوع" />
              </AppSelectTrigger>
              <AppSelectContent>
                {QUESTION_TYPE_OPTIONS.map((o) => (
                  <AppSelectItem key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
          </div>

          <div className="studio-scrollbar max-h-[50vh] overflow-y-auto rounded-lg border border-studio-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-studio-border border-t-studio-accent" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-16 text-center text-sm text-studio-fg-muted">لا توجد أسئلة مطابقة</div>
            ) : (
              <ul className="divide-y divide-studio-border">
                {results.map((q) => {
                  const cfg = QUESTION_TYPE_CONFIG[q.type];
                  const Icon = cfg.icon;
                  const checked = selectedIds.has(q.id);
                  return (
                    <li key={q.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-studio-soft/40",
                          checked && "bg-studio-accent-soft/30",
                        )}
                      >
                        <AppCheckbox checked={checked} onCheckedChange={() => toggle(q.id)} aria-label={`اختيار ${q.title}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-studio-fg">{q.title}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <StudioChip variant="default" size="sm" icon={<Icon className="h-3 w-3" />}>
                              {cfg.label}
                            </StudioChip>
                            <span className="text-[11px] text-studio-fg-subtle">{q.points} نقطة</span>
                          </div>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <AppDialogFooter>
          <StudioButton variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </StudioButton>
          <StudioButton variant="primary" onClick={handleAdd} loading={addQuestion.isPending} disabled={selectedIds.size === 0}>
            إضافة للاختبار ({selectedIds.size})
          </StudioButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}
