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
import { CATEGORY_STATUS_CONFIG } from "@/features/exam-bank/constants";
import { useCategories, useCreateCategory, useUpdateCategory } from "@/features/exam-bank/hooks";
import type { CategoryStatus, QuestionCategory } from "@/features/exam-bank/types";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (category: QuestionCategory) => void;
  editCategory?: QuestionCategory | null;
}

const CATEGORY_STATUS_OPTIONS: { value: CategoryStatus; label: string }[] = [
  { value: "active", label: CATEGORY_STATUS_CONFIG.active.label },
  { value: "inactive", label: CATEGORY_STATUS_CONFIG.inactive.label },
  { value: "archived", label: CATEGORY_STATUS_CONFIG.archived.label },
];

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onCreated,
  editCategory,
}: CreateCategoryDialogProps) {
  const isEdit = Boolean(editCategory);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [sortOrder, setSortOrder] = useState("0");
  const [status, setStatus] = useState<CategoryStatus>("active");

  const { data: categoriesData } = useCategories({ perPage: 100 });
  const categories = categoriesData?.data ?? [];

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setName(editCategory?.name ?? "");
    setDescription(editCategory?.description ?? "");
    setColor(editCategory?.color ?? "");
    setIcon(editCategory?.icon ?? "");
    setParentId(editCategory?.parentId ?? "none");
    setSortOrder(String(editCategory?.sortOrder ?? 0));
    setStatus(editCategory?.status ?? "active");
  }, [open, editCategory]);

  const canSubmit = name.trim().length > 0 && !isLoading;

  async function handleSubmit() {
    if (!canSubmit) return;
    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      color: color.trim() || null,
      icon: icon.trim() || null,
      parentId: parentId === "none" ? null : Number(parentId),
      sortOrder: Number(sortOrder) || 0,
      status,
    };

    try {
      const result = isEdit
        ? await updateMutation.mutateAsync({ id: editCategory!.id, payload })
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
          <AppDialogTitle>{isEdit ? "تعديل الفئة" : "فئة جديدة"}</AppDialogTitle>
          <AppDialogDescription>
            {isEdit
              ? "حدّث بيانات فئة الأسئلة."
              : "أضف فئة جديدة لتنظيم أسئلتك."}
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-studio-fg">الاسم</label>
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الرياضيات"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-studio-fg">الوصف</label>
            <AppTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للفئة (اختياري)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-studio-fg">اللون</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color || "#000000"}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background"
                  aria-label="اختيار اللون"
                />
                <AppInput
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-studio-fg">الأيقونة</label>
              <AppInput
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="اسم الأيقونة (اختياري)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-studio-fg">الفئة الأب</label>
              <AppSelect value={parentId} onValueChange={setParentId}>
                <AppSelectTrigger>
                  <AppSelectValue placeholder="بدون" />
                </AppSelectTrigger>
                <AppSelectContent>
                  <AppSelectItem value="none">بدون</AppSelectItem>
                  {categories
                    .filter((c) => !editCategory || c.id !== editCategory.id)
                    .map((c) => (
                      <AppSelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </AppSelectItem>
                    ))}
                </AppSelectContent>
              </AppSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-studio-fg">الترتيب</label>
              <AppInput
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-studio-fg">الحالة</label>
            <AppSelect value={status} onValueChange={(v) => setStatus(v as CategoryStatus)}>
              <AppSelectTrigger>
                <AppSelectValue placeholder="اختر الحالة" />
              </AppSelectTrigger>
              <AppSelectContent>
                {CATEGORY_STATUS_OPTIONS.map((opt) => (
                  <AppSelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
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
              "إنشاء الفئة"
            )}
          </AppButton>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}
