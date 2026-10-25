"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ArrowRight, Camera, Check, CheckCircle2 } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogFooter,
  AppDialogDescription,
  AppInput,
  AppTextarea,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppSwitch,
  Label,
} from "@/components/ui";
import { StudioButton } from "@/components/studio";
import { cn } from "@/lib/cn";
import {
  QUESTION_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  VISIBILITY_OPTIONS,
  POINT_PRESETS,
  QUESTION_FORMAT_CONFIG,
} from "@/features/exam-bank/constants";
import {
  useCreateQuestion,
  useUpdateQuestion,
  useAddExamQuestion,
  useCategoryTree,
  useBanks,
} from "@/features/exam-bank/hooks";
import { QuestionBuilderForm } from "./QuestionBuilderForm";
import { ScannedQuestionEditor } from "./ScannedQuestionEditor";
import { ScanImageViewer } from "./ScanImageViewer";
import type {
  Question,
  QuestionType,
  QuestionFormat,
  Difficulty,
  QuestionVisibility,
  QuestionContent,
} from "@/features/exam-bank/types";

export interface QuestionFormValues {
  title: string;
  description: string;
  type: QuestionType;
  questionFormat: QuestionFormat;
  difficulty: Difficulty;
  categoryId: string;
  bankId: string;
  tags: string;
  points: string;
  estimatedTime: string;
  language: string;
  visibility: QuestionVisibility;
  shuffleOptions: boolean;
  content: QuestionContent;
}

export function defaultQuestionForm(
  type: QuestionType = "single_choice",
  categoryId = "",
  bankId = "",
): QuestionFormValues {
  return {
    title: "",
    description: "",
    type,
    questionFormat: "text",
    difficulty: "medium",
    categoryId,
    bankId,
    tags: "",
    points: "1",
    estimatedTime: "",
    language: "ar",
    visibility: "private",
    shuffleOptions: false,
    content: {},
  };
}

export function buildQuestionPayload(
  values: QuestionFormValues,
  extra?: { mediaAssetId?: string | null },
): Record<string, unknown> {
  const isImage = values.questionFormat === "image";
  const payload: Record<string, unknown> = {
    title: isImage ? (values.title.trim() || undefined) : values.title,
    description: values.description || null,
    type: values.type,
    question_format: values.questionFormat,
    difficulty: values.difficulty,
    category_id: values.categoryId ? Number(values.categoryId) : null,
    bank_id: values.bankId ? Number(values.bankId) : null,
    tags: values.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    points: Number(values.points) || 0,
    estimated_time: values.estimatedTime ? Number(values.estimatedTime) : null,
    language: values.language,
    visibility: values.visibility,
    shuffle_options: values.shuffleOptions,
    content: values.content,
  };

  if (extra?.mediaAssetId) {
    payload.media_asset_id = Number(extra.mediaAssetId);
  }

  return payload;
}

interface QuestionFormFieldsProps {
  values: QuestionFormValues;
  onChange: (patch: Partial<QuestionFormValues>) => void;
  disabled?: boolean;
  hideTitle?: boolean;
  hideFormat?: boolean;
}

