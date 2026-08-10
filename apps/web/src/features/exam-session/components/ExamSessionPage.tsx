"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, ListChecks } from "lucide-react";
import { useExamSession, useSubmitExam } from "../hooks";
import { EXAM_SESSION_QUERY_KEY, PROGRESS_FLUSH_MS } from "../constants";
import { createExamOutbox, type ExamOutbox } from "../outbox";
import type {
  AntiCheatEvent,
  AntiCheatEventType,
  ExamSessionAnswer,
} from "../types";
import { isAnswerEmpty } from "../utils";
import { ExamSessionTopBar } from "./ExamSessionTopBar";
import { ExamSessionSidebar } from "./ExamSessionSidebar";
import { ExamQuestionView } from "./ExamQuestionView";
import { ExamSubmitDialog } from "./ExamSubmitDialog";

interface ExamSessionPageProps {
  attemptId: string;
}

export function ExamSessionPage({ attemptId }: ExamSessionPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useExamSession(attemptId);
  const submitMutation = useSubmitExam(attemptId);

  const session = data ?? null;
  const attempt = session?.attempt ?? null;
  const questions = useMemo(() => session?.questions ?? [], [session]);

  const [navigationIndex, setNavigationIndex] = useState<number | null>(null);
  const [workspace, setWorkspace] = useState<Record<string, ExamSessionAnswer>>({});
  const [now, setNow] = useState(() => Date.now());
  const [submitOpen, setSubmitOpen] = useState(false);

  const deadlineRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const antiCheatRef = useRef<AntiCheatEvent[]>([]);
  const submittedRef = useRef(false);
  const seededAttemptRef = useRef<string | null>(null);
  const outboxRef = useRef<ExamOutbox | null>(null);

  useEffect(() => {
    const outbox = createExamOutbox(attemptId, {
      onTerminal: () => {
        queryClient.invalidateQueries({
          queryKey: [EXAM_SESSION_QUERY_KEY, attemptId],
        });
      },
    });
    outboxRef.current = outbox;
    return () => {
      outbox.dispose();
      outboxRef.current = null;
    };
  }, [attemptId, queryClient]);

  useEffect(() => {
    if (!session || !outboxRef.current) return;
    if (seededAttemptRef.current === attemptId) return;
    seededAttemptRef.current = attemptId;

    const serverAnswers: Record<string, ExamSessionAnswer> = {};
    for (const question of session.questions) {
      if (!isAnswerEmpty(question.answer, question.type)) {
        serverAnswers[question.examQuestionId] = question.answer;
      }
    }
    setWorkspace(outboxRef.current.seedFromServer(serverAnswers));
  }, [session, attemptId]);

  const inProgress = attempt?.status === "in_progress";

  const currentIndex = inProgress
    ? Math.min(
        Math.max(navigationIndex ?? attempt?.currentQuestionIndex ?? 0, 0),
        Math.max(questions.length - 1, 0),
      )
    : 0;

  // Keep the index ref in sync for the unload/progress keepalive payloads.
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Anchor the clock and the server-side deadline when the session loads.
  useEffect(() => {
    if (!attempt) return;

    if (attempt.status === "in_progress") {
      const fromDeadline = attempt.timerEndsAt
        ? new Date(attempt.timerEndsAt).getTime()
        : null;
      const fromRemaining =
        attempt.remainingSeconds != null
          ? Date.now() + attempt.remainingSeconds * 1000
          : null;
      deadlineRef.current = fromDeadline ?? fromRemaining;
    } else {
      deadlineRef.current = null;
    }

    const anchor = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(anchor);
  }, [attempt]);

  // Countdown ticker + auto-submit at expiry.
  useEffect(() => {
    if (!inProgress || deadlineRef.current === null) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
      if (
        !submittedRef.current &&
        deadlineRef.current !== null &&
        Date.now() >= deadlineRef.current
      ) {
        submittedRef.current = true;
        const outbox = outboxRef.current;
        const attemptSubmit = () => {
          submitMutation.mutate(undefined, {
            onError: () => {
              submittedRef.current = false;
            },
          });
        };
        if (outbox) {
          void outbox.drain().then(attemptSubmit);
        } else {
          attemptSubmit();
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress]);

  const remainingSeconds = useMemo(() => {
    if (!inProgress || !attempt) return null;
    const deadline = attempt.timerEndsAt
      ? new Date(attempt.timerEndsAt).getTime()
      : attempt.remainingSeconds != null
        ? now + attempt.remainingSeconds * 1000
        : null;
    if (deadline == null) return null;
    return Math.max(0, Math.round((deadline - now) / 1000));
  }, [attempt, inProgress, now]);

  // Anti-cheat event listeners.
  useEffect(() => {
    if (!inProgress) return;

    const push = (type: AntiCheatEventType) => {
      antiCheatRef.current.push({ type, occurred_at: new Date().toISOString() });
    };

    const onVisibility = () => push(document.hidden ? "page_hidden" : "page_visible");
    const onBlur = () => push("window_blur");
    const onFocus = () => push("window_focus");
    const onFullscreen = () =>
      push(document.fullscreenElement ? "fullscreen_enter" : "fullscreen_exit");
    const onPageHide = () => {
      push("page_exit");
      outboxRef.current?.queueProgress(
        currentIndexRef.current,
        antiCheatRef.current.splice(0, antiCheatRef.current.length),
      );
      outboxRef.current?.flushKeepalive();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [inProgress, attemptId]);

  // Periodic anti-cheat + progress flush.
  useEffect(() => {
    if (!inProgress) return;

    const flush = () => {
      if (antiCheatRef.current.length === 0) return;
      outboxRef.current?.queueProgress(
        currentIndexRef.current,
        antiCheatRef.current.splice(0, antiCheatRef.current.length),
      );
    };

    const interval = window.setInterval(flush, PROGRESS_FLUSH_MS);
    return () => window.clearInterval(interval);
  }, [inProgress]);

  function handleAnswerChange(answer: ExamSessionAnswer) {
    if (!attempt) return;

    const question = questions[currentIndex];
    if (!question) return;

    setWorkspace((prev) => ({ ...prev, [question.examQuestionId]: answer }));
    outboxRef.current?.queueAnswer(question.examQuestionId, answer);
  }

  function navigateTo(index: number) {
    if (!attempt || !inProgress) return;
    const clamped = Math.min(Math.max(index, 0), questions.length - 1);
    if (clamped === currentIndex) return;

    setNavigationIndex(clamped);
    outboxRef.current?.queueProgress(
      clamped,
      antiCheatRef.current.splice(0, antiCheatRef.current.length),
    );
  }

  const answeredCount = useMemo(
    () =>
      questions.filter((question) => {
        const value = workspace[question.examQuestionId] ?? question.answer;
        return !isAnswerEmpty(value, question.type);
      }).length,
    [questions, workspace],
  );

  const backToCourse = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  if (isLoading) {
    return <SessionLoadingScreen />;
  }

  if (isError || !session || !attempt) {
    return <SessionErrorScreen onBack={backToCourse} onRetry={() => window.location.reload()} />;
  }

  if (attempt.status === "submitted") {
    return <RedirectToResults attemptId={attempt.id} />;
  }

  const question = questions[currentIndex];
  const currentAnswer = question
    ? workspace[question.examQuestionId] ?? question.answer ?? null
    : null;

  return (
    <div className="min-h-screen bg-background">
      <ExamSessionTopBar
        title={attempt.exam.title}
        remainingSeconds={remainingSeconds}
        answeredCount={answeredCount}
        total={questions.length}
        submitting={submitMutation.isPending}
        onSubmitClick={() => setSubmitOpen(true)}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
          >
            {/* Question */}
            <div className="rounded-3xl border border-border/40 bg-card/60 p-5 shadow-sm sm:p-7">
              {question ? (
                <>
                  <ExamQuestionView
                    question={question}
                    index={currentIndex}
                    total={questions.length}
                    answer={currentAnswer}
                    onAnswerChange={handleAnswerChange}
                  />

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/30 pt-5">
                    <button
                      type="button"
                      onClick={() => navigateTo(currentIndex - 1)}
                      disabled={currentIndex === 0}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-4 text-sm font-bold text-foreground/80 transition-all duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </button>

                    <span className="hidden text-xs font-bold tabular-nums text-muted-foreground sm:inline">
                      {currentIndex + 1} / {questions.length}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        currentIndex === questions.length - 1
                          ? setSubmitOpen(true)
                          : navigateTo(currentIndex + 1)
                      }
                      className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg shadow-[rgb(var(--brand-primary-rgb)/0.3)] transition-all duration-300 hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))" }}
                    >
                      {currentIndex === questions.length - 1 ? "تسليم الامتحان" : "التالي"}
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">
                  لا توجد أسئلة في هذا الامتحان.
                </p>
              )}
            </div>

            {/* Navigator */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <ExamSessionSidebar
                questions={questions}
                answers={workspace}
                currentIndex={currentIndex}
                onNavigate={navigateTo}
              />
            </aside>
          </motion.div>
        </AnimatePresence>
      </div>

      <ExamSubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        answeredCount={answeredCount}
        total={questions.length}
        isOfficial={attempt.isOfficial}
        submitting={submitMutation.isPending}
        onConfirm={() => {
          submittedRef.current = true;
          const outbox = outboxRef.current;
          const attemptSubmit = () => {
            submitMutation.mutate(undefined, {
              onSettled: () => setSubmitOpen(false),
              onError: () => {
                submittedRef.current = false;
              },
            });
          };
          if (outbox) {
            void outbox.drain().then(attemptSubmit);
          } else {
            attemptSubmit();
          }
        }}
      />
    </div>
  );
}

function RedirectToResults({ attemptId }: { attemptId: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/exam-results/${attemptId}`);
  }, [router, attemptId]);

  return null;
}

function SessionLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        <p className="text-sm font-semibold">جارٍ تحميل الامتحان...</p>
      </div>
    </main>
  );
}

function SessionErrorScreen({
  onBack,
  onRetry,
}: {
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/40 bg-card p-7 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/25">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-lg font-extrabold text-foreground">تعذر تحميل الامتحان</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          تأكد من أنك مسجل دخول وتملك حق الوصول لهذا الامتحان، ثم أعد المحاولة.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg shadow-[rgb(var(--brand-primary-rgb)/0.3)]"
            style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))" }}
          >
            <ListChecks className="h-4 w-4" />
            إعادة المحاولة
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-11 rounded-xl border border-border/50 bg-background/80 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            العودة للدورة
          </button>
        </div>
      </div>
    </main>
  );
}
