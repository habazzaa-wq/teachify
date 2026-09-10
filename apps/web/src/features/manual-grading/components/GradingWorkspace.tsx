"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  FileText,
  Info,
  Keyboard,
  Loader2,
  Save,
} from "lucide-react";
import { AppInput, AppTextarea } from "@/components/ui";
import { ScanImageViewer } from "@/features/exam-bank/components/ScanImageViewer";
import { StudioButton, StudioChip, StudioSurfaceCard } from "@/components/studio";
import { formatDateTime, parseScoreInput } from "../mappers";
import { manualGradingService } from "../services";
import type { GradingAnswer, GradingQueueItem } from "../types";

interface QuestionMeta {
  title: string;
  typeLabel: string;
}

interface GradingWorkspaceProps {
  item: GradingQueueItem;
  questionMeta: QuestionMeta | null;
  answer: GradingAnswer | undefined;
  answerLoading: boolean;
  answerError: string | null;
  savePending: boolean;
  attemptError: string | null;
  scoreError: string | null;
  onSave: (payload: { manualScore: number; feedback: string }) => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

export function GradingWorkspace(props: GradingWorkspaceProps) {
  // Remount on every selected answer so form/page state is always derived
  // fresh from the loaded answer (no manual reset effects required).
  return <GradingWorkspaceInner key={props.answer?.answerId ?? "loading"} {...props} />;
}

function GradingWorkspaceInner({
  item,
  questionMeta,
  answer,
  answerLoading,
  answerError,
  savePending,
  attemptError,
  scoreError,
  onSave,
  onPrev,
  onNext,
}: GradingWorkspaceProps) {
  const maxPoints = item.points;
  const pages = answer?.pages ?? [];

  const [pageIndex, setPageIndex] = useState(0);
  const [score, setScore] = useState(() =>
    answer && answer.manualScore !== null ? String(answer.manualScore) : "",
  );
  const [feedback, setFeedback] = useState(() => answer?.feedback ?? "");
  const [clientError, setClientError] = useState<string | null>(null);
  const [pageUrls, setPageUrls] = useState<Record<string, string>>({});
  const [pagesLoading, setPagesLoading] = useState(() => pages.length > 0);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const scoreInputRef = useRef<HTMLInputElement>(null);

  const safePageIndex = Math.min(pageIndex, Math.max(pages.length - 1, 0));
  const currentPage = pages[safePageIndex] ?? null;
  const currentUrl = currentPage ? pageUrls[currentPage.id] : undefined;

  /* Load each page's image bytes through the authenticated media route.
     Page/answer identity never changes within one mounted instance (see key above). */
  useEffect(() => {
    let cancelled = false;
    if (pages.length === 0) return;
    const urls: Record<string, string> = {};

    Promise.all(
      pages.map((page) =>
        manualGradingService
          .fetchPageBlob(page.url)
          .then((blob) => {
            if (cancelled || !blob) return;
            const url = URL.createObjectURL(blob);
            urls[page.id] = url;
            setPageUrls((prev) => ({ ...prev, [page.id]: url }));
          })
          .catch(() => {
            /* A single unreadable page stays missing; the viewer shows its own error state. */
          }),
      ),
    ).finally(() => {
      if (!cancelled) setPagesLoading(false);
    });

    return () => {
      cancelled = true;
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer?.answerId]);

  const handleSubmit = () => {
    const parsed = parseScoreInput(score, maxPoints);
    if (!parsed.ok) {
      setClientError(parsed.error);
      return;
    }
    setClientError(null);
    onSave({ manualScore: parsed.value, feedback: feedback.trim() });
  };

  // Mirrors for the keyboard listener (subscribed once at mount) so it always
  // reads the latest score / save state. Updated in an effect, never during
  // render — the React-compiler-safe pattern.
  const scoreRef = useRef(score);
  const actionsRef = useRef({ handleSubmit: () => {}, onPrev, onNext, busy: false });

  useEffect(() => {
    scoreRef.current = score;
    actionsRef.current = { handleSubmit, onPrev, onNext, busy: answerLoading || savePending };
  });

  // Auto-focus the score field as soon as the answer is usable so the teacher
  useEffect(() => {
    if (!answerLoading && !savePending) scoreInputRef.current?.focus();
  }, [answerLoading, savePending]);

  /* Keyboard grading shortcuts (best-effort modeless; ignored while typing in
     an input/textarea so the browser editing behavior is never hijacked):
       Enter        → save + advance       Ctrl/⌘+Enter → save (in textarea too)
       ← →         → pages (RTL: ← next, → prev)      ↓ ↑ → next / previous answer
       + / −        → zoom in / out       0 → reset zoom            f → fullscreen */
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    };

    const guard = (fn: () => void) => {
      if (actionsRef.current.busy) return;
      fn();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "Enter") {
          e.preventDefault();
          guard(() => actionsRef.current.handleSubmit());
        }
        return;
      }

