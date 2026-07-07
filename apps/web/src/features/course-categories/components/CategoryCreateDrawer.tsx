"use client";

import { useState, useCallback } from "react";
import { X, Save } from "lucide-react";
import {
  AppButton,
  AppInput,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
  AppDrawer,
  AppTextarea,
  Label,
  AppSwitch,
} from "@/components/ui";
import { CATEGORY_NON_FILTER_STATUS_OPTIONS, DEFAULT_COLORS, DEFAULT_ICONS } from "../constants";
import type { CreateCategoryPayload, CategoryStatus } from "../types";

interface CategoryCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: CreateCategoryPayload) => void;
  saving?: boolean;
  parentCategories?: Array<{ id: string; name: string }>;
}

function CategoryCreateDrawer({
  open,
  onOpenChange,
  onSave,
  saving,
  parentCategories = [],
}: CategoryCreateDrawerProps) {
  const [formData, setFormData] = useState<CreateCategoryPayload>({
    name: "",
    parentId: null,
    description: "",
    sortOrder: 0,
    featured: false,
    active: true,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("");

  const updateField = useCallback(<K extends keyof CreateCategoryPayload>(key: K, value: CreateCategoryPayload[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave(formData);
  }, [onSave, formData]);

  const isValid = formData.name.length > 0;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[600px] lg:max-w-[700px]"
    >
      <div className="flex flex-col bg-background" style={{ height: '100dvh' }} role="dialog" aria-modal="true" aria-label="إضافة تصنيف جديد">
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0 bg-background z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-3 w-3 rounded-full bg-primary shrink-0 ring-2 ring-background shadow-sm" />
            <h2 className="text-lg font-semibold tracking-tight truncate">
              إضافة تصنيف جديد
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          className="flex-1 overflow-y-auto min-h-0 bg-muted/10"
          style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', scrollbarWidth: 'thin' }}
        >
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                المعلومات الأساسية
              </h3>
              <div className="space-y-2">
                <Label htmlFor="create-name">اسم التصنيف</Label>
                <AppInput
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="أدخل اسم التصنيف"
                />
              </div>
              {parentCategories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="create-parent">التصنيف الأب</Label>
                    <AppSelect
                      value={formData.parentId != null ? String(formData.parentId) : ""}
                      onValueChange={(val) => updateField("parentId", val ? Number(val) : null)}
                    >
                    <AppSelectTrigger id="create-parent" className="h-9">
                      <AppSelectValue placeholder="اختر التصنيف الأب (اختياري)" />
                    </AppSelectTrigger>
                    <AppSelectContent>
                      <AppSelectItem value="" disabled>
                        لا يوجد (تصنيف رئيسي)
                      </AppSelectItem>
                      {parentCategories.map((cat) => (
                        <AppSelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </AppSelectItem>
                      ))}
                    </AppSelectContent>
                  </AppSelect>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="create-description">الوصف</Label>
                <AppTextarea
                  id="create-description"
                  value={formData.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="وصف التصنيف"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                المظهر
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-icon">الأيقونة</Label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                    {DEFAULT_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSelectedIcon(icon)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                          selectedIcon === icon
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                      </button>
                    ))}
                  </div>
                  <AppInput
                    id="create-icon"
                    value={selectedIcon}
                    onChange={(e) => updateField("icon", e.target.value)}
                    placeholder="أيقونة مخصصة"
                    className="mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-color">اللون</Label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          updateField("color", color);
                        }}
                        className={`h-10 w-10 rounded-lg border-2 transition-all ${
                          selectedColor === color
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary/50"
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={color}
                      />
                    ))}
                  </div>
                  <AppInput
                    id="create-color"
                    value={selectedColor || (formData.color ?? "")}
                    onChange={(e) => {
                      updateField("color", e.target.value);
                      setSelectedColor(e.target.value);
                    }}
                    placeholder="#3B82F6"
                    className="mt-2"
                    maxLength={7}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-sort">الترتيب</Label>
                  <AppInput
                    id="create-sort"
                    type="number"
                    value={String(formData.sortOrder ?? 0)}
                    onChange={(e) => updateField("sortOrder", Number(e.target.value))}
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                الخيارات
              </h3>
              <div className="flex items-center gap-3">
                <AppSwitch
                  id="create-featured"
                  checked={formData.featured ?? false}
                  onCheckedChange={(val) => updateField("featured", val)}
                />
                <Label htmlFor="create-featured">تصنيف مميز</Label>
              </div>
              <div className="flex items-center gap-3">
                <AppSwitch
                  id="create-active"
                  checked={formData.active ?? true}
                  onCheckedChange={(val) => updateField("active", val)}
                />
                <Label htmlFor="create-active">نشط</Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                تحسين محركات البحث (SEO)
              </h3>
              <div className="space-y-2">
                <Label htmlFor="create-seo-title">عنوان SEO</Label>
                <AppInput
                  id="create-seo-title"
                  value={formData.seoTitle ?? ""}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                  placeholder="عنوان محسّن لمحركات البحث"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-seo-desc">وصف SEO</Label>
                <AppTextarea
                  id="create-seo-desc"
                  value={formData.seoDescription ?? ""}
                  onChange={(e) => updateField("seoDescription", e.target.value)}
                  placeholder="وصف محسّن لمحركات البحث"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-seo-keywords">الكلمات المفتاحية</Label>
                <AppInput
                  id="create-seo-keywords"
                  value={formData.seoKeywords ?? ""}
                  onChange={(e) => updateField("seoKeywords", e.target.value)}
                  placeholder="كلمات مفتاحية مفصولة بفواصل"
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur-sm px-6 py-4 shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-xs text-muted-foreground">
            سيتم إنشاء التصنيف كنشط
          </div>
          <div className="flex items-center gap-3">
            <AppButton variant="ghost" onClick={handleClose} className="text-sm">
              إلغاء
            </AppButton>
            {onSave && (
              <AppButton size="default" onClick={handleSave} loading={saving} disabled={!isValid} className="text-sm min-w-[100px]">
                <Save className="h-4 w-4" />
                حفظ
              </AppButton>
            )}
          </div>
        </footer>
      </div>
    </AppDrawer>
  );
}

export { CategoryCreateDrawer };