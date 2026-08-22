"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  PanelLeft,
  PanelRight,
  Pin,
  Plus,
  Send,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import { ChevronStartIcon } from "@/components/ui/icons";
import { PermissionGuard } from "@/components/ui";
import {
  StudioWorkspaceHeader,
  StudioButton,
  StudioChip,
  StudioEmptyState,
  type ChipVariant,
} from "@/components/studio";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import {
  useExam,
  useExamQuestions,
  useUpdateExam,
  useTogglePinnedExam,
  useToggleFavoriteExam,
  usePublishExam,
  useArchiveExam,
  useDeleteExam,
  useUpdateExamQuestionLink,
  useUpdateQuestion,
  useRemoveExamQuestion,
  useReorderExamQuestions,
} from "@/features/exam-bank/hooks";
import { useExamStudioStore } from "@/features/exam-bank/store";
import { EXAM_STATUS_CONFIG } from "@/features/exam-bank/constants";
import type { Exam, ExamQuestion, ExamStatus } from "@/features/exam-bank/types";
import { ExamStudioNavigator } from "./ExamStudioNavigator";
import { ExamStudioBuilder } from "./ExamStudioBuilder";
import { ExamStudioInspector } from "./ExamStudioInspector";
import { ExamSettingsDialog } from "./ExamSettingsDialog";
import { AddQuestionDialog } from "./AddQuestionDialog";
import { CreateQuestionDialog } from "./CreateQuestionDialog";

type StudioMode = "loading" | "empty" | "ready";

interface ExamStudioProps {
  examId: string;
  mode?: StudioMode;
  onBack?: () => void;
}

const STATUS_CHIP_VARIANT: Record<ExamStatus, ChipVariant> = {
  draft: "default",
  published: "success",
  archived: "danger",
};

function getIsRtl() {
  if (typeof document === "undefined") return false;
  return document.documentElement.dir === "rtl";
}

