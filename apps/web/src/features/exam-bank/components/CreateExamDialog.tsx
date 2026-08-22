"use client";

import { useEffect, useState } from "react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
  AppDialogFooter,
  AppInput,
  AppTextarea,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  Label,
} from "@/components/ui";
import { StudioButton } from "@/components/studio";
import { useCreateExam } from "@/features/exam-bank/hooks";
import { VISIBILITY_OPTIONS } from "@/features/exam-bank/constants";
import type { Exam, ExamVisibility } from "@/features/exam-bank/types";

interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (exam: Exam) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "الإنجليزية" },
];

const visibilityOptions = VISIBILITY_OPTIONS.filter((o) => o.value !== "all");

export function CreateExamDialog({ open, onOpenChange, onCreated }: CreateExamDialogProps) {
  const createExam = useCreateExam();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState<ExamVisibility>("private");
  const [duration, setDuration] = useState("");
  const [passingScore, setPassingScore] = useState("60");
  const [language, setLanguage] = useState("ar");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setCategory("");
      setVisibility("private");
      setDuration("");
      setPassingScore("60");
      setLanguage("ar");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("الرجاء إدخال عنوان للاختبار");
      return;
    }
    setError(null);
    try {
      const created = await createExam.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        visibility,
        duration: duration ? Number(duration) : null,
        passing_score: passingScore ? Number(passingScore) : 60,
        language,
        status: "draft",
      });
      onOpenChange(false);
      onCreated?.(created);
    } catch {
      setError("تعذّر إنشاء الاختبار، حاول مرة أخرى");
    }
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="!bg-studio-surface !text-studio-fg border-studio-border">
        <AppDialogHeader>
          <AppDialogTitle className="text-studio-fg">إنشاء اختبار جديد</AppDialogTitle>
          <AppDialogDescription className="text-studio-fg-muted">
            أضف اختباراً إلى مكتبة الاختبارات. يمكنك تعديل كافة التفاصيل لاحقاً.
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="exam-title" className="text-studio-fg">
              العنوان <span className="text-studio-danger">*</span>
            </Label>
            <AppInput
              id="exam-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: اختبار منتصف الفصل"
              className="bg-studio-bg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exam-description" className="text-studio-fg">
              الوصف
            </Label>
            <AppTextarea
              id="exam-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للاختبار..."
              className="bg-studio-bg"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exam-category" className="text-studio-fg">
                التصنيف
              </Label>
              <AppInput
                id="exam-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="مثال: رياضيات"
                className="bg-studio-bg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-studio-fg">الرؤية</Label>
              <AppSelect value={visibility} onValueChange={(v) => setVisibility(v as ExamVisibility)}>
                <AppSelectTrigger className="bg-studio-bg">
                  <AppSelectValue placeholder="الرؤية" />
                </AppSelectTrigger>
                <AppSelectContent>
                  {visibilityOptions.map((opt) => (
                    <AppSelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exam-duration" className="text-studio-fg">
                المدة (دقيقة)
              </Label>
              <AppInput
                id="exam-duration"
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="غير محدود"
                className="bg-studio-bg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exam-passing" className="text-studio-fg">
                درجة النجاح
              </Label>
              <AppInput
                id="exam-passing"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="bg-studio-bg"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-studio-fg">اللغة</Label>
              <AppSelect value={language} onValueChange={setLanguage}>
                <AppSelectTrigger className="bg-studio-bg">
                  <AppSelectValue placeholder="اللغة" />
                </AppSelectTrigger>
                <AppSelectContent>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <AppSelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-studio-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <AppDialogFooter>
          <StudioButton variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </StudioButton>
          <StudioButton variant="primary" onClick={handleSubmit} loading={createExam.isPending}>
            إنشاء الاختبار
          </StudioButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

export default CreateExamDialog;
