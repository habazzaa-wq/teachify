"use client";

import {
  Camera,
  CircleAlert,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseQuestionDocument } from "@/components/structured-question";
import { StudioButton } from "@/components/studio";
import {
  AppDialog,
  AppDialogContent,
  AppDialogDescription,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogTitle,
} from "@/components/ui";
import {
  useCreateQuestionImport,
  useCreateQuestion,
  useAddExamQuestion,
  useRetryQuestionImport,
} from "@/features/exam-bank/hooks";
import { examBankService } from "@/features/exam-bank/services";
import type { QuestionImportStatus } from "@/features/exam-bank/services/import-types";
import type { Question } from "@/features/exam-bank/types";
import { buildQuestionPayload, defaultQuestionForm, QuestionFormFields, type QuestionFormValues } from "../CreateQuestionDialog";
import { DocumentReviewEditor } from "./DocumentReviewEditor";
import { ProcessingStages } from "./ProcessingStages";

type ImportPhase = "source" | "processing" | "review";

const POLL_INTERVAL_MS = 1500;

interface QuestionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (question: Question) => void;
  bankId?: number;
  categoryId?: number;
  examId?: string | number;
}

/**
 * Structured question import wizard:
 *   capture/upload → real-time pipeline stages → teacher review of the
 *   extracted document → answer configuration → question creation.
 */