export function ExamStudio({ examId, mode = "ready", onBack }: ExamStudioProps) {
  const router = useRouter();
  const store = useExamStudioStore();

  const { data: exam, isLoading } = useExam(examId);
  const { data: questionsData } = useExamQuestions(examId);
  const questions: ExamQuestion[] = questionsData ?? [];

  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(320);
  const [resizing, setResizing] = useState<null | "nav" | "ins">(null);

  const updateExam = useUpdateExam();
  const updateQuestion = useUpdateQuestion();
  const updateLink = useUpdateExamQuestionLink();
  const removeQuestion = useRemoveExamQuestion();
  const reorderQuestions = useReorderExamQuestions();
  const togglePin = useTogglePinnedExam();
  const toggleFav = useToggleFavoriteExam();
  const publishExam = usePublishExam();
  const archiveExam = useArchiveExam();
  const deleteExam = useDeleteExam();

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else router.back();
  }, [onBack, router]);

  useEffect(() => {
    return () => useExamStudioStore.getState().reset();
  }, []);

  /* ----------------------------- panel resizing ----------------------------- */

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const isRtl = getIsRtl();
      if (resizing === "nav") {
        const raw = isRtl ? window.innerWidth - e.clientX : e.clientX;
        setLeftWidth(Math.max(240, Math.min(480, raw)));
      } else {
        const raw = isRtl ? e.clientX : window.innerWidth - e.clientX;
        setRightWidth(Math.max(260, Math.min(480, raw)));
      }
    };
    const onUp = () => setResizing(null);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing]);

  /* ----------------------------- keyboard shortcuts ----------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        store.toggleNavigator();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        store.toggleInspector();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  /* ----------------------------- mutation handlers ----------------------------- */

  const handleUpdateExam = useCallback(
    (payload: Record<string, unknown>) => {
      if (!exam) return;
      updateExam.mutate(
        { id: exam.id, payload },
        { onError: () => toast.error("فشل حفظ إعدادات الاختبار") },
      );
    },
    [exam, updateExam],
  );

  const handleUpdateQuestion = useCallback(
    (id: string, payload: Record<string, unknown>) => {
      updateQuestion.mutate({ id, payload });
    },
    [updateQuestion],
  );

  const handleUpdateLink = useCallback(
    (questionId: string, payload: { points?: number; section?: string }) => {
      if (!exam) return;
      updateLink.mutate({ id: exam.id, questionId, payload });
    },
    [exam, updateLink],
  );

  const handleReorder = useCallback(
    (order: string[]) => {
      if (!exam) return;
      reorderQuestions.mutate(
        { id: exam.id, order: order.map((id) => Number(id)) },
        { onError: () => toast.error("فشل إعادة ترتيب الأسئلة") },
      );
    },
    [exam, reorderQuestions],
  );

  const statusConfig = exam ? EXAM_STATUS_CONFIG[exam.status] : null;

  /* ----------------------------- render states ----------------------------- */

  if (mode === "loading" || isLoading) {
    return (
      <div className="flex h-full flex-col">
        <StudioWorkspaceHeader
          left={
            <StudioButton variant="ghost" size="icon" onClick={handleBack} aria-label="رجوع">
              <ChevronStartIcon className="h-4 w-4" />
            </StudioButton>
          }
          right={
            <div className="h-8 w-40 animate-pulse rounded-md bg-studio-soft" aria-hidden />
          }
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-studio-border border-t-studio-accent" />
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex h-full flex-col">
        <StudioWorkspaceHeader
          left={
            <StudioButton variant="ghost" size="icon" onClick={handleBack} aria-label="رجوع">
              <ChevronStartIcon className="h-4 w-4" />
            </StudioButton>
          }
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <StudioEmptyState
            title="لم يتم العثور على الاختبار"
            description="قد يكون محذوفاً أو غير متاح ضمن صلاحياتك."
            action={
              <StudioButton variant="secondary" onClick={handleBack}>
                العودة
              </StudioButton>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col overflow-hidden"
    >
      <StudioWorkspaceHeader
        left={
          <>
            <StudioButton variant="ghost" size="icon" onClick={handleBack} aria-label="رجوع">
              <ChevronStartIcon className="h-4 w-4" />
            </StudioButton>
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-studio-fg">
                  {exam.title}
                </h1>
                <p className="truncate text-xs text-studio-fg-muted">
                  {exam.questionCount} سؤال · {exam.totalPoints} نقطة
                </p>
              </div>
              {statusConfig && (
                <StudioChip variant={STATUS_CHIP_VARIANT[exam.status]} size="sm">
                  {statusConfig.label}
                </StudioChip>
              )}
            </div>
          </>
        }
        right={
          <>
            <StudioButton
              variant="ghost"
              size="icon"
              onClick={() => store.toggleNavigator()}
              aria-label="إظهار/إخفاء المستكشف"
              aria-pressed={store.navigatorOpen}
            >
              <PanelLeft className="h-4 w-4" />
            </StudioButton>
            <StudioButton
              variant="ghost"
              size="icon"
              onClick={() => store.toggleInspector()}
              aria-label="إظهار/إخفاء الخصائص"
              aria-pressed={store.inspectorOpen}
            >
              <PanelRight className="h-4 w-4" />
            </StudioButton>
            <div className="mx-1 h-6 w-px bg-studio-border" />
            <PermissionGuard permission="exams.update">
              <StudioButton
                variant={exam.pinned ? "soft" : "ghost"}
                size="icon"
                onClick={() => togglePin.mutate(exam.id)}
                aria-label={exam.pinned ? "إلغاء التثبيت" : "تثبيت"}
                aria-pressed={exam.pinned}
              >
                <Pin className={cn("h-4 w-4", exam.pinned && "fill-current")} />
              </StudioButton>
              <StudioButton
                variant={exam.favorite ? "soft" : "ghost"}
                size="icon"
                onClick={() => toggleFav.mutate(exam.id)}
                aria-label={exam.favorite ? "إلغاء المفضلة" : "إضافة للمفضلة"}
                aria-pressed={exam.favorite}
              >
                <Star className={cn("h-4 w-4", exam.favorite && "fill-current")} />
              </StudioButton>
            </PermissionGuard>
            {exam.status !== "published" && (
              <PermissionGuard permission="exams.publish">
                <StudioButton
                  variant="success"
                  size="sm"
                  icon={<Send className="h-4 w-4" />}
                  onClick={() => publishExam.mutate(exam.id, { onSuccess: () => toast.success("تم نشر الاختبار") })}
                >
                  نشر
                </StudioButton>
              </PermissionGuard>
            )}
            {exam.status !== "archived" && (
              <PermissionGuard permission="exams.archive">
                <StudioButton
                  variant="secondary"
                  size="sm"
                  icon={<Archive className="h-4 w-4" />}
                  onClick={() => archiveExam.mutate(exam.id, { onSuccess: () => toast.success("تم أرشفة الاختبار") })}
                >
                  أرشفة
                </StudioButton>
              </PermissionGuard>
            )}
            <StudioButton
              variant="ghost"
              size="icon"
              onClick={() => store.openExamSettings()}
              aria-label="إعدادات الاختبار"
            >
              <Settings className="h-4 w-4" />
            </StudioButton>
            <PermissionGuard permission="exams.delete">
              <StudioButton
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm(`حذف الاختبار "${exam.title}"؟`)) {
                    deleteExam.mutate(exam.id, {
                      onSuccess: () => {
                        toast.success("تم حذف الاختبار");
                        handleBack();
                      },
                    });
                  }
                }}
                aria-label="حذف الاختبار"
              >
                <Trash2 className="h-4 w-4" />
              </StudioButton>
            </PermissionGuard>
            <StudioButton
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => store.openQuestionPicker()}
            >
              إضافة سؤال
            </StudioButton>
          </>
        }
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {store.navigatorOpen && (
            <motion.aside
              key="exam-navigator"
              initial={{ width: 0, opacity: 0, minWidth: 0 }}
              animate={{ width: leftWidth, opacity: 1, minWidth: leftWidth }}
              exit={{ width: 0, opacity: 0, minWidth: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="shrink-0 overflow-hidden border-e border-studio-border bg-studio-surface"
            >
              <div style={{ width: leftWidth }} className="h-full">
                <ExamStudioNavigator
                  open={store.navigatorOpen}
                  width={leftWidth}
                  exam={exam}
                  questions={questions}
                  onSelectQuestion={store.selectQuestion}
                  onAddQuestion={store.openQuestionPicker}
                  onCreateQuestion={store.openCreateQuestion}
                  onRemoveQuestion={(questionId) =>
                    removeQuestion.mutate(
                      { id: exam.id, questionId },
                      { onError: () => toast.error("فشل حذف السؤال") },
                    )
                  }
                  onReorder={handleReorder}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {store.navigatorOpen && (
          <div
            onMouseDown={() => setResizing("nav")}
            role="separator"
            aria-orientation="vertical"
            aria-label="تغيير عرض المستكشف"
            className="relative w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-studio-accent/30"
          >
            <div className="absolute inset-y-0 -start-1 -end-1" />
          </div>
        )}

        <div className="min-w-0 flex-1 overflow-hidden">
          <ExamStudioBuilder
            exam={exam}
            questions={questions}
            onOpenSettings={store.openExamSettings}
            onAddQuestion={store.openQuestionPicker}
            onCreateQuestion={store.openCreateQuestion}
            onUpdateQuestion={handleUpdateQuestion}
          />
        </div>

        {store.inspectorOpen && (
          <div
            onMouseDown={() => setResizing("ins")}
            role="separator"
            aria-orientation="vertical"
            aria-label="تغيير عرض الخصائص"
            className="relative w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-studio-accent/30"
          >
            <div className="absolute inset-y-0 -start-1 -end-1" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {store.inspectorOpen && (
            <motion.aside
              key="exam-inspector"
              initial={{ width: 0, opacity: 0, minWidth: 0 }}
              animate={{ width: rightWidth, opacity: 1, minWidth: rightWidth }}
              exit={{ width: 0, opacity: 0, minWidth: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="shrink-0 overflow-hidden border-s border-studio-border bg-studio-surface"
            >
              <div style={{ width: rightWidth }} className="h-full">
                <ExamStudioInspector
                  open={store.inspectorOpen}
                  width={rightWidth}
                  exam={exam}
                  questions={questions}
                  onUpdateExam={handleUpdateExam}
                  onUpdateQuestion={handleUpdateQuestion}
                  onUpdateLink={handleUpdateLink}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <ExamSettingsDialog
        exam={exam}
        open={store.examSettingsOpen}
        onOpenChange={(open) => (open ? store.openExamSettings() : store.closeExamSettings())}
      />
      <AddQuestionDialog
        examId={examId}
        open={store.questionPickerOpen}
        onOpenChange={(open) => (open ? store.openQuestionPicker() : store.closeQuestionPicker())}
      />
      <CreateQuestionDialog
        examId={examId}
        open={store.createQuestionOpen}
        onOpenChange={(open) => (open ? store.openCreateQuestion() : store.closeCreateQuestion())}
      />
    </motion.div>
  );
}
