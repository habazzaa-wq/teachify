"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogDescription,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogTitle,
} from "@/components/ui";
import { AppInput } from "@/components/ui/AppInput";
import { AppTextarea } from "@/components/ui/AppTextarea";
import {
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
} from "@/components/ui/AppSelect";
import { AppButton } from "@/components/ui/AppButton";
import { cn } from "@/lib/cn";
import { VISIBILITY_OPTIONS } from "@/features/exam-bank/constants";
import { useCategories, useCreateBank, useUpdateBank } from "@/features/exam-bank/hooks";
import type { ExamVisibility, QuestionBank } from "@/features/exam-bank/types";

interface CreateBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (bank: QuestionBank) => void;
  editBank?: QuestionBank | null;
}

const BANK_VISIBILITY_OPTIONS = VISIBILITY_OPTIONS.filter(
  (o) => o.value !== "all",
) as { value: ExamVisibility; label: string }[];

export function CreateBankDialog({
  open,
  onOpenChange,
  onCreated,
  editBank,
}: CreateBankDialogProps) {
  const isEdit = Boolean(editBank);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [visibility, setVisibility] = useState<ExamVisibility>("private");

  const { data: categoriesData } = useCategories({ perPage: 100 });
  const categories = categoriesData?.data ?? [];

  const createMutation = useCreateBank();
  const updateMutation = useUpdateBank();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setName(editBank?.name ?? "");
    setDescription(editBank?.description ?? "");
    setCategoryId(editBank?.categoryId ?? "none");
    setVisibility(editBank?.visibility ?? "private");
  }, [open, editBank]);

  const canSubmit = name.trim().length > 0 && !isLoading;

  async function handleSubmit() {
    if (!canSubmit) return;
    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      categoryId: categoryId === "none" ? null : Number(categoryId),
      visibility,
    };

    try {
      const result = isEdit
        ? await updateMutation.mutateAsync({ id: editBank!.id, payload })
        : await createMutation.mutateAsync(payload);
      onCreated?.(result);
      onOpenChange(false);
    } catch {
      // error handled by query cache / UI
    }
  }

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="max-w-lg">
        <AppDialogHeader>
          <AppDialogTitle>{isEdit ? "تعديل المستودع" : "مستودع جديد"}</AppDialogTitle>
          <AppDialogDescription>
            {isEdit
              ? "حدّث بيانات مستودع الأسئلة."
              : "أنشئ مستودعاً جديداً لحفظ مجموعة من الأسئلة."}
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-studio-fg">الاسم</label>
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: بنك أسئلة الفصل الأول"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-studio-fg">الوصف</label>
            <AppTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للمستودع (اختياري)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-studio-fg">الفئة</label>
              <AppSelect value={categoryId} onValueChange={setCategoryId}>
                <AppSelectTrigger>
                  <AppSelectValue placeholder="بدون" />
                </AppSelectTrigger>
                <AppSelectContent>
                  <AppSelectItem value="none">بدون</AppSelectItem>
                  {categories.map((c) => (
                    <AppSelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-studio-fg">الظهور</label>
              <AppSelect
                value={visibility}
                onValueChange={(v) => setVisibility(v as ExamVisibility)}
              >
                <AppSelectTrigger>
                  <AppSelectValue placeholder="اختر الظهور" />
                </AppSelectTrigger>
                <AppSelectContent>
                  {BANK_VISIBILITY_OPTIONS.map((opt) => (
                    <AppSelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </div>
          </div>
        </div>

        <AppDialogFooter className={cn("mt-6 gap-2")}>
          <AppButton variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            إلغاء
          </AppButton>
          <AppButton onClick={handleSubmit} disabled={!canSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "جارٍ التحديث..." : "جارٍ الحفظ..."}
              </>
            ) : isEdit ? (
              "حفظ التغييرات"
            ) : (
              "إنشاء المستودع"
            )}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}
