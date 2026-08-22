"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Plus, FilePlus2, Trash2, ScanLine } from "lucide-react";
import { AppInput, AppSelect, AppSelectTrigger, AppSelectValue, AppSelectContent, AppSelectItem } from "@/components/ui";
import {
  StudioButton,
  StudioChip,
  StudioSelectableSurface,
  StudioEmptyState,
} from "@/components/studio";
import { useExamStudioStore } from "@/features/exam-bank/store";
import { QUESTION_TYPE_CONFIG } from "@/features/exam-bank/constants";
import type { Exam, ExamQuestion, QuestionType } from "@/features/exam-bank/types";

interface ExamStudioNavigatorProps {
  open: boolean;
  width: number;
  exam: Exam | null;
  questions: ExamQuestion[];
  onSelectQuestion: (id: string) => void;
  onAddQuestion: () => void;
  onCreateQuestion: () => void;
  onImportQuestion: () => void;
  onRemoveQuestion: (questionId: string) => void;
  onReorder: (order: string[]) => void;
  onTogglePin?: (questionId: string) => void;
}

export function ExamStudioNavigator({
  questions,
  onSelectQuestion,
  onAddQuestion,
  onCreateQuestion,
  onImportQuestion,
  onRemoveQuestion,
  onReorder,
  onTogglePin,
}: ExamStudioNavigatorProps) {
  const { search, setSearch, sectionFilter, setSectionFilter, selectedQuestionId } =
    useExamStudioStore();

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const orderedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions],
  );

  const sections = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.section) set.add(q.section);
    });
    return Array.from(set);
  }, [questions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orderedQuestions.filter((q) => {
      const title = (q.question?.title ?? "").toLowerCase();
      const matchSearch = !term || title.includes(term);
      const matchSection = sectionFilter === "all" || q.section === sectionFilter;
      return matchSearch && matchSection;
    });
  }, [orderedQuestions, search, sectionFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, ExamQuestion[]>();
    filtered.forEach((q) => {
      const key = q.section || "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }
    const ids = orderedQuestions.map((q) => q.questionId);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) {
      setDraggingId(null);
      return;
    }
    const [moved] = ids.splice(from, 1);
    if (moved !== undefined) {
      ids.splice(to, 0, moved);
    }
    onReorder(ids);
    setDraggingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!filtered.length) return;
    const idx = filtered.findIndex((q) => q.questionId === selectedQuestionId);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = filtered[Math.min(filtered.length - 1, idx + 1)];
      if (next) onSelectQuestion(next.questionId);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = filtered[Math.max(0, idx - 1)];
      if (prev) onSelectQuestion(prev.questionId);
    } else if (e.key === "Enter" && idx >= 0) {
      e.preventDefault();
      const current = filtered[idx];
      if (current) onSelectQuestion(current.questionId);
    }
  };

  return (
    <div className="flex h-full flex-col bg-studio-surface">
      <div className="flex shrink-0 flex-col gap-3 border-b border-studio-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-studio-fg">أسئلة الاختبار</h2>
          <span className="rounded-full bg-studio-soft px-2 py-0.5 text-xs font-medium text-studio-fg-muted">
            {questions.length}
          </span>
        </div>
        <AppInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن سؤال..."
          aria-label="بحث عن سؤال"
          className="bg-studio-bg"
        />
        <AppSelect value={sectionFilter} onValueChange={setSectionFilter}>
          <AppSelectTrigger aria-label="تصفية حسب القسم" className="bg-studio-bg">
            <AppSelectValue placeholder="كل الأقسام" />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="all">كل الأقسام</AppSelectItem>
            {sections.map((s) => (
              <AppSelectItem key={s} value={s}>
                {s}
              </AppSelectItem>
            ))}
          </AppSelectContent>
        </AppSelect>
        <div className="flex gap-2">
          <StudioButton variant="primary" size="sm" className="flex-1" icon={<Plus className="h-4 w-4" />} onClick={onAddQuestion}>
            إضافة سؤال
          </StudioButton>
          <StudioButton variant="secondary" size="sm" icon={<FilePlus2 className="h-4 w-4" />} onClick={onCreateQuestion}>
            سؤال جديد
          </StudioButton>
        </div>
        <StudioButton
          variant="soft"
          size="sm"
          className="w-full"
          icon={<ScanLine className="h-4 w-4" />}
          onClick={onImportQuestion}
        >
          استيراد من صورة
        </StudioButton>
      </div>

      <div
        className="studio-scrollbar flex-1 overflow-y-auto p-3"
        role="listbox"
        aria-label="قائمة الأسئلة"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {filtered.length === 0 ? (
          <StudioEmptyState
            icon={<Plus className="h-8 w-8" />}
            title="لا توجد أسئلة"
            description="أضف أسئلة من بنك الأسئلة أو أنشئ سؤالاً جديداً."
            className="py-10"
          />
        ) : (
          <AnimatePresence initial={false}>
            {groups.map(([section, items]) => (
              <div key={section} className="mb-3">
                {section !== "__none__" && (
                  <div className="px-1 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-studio-fg-muted">
                    {section}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {items.map((q) => {
                    const typeCfg = QUESTION_TYPE_CONFIG[(q.question?.type ?? "single_choice") as QuestionType];
                    const points = q.points ?? q.question?.points ?? 0;
                    const title = q.question?.title || "سؤال بدون عنوان";
                    const selected = q.questionId === selectedQuestionId;
                    const Icon = typeCfg.icon;
                    return (
                      <motion.div
                        key={q.questionId}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <StudioSelectableSurface
                          selected={selected}
                          onSelect={() => onSelectQuestion(q.questionId)}
                          draggable
                          onDragStart={() => setDraggingId(q.questionId)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(q.questionId)}
                          className="group flex items-center gap-2 p-2.5"
                          aria-label={title}
                        >
                          <GripVertical className="h-4 w-4 shrink-0 text-studio-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                          <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-studio-fg-muted">
                            {q.order}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-studio-fg">{title}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <StudioChip variant="default" size="sm" icon={<Icon className="h-3 w-3" />}>
                                {typeCfg.label}
                              </StudioChip>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-md bg-studio-soft px-1.5 py-0.5 text-[11px] font-medium text-studio-fg-muted">
                            {points} نقطة
                          </span>
                          <div className="flex shrink-0 items-center">
                            {onTogglePin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePin(q.questionId);
                                }}
                                className="rounded-md p-1 text-studio-fg-subtle opacity-0 transition-opacity hover:text-studio-accent group-hover:opacity-100"
                                aria-label="تثبيت السؤال"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveQuestion(q.questionId);
                              }}
                              className="rounded-md p-1 text-studio-fg-subtle opacity-0 transition-opacity hover:text-studio-danger group-hover:opacity-100"
                              aria-label="حذف السؤال من الاختبار"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </StudioSelectableSurface>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