export function QuestionFormFields({
  values,
  onChange,
  disabled,
  hideTitle = false,
  hideFormat = false,
}: QuestionFormFieldsProps) {
  const { data: categories = [] } = useCategoryTree();
  const { data: banksData } = useBanks();
  const banks = banksData?.data ?? [];

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <>
          <div>
            <Label htmlFor="q-title" className="mb-1.5 block text-xs font-medium text-studio-fg-muted">
              العنوان
            </Label>
            <AppInput
              id="q-title"
              value={values.title}
              disabled={disabled}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="عنوان السؤال"
              className="bg-studio-soft"
            />
          </div>

          <div>
            <Label htmlFor="q-description" className="mb-1.5 block text-xs font-medium text-studio-fg-muted">
              الوصف (اختياري)
            </Label>
            <AppTextarea
              id="q-description"
              value={values.description}
              disabled={disabled}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="وصف مختصر للسؤال..."
              className="bg-studio-soft"
            />
          </div>
        </>
      )}

      {!hideFormat && (
        <div className="space-y-2">
          <Label className="block text-xs font-medium text-studio-fg-muted">شكل السؤال</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["text", "image"] as const).map((fmt) => {
              const cfg = QUESTION_FORMAT_CONFIG[fmt];
              const Icon = cfg.icon;
              const active = values.questionFormat === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ questionFormat: fmt })}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border-2 p-3 text-start transition-all",
                    active
                      ? "border-studio-accent bg-studio-accent/5"
                      : "border-studio-border bg-studio-surface hover:border-studio-accent-border",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      cfg.bg,
                      cfg.color,
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-studio-fg">{cfg.label}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-studio-fg-muted">
                      {cfg.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-studio-fg-muted">نوع الإجابة</Label>
          <AppSelect
            value={values.type}
            disabled={disabled}
            onValueChange={(v) => onChange({ type: v as QuestionType })}
          >
            <AppSelectTrigger className="bg-studio-soft" aria-label="نوع الإجابة">
              <AppSelectValue />
            </AppSelectTrigger>
            <AppSelectContent>
              {QUESTION_TYPE_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-medium text-studio-fg-muted">الصعوبة</Label>
          <AppSelect
            value={values.difficulty}
            disabled={disabled}
            onValueChange={(v) => onChange({ difficulty: v as Difficulty })}
          >
            <AppSelectTrigger className="bg-studio-soft" aria-label="الصعوبة">
              <AppSelectValue />
            </AppSelectTrigger>
            <AppSelectContent>
              {DIFFICULTY_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-medium text-studio-fg-muted">التصنيف</Label>
          <AppSelect
            value={values.categoryId}
            disabled={disabled}
            onValueChange={(v) => onChange({ categoryId: v })}
          >
            <AppSelectTrigger className="bg-studio-soft" aria-label="التصنيف">
              <AppSelectValue placeholder="بدون تصنيف" />
            </AppSelectTrigger>
            <AppSelectContent>
              <AppSelectItem value="">بدون تصنيف</AppSelectItem>
              {categories.map((cat) => (
                <AppSelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-medium text-studio-fg-muted">
            بنك الأسئلة (اختياري)
          </Label>
          <AppSelect
            value={values.bankId}
            disabled={disabled}
            onValueChange={(v) => onChange({ bankId: v })}
          >
            <AppSelectTrigger className="bg-studio-soft" aria-label="بنك الأسئلة">
              <AppSelectValue placeholder="بدون بنك" />
            </AppSelectTrigger>
            <AppSelectContent>
              <AppSelectItem value="">بدون بنك</AppSelectItem>
              {banks.map((b) => (
                <AppSelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div>
          <Label htmlFor="q-points" className="mb-1.5 block text-xs font-medium text-studio-fg-muted">
            النقاط
          </Label>
          <div className="flex gap-2">
            <AppInput
              id="q-points"
              type="number"
              value={values.points}
              disabled={disabled}
              onChange={(e) => onChange({ points: e.target.value })}
              className="bg-studio-soft"
            />
            <div className="flex gap-1">
              {POINT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ points: String(p) })}
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-md border text-xs font-medium transition-colors",
                    String(p) === values.points
                      ? "border-studio-accent bg-studio-accent-soft text-studio-accent"
                      : "border-studio-border text-studio-fg-muted hover:border-studio-accent-border",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="q-estimated" className="mb-1.5 block text-xs font-medium text-studio-fg-muted">
            الوقت التقديري (دقيقة)
          </Label>
          <AppInput
            id="q-estimated"
            type="number"
            value={values.estimatedTime}
            disabled={disabled}
            onChange={(e) => onChange({ estimatedTime: e.target.value })}
            placeholder="اختياري"
            className="bg-studio-soft"
          />
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-medium text-studio-fg-muted">الرؤية</Label>
          <AppSelect
            value={values.visibility}
            disabled={disabled}
            onValueChange={(v) => onChange({ visibility: v as QuestionVisibility })}
          >
            <AppSelectTrigger className="bg-studio-soft" aria-label="الرؤية">
              <AppSelectValue />
            </AppSelectTrigger>
            <AppSelectContent>
              {VISIBILITY_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div>
          <Label htmlFor="q-tags" className="mb-1.5 block text-xs font-medium text-studio-fg-muted">
            الوسم (مفصولة بفاصلة)
          </Label>
          <AppInput
            id="q-tags"
            value={values.tags}
            disabled={disabled}
            onChange={(e) => onChange({ tags: e.target.value })}
            placeholder="مثال: جبر، معادلات"
            className="bg-studio-soft"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <AppSwitch
          checked={values.shuffleOptions}
          disabled={disabled}
          onCheckedChange={(c) => onChange({ shuffleOptions: c })}
          aria-label="خلط الخيارات عند العرض"
        />
        <div className="flex items-center gap-2">
          <Label htmlFor="q-language" className="text-xs font-medium text-studio-fg-muted">
            اللغة:
          </Label>
          <AppInput
            id="q-language"
            value={values.language}
            disabled={disabled}
            onChange={(e) => onChange({ language: e.target.value })}
            className="h-9 w-20 bg-studio-soft"
          />
        </div>
      </div>

      <div className="rounded-xl border border-studio-border bg-studio-soft p-4">
        <p className="mb-3 text-sm font-semibold text-studio-fg">
          {values.questionFormat === "image" ? "خيارات الإجابة" : "محتوى السؤال"}
        </p>
        <QuestionBuilderForm
          type={values.type}
          value={values.content}
          disabled={disabled}
          onChange={(content) => onChange({ content })}
        />
      </div>
    </div>
  );
}

type ImageCreatePhase = "format" | "scan" | "metadata";

const IMAGE_PHASE_STEPS: { key: ImageCreatePhase; label: string; num: number }[] = [
  { key: "format", label: "نوع السؤال", num: 1 },
  { key: "scan", label: "تصوير السؤال", num: 2 },
  { key: "metadata", label: "الإجابات والإعدادات", num: 3 },
];

const PHASE_ORDER: Record<ImageCreatePhase, number> = { format: 0, scan: 1, metadata: 2 };

function StepIndicator({ currentPhase, scanReady }: { currentPhase: ImageCreatePhase; scanReady?: boolean }) {
  const currentIdx = PHASE_ORDER[currentPhase];
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs" dir="rtl">
      {IMAGE_PHASE_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx || (currentPhase === "scan" && scanReady && idx === 1);
        const isActive = idx === currentIdx && !(currentPhase === "scan" && scanReady && idx === 1);
        return (
          <div key={step.key} className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors shrink-0",
                isCompleted && "bg-emerald-500 text-white",
                isActive && "bg-studio-accent text-white",
                !isCompleted && !isActive && "bg-studio-border text-studio-fg-muted",
              )}
            >
              {isCompleted ? <Check className="h-3 w-3" /> : step.num}
            </div>
            <span
              className={cn(
                "font-medium whitespace-nowrap",
                isActive && "text-studio-fg",
                !isActive && "text-studio-fg-muted",
              )}
            >
              {step.label}
            </span>
            {idx < IMAGE_PHASE_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-3 sm:w-5 shrink-0",
                  idx < currentIdx ? "bg-emerald-500" : "bg-studio-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface CreateQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (question: Question) => void;
  defaultType?: QuestionType;
  bankId?: number;
  categoryId?: number;
  examId?: string | number;
}

export function CreateQuestionDialog({
  open,
  onOpenChange,
  onCreated,
  defaultType = "single_choice",
  bankId,
  categoryId,
  examId,
}: CreateQuestionDialogProps) {
  const [values, setValues] = useState<QuestionFormValues>(() =>
    defaultQuestionForm(defaultType, categoryId ? String(categoryId) : "", bankId ? String(bankId) : ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [createdQuestion, setCreatedQuestion] = useState<Question | null>(null);
  const [imagePhase, setImagePhase] = useState<ImageCreatePhase>("format");
  const [completedScanUrl, setCompletedScanUrl] = useState<string | null>(null);
  const [scanMediaAssetId, setScanMediaAssetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const addExamQuestion = useAddExamQuestion();

  const isImageFormat = values.questionFormat === "image";
  const canContinueScan = Boolean(scanMediaAssetId);

  useEffect(() => {
    if (open) {
      setValues(
        defaultQuestionForm(
          defaultType,
          categoryId ? String(categoryId) : "",
          bankId ? String(bankId) : "",
        ),
      );
      setError(null);
      setCreatedQuestion(null);
      setImagePhase("format");
      setCompletedScanUrl(null);
      setScanMediaAssetId(null);
    }
  }, [open, defaultType, bankId, categoryId]);

  const handlePatch = (patch: Partial<QuestionFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const handleFormatChange = useCallback((patch: Partial<QuestionFormValues>) => {
    setValues((prev) => {
      const next = { ...prev, ...patch };
      if (patch.questionFormat && patch.questionFormat !== "image") {
        setImagePhase("format");
        setCreatedQuestion(null);
      setCompletedScanUrl(null);
      setScanMediaAssetId(null);
      }
      return next;
    });
  }, []);

  const handleCreateForScan = useCallback(async () => {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const created = (await createMutation.mutateAsync(
        buildQuestionPayload(values),
      )) as Question;
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
      setCreatedQuestion(created);
      setImagePhase("scan");
      setCompletedScanUrl(null);
      setScanMediaAssetId(null);
    } catch {
      setError("تعذر إنشاء السؤال، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }, [values, createMutation, addExamQuestion, examId, isSubmitting]);

  const handleScanUploaded = useCallback((payload: { scanUrl: string; scanAssetId: string }) => {
    setCompletedScanUrl(payload.scanUrl);
    setScanMediaAssetId(payload.scanAssetId);
  }, []);

  const handleScanBack = useCallback(() => {
    setImagePhase("format");
    setCreatedQuestion(null);
    setCompletedScanUrl(null);
    setScanMediaAssetId(null);
  }, []);

  const handleContinueToMetadata = useCallback(() => {
    setImagePhase("metadata");
  }, []);

  const handleMetadataBack = useCallback(() => {
    setImagePhase("scan");
  }, []);

  const handleScanRemoved = useCallback(() => {
    setCompletedScanUrl(null);
    setScanMediaAssetId(null);
  }, []);

  const handleSubmitMetadata = useCallback(async () => {
    if (!createdQuestion || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const saved = (await updateMutation.mutateAsync({
        id: createdQuestion.id,
        payload: buildQuestionPayload(values, { mediaAssetId: scanMediaAssetId }),
      })) as Question;
      onOpenChange(false);
      onCreated?.(saved);
    } catch {
      setError("تعذر حفظ التغييرات، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }, [createdQuestion, values, scanMediaAssetId, updateMutation, onOpenChange, onCreated, isSubmitting]);

  const handleFinalTextSubmit = useCallback(async () => {
    if (!values.title.trim()) {
      setError("الرجاء إدخال عنوان للسؤال.");
      return;
    }
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const created = (await createMutation.mutateAsync(
        buildQuestionPayload(values),
      )) as Question;
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
      onOpenChange(false);
      onCreated?.(created);
    } catch {
      setError("تعذر إنشاء السؤال، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }, [values, createMutation, addExamQuestion, examId, onOpenChange, onCreated, isSubmitting]);

  const isMutating = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const dialogTitle = (() => {
    if (isImageFormat) {
      if (imagePhase === "scan") return "تصوير / رفع السؤال";
      if (imagePhase === "metadata") return "إعداد السؤال المصوّر";
      return "إنشاء سؤال مصوّر";
    }
    return "إنشاء سؤال جديد";
  })();

  const dialogDescription = (() => {
    if (isImageFormat) {
      if (imagePhase === "scan") return "التقط أو ارفع صورة السؤال لمعالجتها.";
      if (imagePhase === "metadata") return "أكمل إعداد الإجابة والنقاط.";
      return "التقط أو ارفع صورة السؤال، ثم أكمل تفاصيل الإجابة.";
    }
    return "أضف تفاصيل السؤال ومحتواه حسب النوع المختار.";
  })();

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-3xl">
        <AppDialogHeader>
          <AppDialogTitle>{dialogTitle}</AppDialogTitle>
          <AppDialogDescription>{dialogDescription}</AppDialogDescription>
          {isImageFormat && (
            <div className="pt-1">
              <StepIndicator currentPhase={imagePhase} scanReady={canContinueScan} />
            </div>
          )}
        </AppDialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pe-1">
          {isImageFormat && imagePhase === "scan" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleScanBack}
                className="flex items-center gap-1.5 text-sm font-medium text-studio-fg-muted transition-colors hover:text-studio-fg"
              >
                <ArrowRight className="h-4 w-4" />
                العودة لاختيار الشكل
              </button>
              <ScannedQuestionEditor
                questionId={createdQuestion?.id ?? ""}
                scanUrl={completedScanUrl}
                onScanUploaded={handleScanUploaded}
                onScanRemoved={handleScanRemoved}
                disabled={false}
              />
            </div>
          )}

          {isImageFormat && imagePhase === "metadata" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleMetadataBack}
                className="flex items-center gap-1.5 text-sm font-medium text-studio-fg-muted transition-colors hover:text-studio-fg"
              >
                <ArrowRight className="h-4 w-4" />
                العودة للتصوير
              </button>
              {completedScanUrl && (
                <ScanImageViewer
                  src={completedScanUrl}
                  alt="السؤال المصوّر"
                  maxHeight={250}
                  showControls={true}
                />
              )}
              <QuestionFormFields
                values={values}
                onChange={handlePatch}
                disabled={isMutating}
                hideTitle
                hideFormat
              />
            </div>
          )}

          {!isImageFormat && (
            <>
              <QuestionFormFields
                values={values}
                onChange={handleFormatChange}
                disabled={createMutation.isPending}
              />
            </>
          )}

          {error && (
            <p role="alert" className="mt-3 text-sm text-studio-danger">{error}</p>
          )}
        </div>

        <AppDialogFooter>
          <StudioButton
            variant="secondary"
            onClick={() => {
              if (isImageFormat && imagePhase === "scan") {
                handleScanBack();
              } else if (isImageFormat && imagePhase === "metadata") {
                handleMetadataBack();
              } else {
                onOpenChange(false);
              }
            }}
            disabled={isMutating}
          >
            {isImageFormat && imagePhase !== "format" ? "رجوع" : "إلغاء"}
          </StudioButton>

          {isImageFormat && imagePhase === "format" && (
            <StudioButton
              onClick={handleCreateForScan}
              loading={createMutation.isPending}
              className="gap-2"
            >
              {!createMutation.isPending && <Camera className="h-4 w-4" />}
              تصوير السؤال
            </StudioButton>
          )}

          {isImageFormat && imagePhase === "scan" && (
            <>
              {scanMediaAssetId && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  تم المسح بنجاح
                </span>
              )}
              <StudioButton
                onClick={handleContinueToMetadata}
                disabled={!canContinueScan}
                loading={createMutation.isPending}
                className="gap-2"
              >
                متابعة إلى إعداد السؤال
              </StudioButton>
            </>
          )}

          {isImageFormat && imagePhase === "metadata" && (
            <StudioButton
              onClick={handleSubmitMetadata}
              loading={updateMutation.isPending}
              className="gap-2"
            >
              {!updateMutation.isPending && <Plus className="h-4 w-4" />}
              إنشاء السؤال
            </StudioButton>
          )}

          {!isImageFormat && (
            <StudioButton
              onClick={handleFinalTextSubmit}
              loading={createMutation.isPending}
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
