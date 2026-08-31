"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  FileText,
  ListChecks,
  Settings2,
  ShieldCheck,
  Target,
  Plus,
  Repeat,
  FilePlus2,
} from "lucide-react";
import {
  StudioSurfaceCard,
  StudioButton,
  StudioEmptyState,
  StudioChip,
} from "@/components/studio";
import { useQueryClient } from "@tanstack/react-query";
import { useExamStudioStore } from "@/features/exam-bank/store";
import { useQuestion } from "@/features/exam-bank/hooks";
import { EXAM_BANK_QUERY_KEY } from "@/features/exam-bank/constants";
import type { Exam, ExamQuestion } from "@/features/exam-bank/types";
import { formatNumber } from "@/lib/format";
import QuestionBuilder from "./QuestionBuilder";
import { QuestionPreview } from "./QuestionPreview";

interface ExamStudioBuilderProps {
  exam: Exam | null;
  questions: ExamQuestion[];
  onOpenSettings: () => void;
  onAddQuestion: () => void;
  onCreateQuestion: () => void;
  onUpdateQuestion?: (id: string, payload: Record<string, unknown>) => void;
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <StudioSurfaceCard variant="default" padding="md" className="flex min-w-0 items-start gap-3">
      <div className="shrink-0 rounded-lg bg-studio-accent-soft p-2 text-studio-accent">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-studio-fg-muted">{label}</p>
        <p className="mt-0.5 break-words text-lg font-semibold text-studio-fg">{value}</p>
      </div>
    </StudioSurfaceCard>
  );
}

function ExamOverview({
  exam,
  questions,
  onOpenSettings,
  onAddQuestion,
  onCreateQuestion,
}: {
  exam: Exam;
  questions: ExamQuestion[];
  onOpenSettings: () => void;
  onAddQuestion: () => void;
  onCreateQuestion: () => void;
}) {
  const firstQuestionId = questions[0]?.questionId;
  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-studio-fg">{exam.title}</h1>
          {exam.description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-studio-fg-muted">
              {exam.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <StudioChip variant={exam.pinned ? "accent" : "default"}>
              {exam.pinned ? "مثبّت" : "غير مثبّت"}
            </StudioChip>
            <StudioChip variant={exam.featured ? "accent" : "default"}>
              {exam.featured ? "مميز" : "غير مميز"}
            </StudioChip>
          </div>
        </div>

        <div
          className="grid min-w-0 gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 160px), 1fr))" }}
        >
          <StatTile icon={<ListChecks className="h-5 w-5" />} label="عدد الأسئلة" value={formatNumber(exam.questionCount)} />
          <StatTile icon={<Target className="h-5 w-5" />} label="إجمالي النقاط" value={formatNumber(exam.totalPoints)} />
          <StatTile icon={<Clock className="h-5 w-5" />} label="المدة" value={exam.duration ? `${exam.duration} د` : "غير محددة"} />
          <StatTile icon={<ShieldCheck className="h-5 w-5" />} label="درجة النجاح" value={formatNumber(exam.passingScore)} />
          <StatTile icon={<Repeat className="h-5 w-5" />} label="حد المحاولات" value={exam.attemptLimit ?? "غير محدود"} />
          <StatTile icon={<Settings2 className="h-5 w-5" />} label="خلط الأسئلة" value={exam.shuffleQuestions ? "مفعل" : "معطّل"} />
          <StatTile icon={<FileText className="h-5 w-5" />} label="إظهار الإجابات" value={exam.showCorrectAnswers ? "مفعل" : "معطّل"} />
          <StatTile icon={<ShieldCheck className="h-5 w-5" />} label="الشهادة" value={exam.certificateEligible ? "متاحة" : "غير متاحة"} />
        </div>

        <div className="flex flex-wrap gap-3">
          <StudioButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => (firstQuestionId ? useExamStudioStore.getState().selectQuestion(firstQuestionId) : onAddQuestion())}
          >
            {firstQuestionId ? "إدارة الأسئلة" : "إضافة سؤال"}
          </StudioButton>
          <StudioButton
            variant="secondary"
            icon={<FilePlus2 className="h-4 w-4" />}
            onClick={onCreateQuestion}
          >
            سؤال جديد
          </StudioButton>
          <StudioButton variant="secondary" icon={<Settings2 className="h-4 w-4" />} onClick={onOpenSettings}>
            فتح الإعدادات
          </StudioButton>
        </div>
      </motion.div>
    </div>
  );
}

export function ExamStudioBuilder({
  exam,
  questions,
  onOpenSettings,
  onAddQuestion,
  onCreateQuestion,
  onUpdateQuestion,
}: ExamStudioBuilderProps) {
  const { view, selectedQuestionId } = useExamStudioStore();
  const qc = useQueryClient();
  const { data: question, isLoading: questionLoading } = useQuestion(
    view === "question" ? selectedQuestionId : null,
  );

  const link = questions.find((q) => q.questionId === selectedQuestionId);

  const handleScanUploaded = useCallback((payload: { scanUrl: string; scanAssetId: string }) => {
    if (!selectedQuestionId) return;
    qc.setQueryData(
      [EXAM_BANK_QUERY_KEY, "questions", "detail", selectedQuestionId],
      (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...old, scanUrl: payload.scanUrl, scanAssetId: payload.scanAssetId };
      },
    );
  }, [selectedQuestionId, qc]);

  const handleScanRemoved = useCallback(() => {
    if (!selectedQuestionId) return;
    qc.setQueryData(
      [EXAM_BANK_QUERY_KEY, "questions", "detail", selectedQuestionId],
      (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        return { ...old, scanUrl: null, scanAssetId: null };
      },
    );
  }, [selectedQuestionId, qc]);

  return (
    <div className="h-full overflow-y-auto studio-scrollbar bg-studio-bg">
      <AnimatePresence mode="popLayout">
        {view === "question" && selectedQuestionId ? (
          <motion.div
            key="question-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-4xl p-6 md:p-10"
          >
            {questionLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-studio-border border-t-studio-accent" />
              </div>
            ) : question ? (
              <div className="flex flex-col gap-6">
                <QuestionBuilder
                  question={question}
                  examQuestionLink={link ?? null}
                  onChange={(payload: Record<string, unknown>) => onUpdateQuestion?.(question.id, payload)}
                  onScanUploaded={handleScanUploaded}
                  onScanRemoved={handleScanRemoved}
                />
                <StudioSurfaceCard variant="outline" padding="md">
                  <h3 className="mb-3 text-sm font-semibold text-studio-fg">معاينة السؤال</h3>
                  <QuestionPreview question={question} />
                </StudioSurfaceCard>
              </div>
            ) : (
              <StudioEmptyState
                title="السؤال غير متاح"
                description="تعذر تحميل بيانات السؤال المحدد."
                action={
                  <StudioButton variant="secondary" onClick={onAddQuestion}>
                    إضافة سؤال
                  </StudioButton>
                }
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="overview-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {exam ? (
              <ExamOverview
                exam={exam}
                questions={questions}
                onOpenSettings={onOpenSettings}
                onAddQuestion={onAddQuestion}
                onCreateQuestion={onCreateQuestion}
              />
            ) : (
              <StudioEmptyState title="لا يوجد اختبار" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
