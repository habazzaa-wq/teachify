"use client";

import { useEffect, useState } from "react";
import { Plus, ScanLine, FileText } from "lucide-react";
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
  useAddExamQuestion,
  useCategoryTree,
  useBanks,
} from "@/features/exam-bank/hooks";
import { QuestionBuilderForm } from "./QuestionBuilderForm";
import { ScannedQuestionEditor } from "./ScannedQuestionEditor";
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

export function buildQuestionPayload(values: QuestionFormValues): Record<string, unknown> {
  return {
    title: values.title,
    description: values.description || null,
    type: values.type,
    question_format: values.questionFormat,
    difficulty: values.difficulty,
    categoryId: values.categoryId ? Number(values.categoryId) : null,
    bankId: values.bankId ? Number(values.bankId) : null,
    tags: values.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    points: Number(values.points) || 0,
    estimatedTime: values.estimatedTime ? Number(values.estimatedTime) : null,
    language: values.language,
    visibility: values.visibility,
    shuffleOptions: values.shuffleOptions,
    content: values.content,
  };
}

interface QuestionFormFieldsProps {
  values: QuestionFormValues;
  onChange: (patch: Partial<QuestionFormValues>) => void;
  disabled?: boolean;
}

export function QuestionFormFields({
  values,
  onChange,
  disabled,
}: QuestionFormFieldsProps) {
  const { data: categories = [] } = useCategoryTree();
  const { data: banksData } = useBanks();
  const banks = banksData?.data ?? [];

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-studio-fg-muted">النوع</Label>
          <AppSelect
            value={values.type}
            disabled={disabled}
            onValueChange={(v) => onChange({ type: v as QuestionType })}
          >
            <AppSelectTrigger className="bg-studio-soft" aria-label="النوع">
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
        <p className="mb-3 text-sm font-semibold text-studio-fg">محتوى السؤال</p>
        {values.questionFormat === "image" ? (
          <div className="space-y-3">
            <p className="text-xs text-studio-fg-muted">
              ارفع صورة السؤال. ستتم معالجتها تلقائياً إلى مسح وثائقي نظيف.
            </p>
          </div>
        ) : (
          <QuestionBuilderForm
            type={values.type}
            value={values.content}
            disabled={disabled}
            onChange={(content) => onChange({ content })}
          />
        )}
      </div>
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
  const createMutation = useCreateQuestion();
  const addExamQuestion = useAddExamQuestion();

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
    }
  }, [open, defaultType, bankId, categoryId]);

  const handlePatch = (patch: Partial<QuestionFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      setError("الرجاء إدخال عنوان للسؤال.");
      return;
    }
    if (values.questionFormat === "image" && !createdQuestion) {
      setError(null);
    } else {
      setError(null);
    }
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
      if (values.questionFormat === "image") {
        setCreatedQuestion(created);
      } else {
        onOpenChange(false);
        onCreated?.(created);
      }
    } catch {
      setError("تعذر إنشاء السؤال، حاول مرة أخرى.");
    }
  };

  const handleScanUploaded = () => {
    if (createdQuestion) {
      onOpenChange(false);
      onCreated?.(createdQuestion);
    }
  };

  const isScanning = values.questionFormat === "image" && createdQuestion;

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-3xl">
        <AppDialogHeader>
          <AppDialogTitle>
            {isScanning ? "رفع صورة السؤال" : "إنشاء سؤال جديد"}
          </AppDialogTitle>
          <AppDialogDescription>
            {isScanning
              ? "التقط أو ارفع صورة السؤال لمعالجتها."
              : "أضف تفاصيل السؤال ومحتواه حسب النوع المختار."}
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pe-1">
          {isScanning ? (
            <ScannedQuestionEditor
              questionId={createdQuestion.id}
              onScanUploaded={handleScanUploaded}
              disabled={false}
            />
          ) : (
            <>
              <QuestionFormFields
                values={values}
                onChange={handlePatch}
                disabled={createMutation.isPending}
              />
              {error && (
                <p role="alert" className="mt-3 text-sm text-studio-danger">{error}</p>
              )}
            </>
          )}
        </div>

        <AppDialogFooter>
          <StudioButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            {isScanning ? "إنهاء" : "إلغاء"}
          </StudioButton>
          {!isScanning && (
            <StudioButton
              onClick={handleSubmit}
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
