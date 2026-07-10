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
  AppSwitch,
} from "@/components/ui";
import { StudioButton } from "@/components/studio";
import { useUpdateExam } from "@/features/exam-bank/hooks";
import { VISIBILITY_OPTIONS } from "@/features/exam-bank/constants";
import type { Exam } from "@/features/exam-bank/types";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

interface ExamSettingsDialogProps {
  exam: Exam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (exam: Exam) => void;
}

interface SettingsForm {
  title: string;
  description: string;
  category: string;
  visibility: string;
  language: string;
  duration: string;
  passingScore: string;
  attemptLimit: string;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  negativeMarking: boolean;
  certificateEligible: boolean;
}

function toForm(exam: Exam): SettingsForm {
  return {
    title: exam.title,
    description: exam.description ?? "",
    category: exam.category ?? "",
    visibility: exam.visibility,
    language: exam.language,
    duration: exam.duration != null ? String(exam.duration) : "",
    passingScore: String(exam.passingScore),
    attemptLimit: exam.attemptLimit != null ? String(exam.attemptLimit) : "",
    shuffleQuestions: exam.shuffleQuestions,
    shuffleChoices: exam.shuffleChoices,
    showResults: exam.showResults,
    showCorrectAnswers: exam.showCorrectAnswers,
    allowReview: exam.allowReview,
    negativeMarking: exam.negativeMarking,
    certificateEligible: exam.certificateEligible,
  };
}

export function ExamSettingsDialog({ exam, open, onOpenChange, onSaved }: ExamSettingsDialogProps) {
  const updateExam = useUpdateExam();
  const [form, setForm] = useState<SettingsForm | null>(exam ? toForm(exam) : null);

  useEffect(() => {
    if (open && exam) setForm(toForm(exam));
  }, [open, exam]);

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!exam || !form) return;
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      category: form.category || null,
      visibility: form.visibility,
      language: form.language,
      duration: form.duration ? Number(form.duration) : null,
      passingScore: Number(form.passingScore),
      attemptLimit: form.attemptLimit ? Number(form.attemptLimit) : null,
      shuffleQuestions: form.shuffleQuestions,
      shuffleChoices: form.shuffleChoices,
      showResults: form.showResults,
      showCorrectAnswers: form.showCorrectAnswers,
      allowReview: form.allowReview,
      negativeMarking: form.negativeMarking,
      certificateEligible: form.certificateEligible,
    };
    try {
      const updated = await updateExam.mutateAsync({ id: exam.id, payload });
      toast.success("تم حفظ إعدادات الاختبار");
      onOpenChange(false);
      onSaved?.(updated as unknown as Exam);
    } catch {
      toast.error("فشل حفظ إعدادات الاختبار");
    }
  };

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        className={cn(
          "!bg-studio-surface !text-studio-fg max-w-lg border-studio-border",
        )}
      >
        <AppDialogHeader>
          <AppDialogTitle>إعدادات الاختبار</AppDialogTitle>
          <AppDialogDescription>عدّل تفاصيل وسياسات الاختبار.</AppDialogDescription>
        </AppDialogHeader>

        {form && (
          <div className="studio-scrollbar max-h-[60vh] space-y-4 overflow-y-auto py-2">
            <Field label="العنوان">
              <AppInput value={form.title} onChange={(e) => set("title", e.target.value)} className="bg-studio-bg" />
            </Field>
            <Field label="الوصف">
              <AppTextarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="وصف الاختبار..."
                className="bg-studio-bg"
              />
            </Field>
            <Field label="الفئة">
              <AppInput value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="اسم الفئة" className="bg-studio-bg" />
            </Field>
            <Field label="الظهور">
              <AppSelect value={form.visibility} onValueChange={(v) => set("visibility", v)}>
                <AppSelectTrigger className="bg-studio-bg">
                  <AppSelectValue />
                </AppSelectTrigger>
                <AppSelectContent>
                  {VISIBILITY_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                    <AppSelectItem key={o.value} value={o.value}>
                      {o.label}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </Field>
            <Field label="اللغة">
              <AppInput value={form.language} onChange={(e) => set("language", e.target.value)} className="bg-studio-bg" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="المدة (دقيقة)">
                <AppInput type="number" min={0} value={form.duration} onChange={(e) => set("duration", e.target.value)} className="bg-studio-bg" />
              </Field>
              <Field label="درجة النجاح">
                <AppInput type="number" min={0} value={form.passingScore} onChange={(e) => set("passingScore", e.target.value)} className="bg-studio-bg" />
              </Field>
            </div>
            <Field label="حد المحاولات (اتركه فارغاً لغير محدود)">
              <AppInput type="number" min={0} value={form.attemptLimit} onChange={(e) => set("attemptLimit", e.target.value)} className="bg-studio-bg" />
            </Field>

            <div className="divide-y divide-studio-border rounded-lg border border-studio-border">
              <SettingsSwitch label="خلط الأسئلة" checked={form.shuffleQuestions} onChange={(v) => set("shuffleQuestions", v)} />
              <SettingsSwitch label="خلط الخيارات" checked={form.shuffleChoices} onChange={(v) => set("shuffleChoices", v)} />
              <SettingsSwitch label="إظهار النتائج" checked={form.showResults} onChange={(v) => set("showResults", v)} />
              <SettingsSwitch label="إظهار الإجابات الصحيحة" checked={form.showCorrectAnswers} onChange={(v) => set("showCorrectAnswers", v)} />
              <SettingsSwitch label="السماح بالمراجعة" checked={form.allowReview} onChange={(v) => set("allowReview", v)} />
              <SettingsSwitch label="الدرجات السلبية" checked={form.negativeMarking} onChange={(v) => set("negativeMarking", v)} />
              <SettingsSwitch label="أهلية الشهادة" checked={form.certificateEligible} onChange={(v) => set("certificateEligible", v)} />
            </div>
          </div>
        )}

        <AppDialogFooter>
          <StudioButton variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </StudioButton>
          <StudioButton variant="primary" onClick={handleSave} loading={updateExam.isPending}>
            حفظ
          </StudioButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-studio-fg-muted">{label}</span>
      {children}
    </label>
  );
}

function SettingsSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-sm text-studio-fg">{label}</span>
      <AppSwitch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
