"use client";

import { useEffect, useState } from "react";
import { Pencil, ArrowRight, Camera } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogFooter,
  AppDialogDescription,
} from "@/components/ui";
import { StudioButton } from "@/components/studio";
import { useQuestion, useUpdateQuestion } from "@/features/exam-bank/hooks";
import {
  QuestionFormFields,
  buildQuestionPayload,
  defaultQuestionForm,
  type QuestionFormValues,
} from "./CreateQuestionDialog";
import { ScannedQuestionEditor } from "./ScannedQuestionEditor";
import type { Question, QuestionContent, QuestionFormat } from "@/features/exam-bank/types";
import { Skeleton } from "@/components/ui";

interface EditQuestionDialogProps {
  questionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (question: Question) => void;
}

export function EditQuestionDialog({
  questionId,
  open,
  onOpenChange,
  onSaved,
}: EditQuestionDialogProps) {
  const { data: question, isLoading } = useQuestion(open ? questionId : null);
  const [values, setValues] = useState<QuestionFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScanEditor, setShowScanEditor] = useState(false);
  const updateMutation = useUpdateQuestion();

  useEffect(() => {
    if (!open || !question) {
      setValues(null);
      setShowScanEditor(false);
      return;
    }
    const q = question as Question;
    const content = (q.content ?? {}) as QuestionContent;
    setValues({
      title: q.title,
      description: q.description ?? "",
      type: q.type,
      questionFormat: (q.questionFormat as QuestionFormat) ?? "text",
      difficulty: q.difficulty,
      categoryId: q.categoryId ?? "",
      bankId: q.bankId ?? "",
      tags: q.tags.join(", "),
      points: String(q.points),
      estimatedTime: q.estimatedTime != null ? String(q.estimatedTime) : "",
      language: q.language,
      visibility: q.visibility,
      shuffleOptions: q.shuffleOptions,
      content,
    });
    setError(null);
    setShowScanEditor(false);
  }, [open, question]);

  const handlePatch = (patch: Partial<QuestionFormValues>) =>
    setValues((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleSubmit = async () => {
    if (!values || !questionId) return;
    if (!values.title.trim()) {
      setError("الرجاء إدخال عنوان للسؤال.");
      return;
    }
    setError(null);
    try {
      const saved = (await updateMutation.mutateAsync({
        id: questionId,
        payload: buildQuestionPayload(values),
      })) as Question;
      if (values.questionFormat === "image") {
        setShowScanEditor(true);
      } else {
        onOpenChange(false);
        onSaved?.(saved);
      }
    } catch {
      setError("تعذر حفظ التغييرات، حاول مرة أخرى.");
    }
  };

  const isEditingScan = values?.questionFormat === "image" && showScanEditor && question;
  const isImageFormat = values?.questionFormat === "image";

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-3xl">
        <AppDialogHeader>
          <AppDialogTitle>
            {isEditingScan
              ? "صورة السؤال الممسوح"
              : isImageFormat
                ? "تحرير سؤال ممسوح"
                : "تحرير السؤال"}
          </AppDialogTitle>
          <AppDialogDescription>
            {isEditingScan
              ? "استبدل أو حدّث صورة السؤال الممسوحة."
              : "عدّل تفاصيل السؤال ومحتواه ثم احفظ التغييرات."}
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pe-1">
          {isLoading && !values ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isEditingScan ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowScanEditor(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-studio-fg-muted transition-colors hover:text-studio-fg"
              >
                <ArrowRight className="h-4 w-4" />
                العودة لبيانات السؤال
              </button>
              <ScannedQuestionEditor
                questionId={question.id}
                scanUrl={question.scanUrl}
                onScanUploaded={() => {
                  onOpenChange(false);
                  onSaved?.(question);
                }}
                onScanRemoved={() => {
                  setShowScanEditor(false);
                }}
                disabled={false}
              />
            </div>
          ) : values ? (
            <>
              {isImageFormat && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Camera className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="flex-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    هذا سؤال ممسوح. احفظ البيانات ثم حدّث الصورة إن لزم الأمر.
                  </p>
                </div>
              )}
              <QuestionFormFields
                values={values}
                onChange={handlePatch}
                disabled={updateMutation.isPending}
              />
            </>
          ) : null}

          {error && <p role="alert" className="mt-3 text-sm text-studio-danger">{error}</p>}
        </div>

        <AppDialogFooter>
          <StudioButton
            variant="secondary"
            onClick={() => {
              if (isEditingScan) {
                setShowScanEditor(false);
              } else {
                onOpenChange(false);
              }
            }}
            disabled={updateMutation.isPending}
          >
            {isEditingScan ? "رجوع" : "إلغاء"}
          </StudioButton>
          {!isEditingScan && (
            <StudioButton
              onClick={handleSubmit}
              loading={updateMutation.isPending}
              className="gap-2"
              disabled={!values}
            >
              {!updateMutation.isPending && <Pencil className="h-4 w-4" />}
              {isImageFormat ? "حفظ والتصوير" : "حفظ التغييرات"}
            </StudioButton>
          )}
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}