      if (isEditableTarget(e.target)) return;

      switch (e.key) {
        case "Enter": {
          // Let buttons/links keep their native Enter activation.
          if (
            e.target instanceof HTMLElement &&
            (e.target.tagName === "BUTTON" || e.target.tagName === "A" || e.target.getAttribute("role") === "button")
          ) {
            return;
          }
          e.preventDefault();
          if (actionsRef.current.busy) break;
          const parsed = parseScoreInput(scoreRef.current, maxPoints);
          if (parsed.ok) actionsRef.current.handleSubmit();
          else scoreInputRef.current?.focus();
          break;
        }
        case "ArrowLeft":
          if (pages.length > 1) {
            e.preventDefault();
            guard(() => setPageIndex((i) => Math.min(pages.length - 1, i + 1)));
          }
          break;
        case "ArrowRight":
          if (pages.length > 1) {
            e.preventDefault();
            guard(() => setPageIndex((i) => Math.max(0, i - 1)));
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          guard(() => actionsRef.current.onNext?.());
          break;
        case "ArrowUp":
          e.preventDefault();
          guard(() => actionsRef.current.onPrev?.());
          break;
        case "+":
        case "=":
          if (pages.length > 0) {
            e.preventDefault();
            guard(() => setZoom((z) => Math.min(z + 0.25, 3)));
          }
          break;
        case "-":
          if (pages.length > 0) {
            e.preventDefault();
            guard(() => setZoom((z) => Math.max(z - 0.25, 0.5)));
          }
          break;
        case "0":
          if (pages.length > 0) {
            e.preventDefault();
            guard(() => setZoom(1));
          }
          break;
        case "f":
        case "F":
          if (pages.length > 0) {
            e.preventDefault();
            guard(() => setFullscreen((v) => !v));
          }
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxPoints, pages.length]);

  const isGraded = answer?.gradingStatus === "graded";

