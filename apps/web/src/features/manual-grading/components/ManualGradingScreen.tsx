"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronStartIcon } from "@/components/ui/icons";
import { AppErrorState } from "@/components/ui";
import { StudioButton, StudioChip, StudioEmptyState, StudioSurfaceCard, StudioWorkspaceHeader } from "@/components/studio";
import { useExam, useExamQuestions } from "@/features/exam-bank/hooks";
import { QUESTION_TYPE_CONFIG } from "@/features/exam-bank/constants";
import { normalizeApiError } from "@/services/api/errors";
import { toast } from "sonner";
import { useGradingAnswer, useGradingQueue, useSaveGrade } from "../hooks";
import { formatDateTime } from "../mappers";
import type { GradingQueueItem } from "../types";
import { GradingWorkspace } from "./GradingWorkspace";
import { QueueList } from "./QueueList";
import { RefreshCw } from "lucide-react";

interface ManualGradingScreenProps {
  examId: string;
}

export function ManualGradingScreen({ examId }: ManualGradingScreenProps) {
  const router = useRouter();
  const { data: exam } = useExam(examId);
  const { data: examQuestions } = useExamQuestions(examId);

  const queueQuery = useGradingQueue(examId);
  const queue = useMemo(() => queueQuery.data ?? [], [queueQuery.data]);
  const saveGrade = useSaveGrade();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  /* Default to the first pending item once the queue arrives. */
  const selectedIndex = selectedId ? queue.findIndex((item) => item.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? queue[selectedIndex] : (queue[0] ?? null);

  const answerQuery = useGradingAnswer(
    selected?.examAttemptId ?? null,
    selected?.examQuestionId ?? null,
  );

  const resolveTitle = useCallback(
    (item: GradingQueueItem): string => {
      const link = examQuestions?.find((q) => String(q.questionId) === String(item.questionId));
      return link?.question?.title ?? "";
    },
    [examQuestions],
  );

  const questionMeta = useMemo(() => {
    if (!selected) return null;
    const link = examQuestions?.find((q) => String(q.questionId) === String(selected.questionId));
    const type = link?.question?.type;
    return {
      title: link?.question?.title ?? "",
      typeLabel: (type && QUESTION_TYPE_CONFIG[type]?.label) || "إجابة",
    };
  }, [selected, examQuestions]);

  const moveTo = useCallback(
    (delta: number) => {
      if (selectedIndex < 0) return;
      const target = selectedIndex + delta;
      const next = queue[target];
      if (!next) return;
      setAttemptError(null);
      setScoreError(null);
      setSelectedId(next.id);
    },
    [queue, selectedIndex],
  );

  const handleSave = useCallback(
    (payload: { manualScore: number; feedback: string }) => {
      if (!selected) return;
      setAttemptError(null);
      setScoreError(null);
      saveGrade.mutate(
        {
          examId,
          attemptId: selected.examAttemptId,
          examQuestionId: selected.examQuestionId,
          answerId: selected.id,
          payload: { manual_score: payload.manualScore, feedback: payload.feedback || null },
        },
        {
          onSuccess: () => {
            toast.success("تم حفظ التصحيح");
            void queueQuery.refetch();
            const next = queue[selectedIndex + 1];
            setSelectedId(next ? next.id : null);
          },
          onError: (error) => {
            const apiError = normalizeApiError(error);
            const attempt = apiError.fieldErrors?.attempt_id?.[0];
            const manual = apiError.fieldErrors?.manual_score?.[0];
            if (attempt) {
              setAttemptError(attempt);
            } else if (manual) {
              setScoreError(manual);
            } else {
              setAttemptError(apiError.message ?? "تعذّر حفظ التصحيح. حاول مرة أخرى.");
            }
          },
        },
      );
    },
    [saveGrade, queue, selectedIndex, selected, examId, queueQuery],
  );

  const queueError = queueQuery.isError ? normalizeApiError(queueQuery.error) : null;

  return (
    <div className="flex h-full flex-col">
      <StudioWorkspaceHeader
        left={
          <>
            <StudioButton variant="ghost" size="icon" onClick={() => router.back()} aria-label="رجوع">
              <ChevronStartIcon className="h-4 w-4" />
            </StudioButton>
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-base font-semibold text-studio-fg">تصحيح الأسئلة المقالية</h1>
              <span className="hidden text-sm text-studio-fg-muted md:inline">·</span>
              <p className="hidden truncate text-sm text-studio-fg-muted md:block">{exam?.title ?? ""}</p>
              <StudioChip variant="warning" size="sm">
                {queue.length} بانتظار المراجعة
              </StudioChip>
              {selected ? <span className="text-xs text-studio-fg-muted">{formatDateTime(selected.answeredAt)}</span> : null}
            </div>
          </>
        }
        right={
          <StudioButton
            variant="ghost"
            size="icon"
            onClick={() => void queueQuery.refetch()}
            aria-label="تحديث القائمة"
          >
            <RefreshCw className="h-4 w-4" />
          </StudioButton>
        }
      />

      {queueError ? (
        <div className="mx-auto flex w-full max-w-[720px] flex-1 items-center justify-center p-6">
          <AppErrorState
            title="تعذّر تحميل قائمة المراجعة"
            description={queueError.message}
            onRetry={() => void queueQuery.refetch()}
          />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-4 overflow-auto p-4 md:p-5 lg:flex-row">
          <div className="w-full lg:w-[340px] lg:shrink-0 lg:overflow-y-auto">
            <QueueList
              items={queue}
              selectedId={selected?.id ?? null}
              loading={queueQuery.isLoading}
              resolveTitle={resolveTitle}
              onSelect={(id) => {
                setAttemptError(null);
                setScoreError(null);
                setSelectedId(id);
              }}
            />
          </div>

          <div className="min-w-0 flex-1 lg:overflow-y-auto">
            {!selected ? (
              <StudioSurfaceCard className="flex h-full items-center justify-center p-6">
                <StudioEmptyState
                  title="اختر إجابة للمراجعة"
                  description="لا توجد إجابات حالياً ضمن قائمة الانتظار، أو اكتملت مراجعة كل الإجابات."
                />
              </StudioSurfaceCard>
            ) : (
              <GradingWorkspace
                item={selected}
                questionMeta={questionMeta}
                answer={answerQuery.data}
                answerLoading={answerQuery.isLoading}
                answerError={answerQuery.isError ? normalizeApiError(answerQuery.error).message : null}
                savePending={saveGrade.isPending}
                attemptError={attemptError}
                scoreError={scoreError}
                onSave={handleSave}
                onPrev={selectedIndex > 0 ? () => moveTo(-1) : null}
                onNext={selectedIndex >= 0 && selectedIndex < queue.length - 1 ? () => moveTo(1) : null}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}