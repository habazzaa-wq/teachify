"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil } from "lucide-react";
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
  const [editScanUrl, setEditScanUrl] = useState<string | null>(null);
  const [editScanMediaAssetId, setEditScanMediaAssetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateMutation = useUpdateQuestion();

  useEffect(() => {
    if (!open || !question) {
      setValues(null);
      setEditScanUrl(null);
      setEditScanMediaAssetId(null);
      return;
    }
    const q = question as Question;
    const content = (q.content ?? {}) as QuestionContent;
    setValues({
      title: q.title ?? "",
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
    setEditScanUrl(q.scanUrl ?? null);
    setEditScanMediaAssetId(q.scanAssetId ?? null);
  }, [open, question]);

  const handlePatch = (patch: Partial<QuestionFormValues>) =>
    setValues((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleScanUploaded = useCallback((payload: { scanUrl: string; scanAssetId: string }) => {
    setEditScanUrl(payload.scanUrl);
    setEditScanMediaAssetId(payload.scanAssetId);
  }, []);

  const handleScanRemoved = useCallback(() => {
    setEditScanUrl(null);
    setEditScanMediaAssetId(null);
  }, []);

  const isImageFormat = values?.questionFormat === "image";

  const handleSubmit = async () => {
    if (!values || !questionId || isSubmitting) return;
    if (values.questionFormat !== "image" && !values.title.trim()) {
      setError("الرجاء إدخال عنوان للسؤال.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const saved = (await updateMutation.mutateAsync({
        id: questionId,
        payload: buildQuestionPayload(values, { mediaAssetId: isImageFormat ? editScanMediaAssetId : undefined }),
      })) as Question;
      onOpenChange(false);
      onSaved?.(saved);
    } catch {
      setError("تعذر حفظ التغييرات، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-3xl">
        <AppDialogHeader>
          <AppDialogTitle>
            {isImageFormat ? "تحرير سؤال مصوّر" : "تحرير السؤال"}
          </AppDialogTitle>
          <AppDialogDescription>
            {isImageFormat
              ? "حدّث صورة السؤال أو تفاصيل الإجابة."
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
          ) : values ? (
            <>
              {isImageFormat && (
                <div className="mb-4 space-y-4">
                  <div className="rounded-xl border border-studio-border bg-studio-soft p-4">
                    <p className="mb-3 text-sm font-semibold text-studio-fg">السؤال المصوّر</p>
                    <ScannedQuestionEditor
                      questionId={question!.id}
                      scanUrl={editScanUrl}
                      onScanUploaded={handleScanUploaded}
                      onScanRemoved={handleScanRemoved}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
              )}

              <QuestionFormFields
                values={values}
                onChange={handlePatch}
                disabled={updateMutation.isPending}
                hideTitle={isImageFormat}
                hideFormat={isImageFormat}
              />
            </>
          ) : null}

          {error && <p role="alert" className="mt-3 text-sm text-studio-danger">{error}</p>}
        </div>

        <AppDialogFooter>
          <StudioButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            إلغاء
          </StudioButton>
          <StudioButton
            onClick={handleSubmit}
            loading={updateMutation.isPending}
            className="gap-2"
            disabled={!values}
          >
            {!updateMutation.isPending && <Pencil className="h-4 w-4" />}
            حفظ التغييرات
          </StudioButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}