export function QuestionImportDialog({
  open,
  onOpenChange,
  onCreated,
  bankId,
  categoryId,
  examId,
}: QuestionImportDialogProps) {
  const [phase, setPhase] = useState<ImportPhase>("source");
  const [status, setStatus] = useState<QuestionImportStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractionMode, setExtractionMode] = useState<"auto"|"vision"|"local">("auto");
  const [values, setValues] = useState<QuestionFormValues>(() =>
    defaultQuestionForm("single_choice", categoryId ? String(categoryId) : "", bankId ? String(bankId) : ""),
  );
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createImport = useCreateQuestionImport();
  const retryImport = useRetryQuestionImport();
  const createMutation = useCreateQuestion();
  const addExamQuestion = useAddExamQuestion();

  const reset = useCallback(() => {
    setPhase("source");
    setStatus(null);
    setError(null);
    setValues(defaultQuestionForm("single_choice", categoryId ? String(categoryId) : "", bankId ? String(bankId) : ""));
  }, [bankId, categoryId]);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  // Poll the import while processing — reflects only real backend stages.
  useEffect(() => {
    if (phase !== "processing" || !status?.id) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const next = await examBankService.getQuestionImport(status.id);
        if (cancelled) return;
        setStatus(next);
        if (next.status === "ready") setPhase("review");
        if (next.status === "failed") return; // stay on processing view w/ error
      } catch {
        /* transient network errors: keep polling */
      }
    };

    const timer = setInterval(tick, POLL_INTERVAL_MS);
    void tick();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [phase, status?.id]);

  // When extraction finishes, derive a working title from the first text run
  // so the teacher almost never has to type one.
  useEffect(() => {
    if (phase !== "review" || !status?.document) return;
    const doc = parseQuestionDocument(status.document);
    if (!doc) return;

    let suggestion: string | null = null;
    for (const block of doc.blocks) {
      if (block.type === "paragraph" || block.type === "heading") {
        const text = block.runs
          .map((r) => ("text" in r ? r.text : ""))
          .join(" ")
          .trim();
        if (text.length >= 8) {
          suggestion = text.slice(0, 80);
          break;
        }
      }
    }

    setValues((prev) => (prev.title.trim() === "" && suggestion ? { ...prev, title: suggestion } : prev));
  }, [phase, status?.document]);

  const startUpload = useCallback(
    async (file: File) => {
      setError(null);
      setStatus(null);
      try {
        const created = await createImport.mutateAsync({ file, mode: extractionMode });
        setStatus(created);
        setPhase("processing");
      } catch (err: unknown) {
        const message =
          ((err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors?.file?.[0] ?? null) ||
          ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? null) ||
          "تعذر رفع الصورة. تأكد من الصيغة والحجم وحاول مجدداً.";
        setError(message);
      }
    },
    [createImport, extractionMode],
  );

  const handleFilePicked = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) void startUpload(file);
    },
    [startUpload],
  );

  const handleRetry = useCallback(async () => {
    if (!status?.id) return;
    setError(null);
    try {
      const next = await retryImport.mutateAsync(status.id);
      setStatus(next);
    } catch {
      setError("تعذرت إعادة المحاولة.");
    }
  }, [retryImport, status?.id]);

  const handlePatch = (patch: Partial<QuestionFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const documentDraft =
    status?.document != null ? parseQuestionDocument(status.document) : null;

  const hasUnresolved =
    documentDraft?.blocks.some((b) => b.type === "unresolved_visual") ?? false;

  const canSubmit =
    phase === "review" && documentDraft !== null && documentDraft.blocks.length > 0;

  const handleSubmit = useCallback(async () => {
    if (!documentDraft || !canSubmit) return;
    setError(null);
    try {
      const payload = buildQuestionPayload(values);
      payload.question_format = "structured";
      payload.content_document = JSON.stringify(documentDraft);
      delete payload.media_asset_id;

      const created = (await createMutation.mutateAsync(payload)) as Question;
      if (examId) {
        try {
          await addExamQuestion.mutateAsync({
            id: examId,
            payload: { question_id: Number(created.id) },
          });
        } catch {
          /* linking failure should not block creation */
        }
      }
      // Best-effort cleanup of the consumed import.
      void examBankService.deleteQuestionImport(status?.id ?? "").catch(() => undefined);
      onOpenChange(false);
      onCreated?.(created);
    } catch {
      setError("تعذر إنشاء السؤال من المستند المستخرج. راجع الحقول وحاول مجدداً.");
    }
  }, [addExamQuestion, canSubmit, createMutation, documentDraft, examId, onCreated, onOpenChange, status?.id, values]);

  const isProcessing = phase === "processing" && status?.status === "processing";
  const isFailed = phase === "processing" && status?.status === "failed";
  const isMutating = createImport.isPending || retryImport.isPending || createMutation.isPending;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-3xl">
        <AppDialogHeader>
          <AppDialogTitle>
            {phase === "source"
              ? "استيراد سؤال من صورة"
              : phase === "processing"
                ? "جاري تحليل السؤال"
                : "مراجعة السؤال المستخرج"}
          </AppDialogTitle>
          <AppDialogDescription>
            {phase === "source"
              ? "التقط صورة للسؤال أو ارفعها، وسيحولها النظام إلى سؤال قابل للتعديل."
              : phase === "processing"
                ? "يتم الآن استخراج النص والمعادلات والرسومات من الصورة."
                : "راجع المحتوى المستخرج، ثم أكمل إعدادات الإجابة."}
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pe-1">
          {phase === "source" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["auto","vision","local"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setExtractionMode(m)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${extractionMode===m ? "border-studio-accent bg-studio-accent text-white" : "border-studio-border bg-studio-surface text-studio-fg-muted hover:border-studio-accent-border"}`}>{m==="auto"?"تلقائي":m==="vision"?"ذكاء بصري":"محلي"}</button>
                ))}
              </div>
              <p className="text-xs text-studio-fg-muted">{extractionMode==="auto"?"يجرب الذكاء البصري أولاً ثم ينتقل للمحلي عند الحاجة.":extractionMode==="vision"?"يستخدم الذكاء البصري فقط ويظهر خطأ واضحاً عند الفشل.":"معالجة محلية بدون تكلفة خارجية."}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-start gap-3 rounded-xl border-2 border-studio-border bg-studio-surface p-5 text-start transition-all hover:border-studio-accent-border hover:bg-studio-accent/5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-studio-accent-soft text-studio-accent"><Camera className="h-5 w-5" /></span>
                  <span><span className="block text-sm font-semibold text-studio-fg">التقاط بالكاميرا</span><span className="mt-0.5 block text-xs leading-snug text-studio-fg-muted">صوّر الورقة بإضاءة جيدة وتأكد من وضوح النص.</span></span>
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-start gap-3 rounded-xl border-2 border-studio-border bg-studio-surface p-5 text-start transition-all hover:border-studio-accent-border hover:bg-studio-accent/5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-studio-accent-soft text-studio-accent"><Upload className="h-5 w-5" /></span>
                  <span><span className="block text-sm font-semibold text-studio-fg">رفع ملف صورة</span><span className="mt-0.5 block text-xs leading-snug text-studio-fg-muted">JPEG أو PNG أو WebP بحد أقصى 10 ميجابايت.</span></span>
                </button>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFilePicked} />
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFilePicked} />
                {error && <p role="alert" className="text-sm text-studio-danger sm:col-span-2">{error}</p>}
                {createImport.isPending && <div className="flex items-center gap-2 text-sm text-studio-fg-muted sm:col-span-2"><Loader2 className="h-4 w-4 animate-spin" />جاري رفع الصورة...</div>}
              </div>
            </div>
          )}

          {phase === "processing" && status && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-studio-soft px-2 py-1 text-studio-fg-muted">المطلوب: {status.requestedMode}</span>
                {status.usedMode && <span className="rounded-full bg-studio-accent-soft px-2 py-1 text-studio-accent">المستخدم: {status.usedMode}</span>}
                {status.fallbackUsed && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">تم التبديل للمحلي ({status.fallbackReason})</span>}
              </div>
              <ProcessingStages stages={status.stages} />
              {isProcessing && (
                <p className="flex items-center gap-2 text-xs text-studio-fg-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  قد تستغرق المعالجة حتى دقيقة واحدة حسب جودة الصورة.
                </p>
              )}
              {isFailed && (
                <div className="space-y-3 rounded-xl border border-red-300 bg-red-50/60 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-red-700">
                    <CircleAlert className="h-4 w-4" />
                    فشل تحليل الصورة
                  </p>
                  {status.error?.message && (
                    <p dir="auto" className="text-sm text-red-700">{status.error.message}</p>
                  )}
                  {(status.error?.errors ?? []).length > 0 && (
                    <ul className="list-inside list-disc space-y-1 text-xs text-red-700">
                      {status.error!.errors!.map((e, i) => (
                        <li key={i} dir="auto">{e}</li>
                      ))}
                    </ul>
                  )}
                  <StudioButton variant="secondary" size="sm" onClick={() => void handleRetry()} loading={retryImport.isPending} className="gap-2">
                    {!retryImport.isPending && <RefreshCw className="h-3.5 w-3.5" />}
                    إعادة المحاولة
                  </StudioButton>
                </div>
              )}
            </div>
          )}

          {phase === "review" && documentDraft && (
            <div className="space-y-5">
              <DocumentReviewEditor
                document={documentDraft}
                onChange={(next) =>
                  setStatus((prev) => (prev ? { ...prev, document: next } : prev))
                }
                disabled={isMutating}
              />

              <div className="border-t border-studio-border pt-4">
                <QuestionFormFields values={values} onChange={handlePatch} hideFormat disabled={isMutating} />
              </div>

              {hasUnresolved && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  تنبيه: لا يزال هناك عناصر غير مستخرجة في المحتوى. أكملها قبل الإنشاء لضمان اكتمال السؤال.
                </p>
              )}
            </div>
          )}

          {phase === "review" && !documentDraft && (
            <p className="rounded-xl border border-dashed border-studio-border p-6 text-center text-sm text-studio-fg-muted">
              لم يتم استخراج محتوى قابل للتعديل. أغلق النافذة وأعد رفع صورة أوضح.
            </p>
          )}

          {error && phase !== "source" && (
            <p role="alert" className="mt-3 text-sm text-studio-danger">{error}</p>
          )}
        </div>

        <AppDialogFooter>
          {phase === "source" ? (
            <StudioButton variant="secondary" onClick={() => onOpenChange(false)} disabled={isMutating}>
              إلغاء
            </StudioButton>
          ) : (
            <StudioButton
              variant="secondary"
              onClick={reset}
              disabled={isMutating || isProcessing}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              بدء من جديد
            </StudioButton>
          )}

          {phase === "review" && (
            <StudioButton
              onClick={() => void handleSubmit()}
              loading={createMutation.isPending}
              disabled={!canSubmit}
              className="gap-2"
            >
              {!createMutation.isPending && <Plus className="h-4 w-4" />}
              إنشاء السؤال
            </StudioButton>
          )}
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}