  return (
    <div className="space-y-4">
      {/* ----------------------------- question header + navigation ----------------------------- */}
      <StudioSurfaceCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-studio-fg">
                {questionMeta?.title ?? "السؤال غير متاح"}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-studio-fg-muted">
                {item.student?.name ?? "طالب"} · {formatDateTime(item.answeredAt)}
              </p>
            </div>
            {questionMeta && (
              <StudioChip variant="info" size="sm">
                {questionMeta.typeLabel}
              </StudioChip>
            )}
            <StudioChip variant="accent" size="sm">
              {maxPoints} نقطة
            </StudioChip>
            {isGraded && (
              <StudioChip variant="danger" size="sm" icon={<CheckCheck className="h-3 w-3" />}>
                تم التصحيح
              </StudioChip>
            )}
          </div>

          <div className="flex items-center gap-2">
            <StudioButton variant="secondary" size="sm" onClick={onPrev ?? undefined} disabled={!onPrev}>
              السابق
            </StudioButton>
            <StudioButton variant="secondary" size="sm" onClick={onNext ?? undefined} disabled={!onNext}>
              التالي
            </StudioButton>
          </div>
        </div>

        {isGraded && answer?.gradedBy && (
          <p className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            أُجري تصحيح يدوي سابق لهذه الإجابة{answer.gradedBy.name ? ` بواسطة ${answer.gradedBy.name}` : ""}
            {answer.gradedAt ? ` في ${formatDateTime(answer.gradedAt)}` : ""}. الحفظ الآن سيعدّل هذه الدرجة.
          </p>
        )}
      </StudioSurfaceCard>

      {/* ----------------------------- viewer + grading form ----------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <StudioSurfaceCard className="overflow-hidden p-3">
          <div className="mb-2 flex items-center justify-between px-1 text-xs text-studio-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {pages.length === 0
                ? "لا توجد صفحات إجابة"
                : `صفحة ${safePageIndex + 1} من ${pages.length}`}
            </span>
            {pages.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  disabled={safePageIndex === 0}
                  className="rounded-md px-2 py-1 text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg disabled:pointer-events-none disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
                  disabled={safePageIndex >= pages.length - 1}
                  className="rounded-md px-2 py-1 text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg disabled:pointer-events-none disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            )}
          </div>

          <div className="w-full overflow-hidden rounded-xl border border-studio-border bg-studio-soft">
            {currentUrl ? (
              <ScanImageViewer
                src={currentUrl}
                alt={`صفحة ${safePageIndex + 1}`}
                maxHeight={520}
                zoom={zoom}
                onZoomChange={setZoom}
                fullscreen={fullscreen}
                onFullscreenChange={setFullscreen}
              />
            ) : (
              <div className="flex min-h-[260px] items-center justify-center p-8">
                {pagesLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-studio-accent" />
                ) : (
                  <p className="text-sm text-studio-fg-muted">
                    {answerError ?? (currentPage ? "تعذّر تحميل الصفحة." : "لا توجد صفحات لإظهارها.")}
                  </p>
                )}
              </div>
            )}
          </div>
        </StudioSurfaceCard>

        <StudioSurfaceCard className="p-4">
          <h2 className="mb-4 text-sm font-semibold text-studio-fg">إدخال التصحيح</h2>

          {attemptError && (
            <div className="mb-3 rounded-lg border border-amber/20 bg-amber/10 p-3 text-sm text-amber">
              <p className="inline-flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                {attemptError}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="manual-grade-score" className="mb-1.5 block text-xs font-medium text-studio-fg-muted">
                الدرجة
              </label>
              <div className="flex items-center gap-2">
                <AppInput
                  id="manual-grade-score"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={maxPoints}
                  step="any"
                  placeholder={String(maxPoints)}
                  value={score}
                  ref={scoreInputRef}
                  disabled={answerLoading || savePending}
                  onChange={(e) => setScore(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !savePending && !answerLoading) handleSubmit();
                  }}
                />
                <span className="shrink-0 text-xs text-studio-fg-muted">
                  من {maxPoints}
                </span>
              </div>
              {(clientError || scoreError) && (
                <p className="mt-1.5 text-xs text-destructive">{clientError ?? scoreError}</p>
              )}
            </div>

            <div>
              <label htmlFor="manual-grade-feedback" className="mb-1.5 block text-xs font-medium text-studio-fg-muted">
                ملاحظات (اختياري)
              </label>
              <AppTextarea
                id="manual-grade-feedback"
                rows={4}
                maxLength={5000}
                placeholder="أضف ملاحظة للطالب حول هذا التصحيح..."
                value={feedback}
                disabled={answerLoading || savePending}
                onChange={(e) => setFeedback(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    if (!savePending && !answerLoading) handleSubmit();
                  }
                }}
                className="resize-none"
              />
            </div>

            <StudioButton
              variant="primary"
              size="md"
              className="w-full"
              loading={savePending}
              disabled={answerLoading || savePending}
              icon={!savePending ? <Save className="h-4 w-4" /> : undefined}
              onClick={handleSubmit}
            >
              حفظ التصحيح
            </StudioButton>

            <p className="text-center text-[11px] leading-relaxed text-studio-fg-muted">
              بعد الحفظ سيتم الانتقال تلقائياً إلى الإجابة التالية، وسيُعاد احتساب مجموع المحاولة.
            </p>
          </div>
        </StudioSurfaceCard>
      </div>

      {/* ----------------------------- keyboard shortcut bar ----------------------------- */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl border border-studio-border bg-studio-surface/60 px-4 py-2 text-[11px] text-studio-fg-muted md:flex">
        <span className="inline-flex items-center gap-1.5 font-medium text-studio-fg-subtle">
          <Keyboard className="h-3.5 w-3.5" />
          اختصارات التصحيح
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">Enter</kbd>
          حفظ والانتقال
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">Ctrl</kbd>
          +
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">Enter</kbd>
          حفظ من الملاحظات
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">←</kbd>
          /
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">→</kbd>
          صفحات الإجابة
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">↓</kbd>
          /
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">↑</kbd>
          إجابة تالية/سابقة
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">+</kbd>
          /
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">−</kbd>
          تكبير/تصغير (
          <kbd className="rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">0</kbd>
          ضبط)
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">F</kbd>
          ملء الشاشة
        </span>
      </div>
    </div>
  );
}