"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Contact,
  Image as ImageIcon,
  ListChecks,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  AppButton,
  AppDrawer,
  AppInput,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppSwitch,
  AppTextarea,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
  ServiceInstructor,
  ServicePayload,
  ServiceRecord,
} from "../types";

interface ServiceFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceRecord | null;
  instructors: ServiceInstructor[];
  saving: boolean;
  onSave: (payload: ServicePayload) => void;
}

const NO_INSTRUCTOR = "__none__";

function FieldSection({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-studio-accent-soft text-studio-accent">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-studio-fg">{title}</h3>
          {hint && (
            <p className="mt-0.5 text-xs leading-relaxed text-studio-fg-muted">
              {hint}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-3 ps-[38px]">{children}</div>
    </section>
  );
}

export function ServiceFormDrawer({
  open,
  onOpenChange,
  service,
  instructors,
  saving,
  onSave,
}: ServiceFormDrawerProps) {
  const [title, setTitle] = useState(service?.title ?? "");
  const [summary, setSummary] = useState(service?.summary ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [imageUrl, setImageUrl] = useState(service?.image_url ?? "");
  const [highlights, setHighlights] = useState<string[]>(
    service?.highlights?.length ? service.highlights : [""],
  );
  const [instructorId, setInstructorId] = useState(
    service?.instructor_tenant_user_id
      ? String(service.instructor_tenant_user_id)
      : NO_INSTRUCTOR,
  );
  const [contactName, setContactName] = useState(service?.contact_name ?? "");
  const [contactPhone, setContactPhone] = useState(service?.contact_phone ?? "");
  const [isPublished, setIsPublished] = useState(service?.is_published ?? true);
  const [sortOrder, setSortOrder] = useState(String(service?.sort_order ?? 0));
  const [error, setError] = useState("");

  const hasInstructor = instructorId !== NO_INSTRUCTOR;

  const handleInstructorChange = (value: string) => {
    setInstructorId(value);
    const found = instructors.find((item) => String(item.id) === value);
    if (found) {
      setContactName(found.name);
      setContactPhone(found.phone);
    } else {
      setContactName("");
      setContactPhone("");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("اسم الخدمة مطلوب.");
      return;
    }
    if (imageUrl.trim()) {
      try {
        new URL(imageUrl.trim());
      } catch {
        setError("رابط الصورة غير صالح. تأكد من إدخال رابط كامل.");
        return;
      }
    }
    if (!contactPhone.trim()) {
      setError("اختر مدرباً أو أدخل رقم هاتف مسؤول التواصل.");
      return;
    }

    onSave({
      title: title.trim(),
      summary: summary.trim() || null,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      highlights: highlights.map((item) => item.trim()).filter(Boolean),
      contact_name: contactName.trim() || null,
      contact_phone: contactPhone.trim() || null,
      instructor_tenant_user_id:
        instructorId === NO_INSTRUCTOR ? null : Number(instructorId),
      is_published: isPublished,
      sort_order: Math.max(0, Number(sortOrder) || 0),
    });
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="sm:max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <header className="border-b border-studio-border bg-studio-surface px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-accent text-studio-accent-fg shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-studio-fg">
                {service ? "تعديل الخدمة" : "خدمة جديدة"}
              </h2>
              <p className="mt-0.5 text-xs text-studio-fg-muted">
                {service
                  ? "حدّث تفاصيل الخدمة وطريقة ظهورها للزوار."
                  : "أضف خدمة تعليمية واضحة تشرح قيمتها للزوار."}
              </p>
            </div>
          </div>
        </header>

        <div className="studio-scrollbar flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <FieldSection
            icon={Sparkles}
            title="المحتوى الأساسي"
            hint="الاسم والوصف المختصر هما أول ما يراه الزائر في كتالوج الخدمات."
          >
            <div className="space-y-1.5">
              <Label htmlFor="service-title">اسم الخدمة *</Label>
              <AppInput
                id="service-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="مثال: استشارات أكاديمية مخصصة"
                maxLength={180}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="service-summary">وصف مختصر</Label>
                <span className="text-[11px] tabular-nums text-studio-fg-subtle">
                  {summary.length}/280
                </span>
              </div>
              <AppTextarea
                id="service-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="جملة موجزة تلخّص قيمة الخدمة..."
                rows={2}
                maxLength={280}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-description">التفاصيل الكاملة</Label>
              <AppTextarea
                id="service-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="اشرح ما تتضمنه الخدمة، وكيف يستفيد الطالب منها..."
                rows={4}
                maxLength={10000}
              />
            </div>
          </FieldSection>

          <div className="h-px bg-studio-border/70" />

          <FieldSection
            icon={ImageIcon}
            title="صورة الخدمة"
            hint="صورة جذابة ترفع ثقة الزائر. صنّفها بنسبة 16:9 لأفضل نتيجة."
          >
            <div className="space-y-1.5">
              <Label htmlFor="service-image">رابط الصورة</Label>
              <AppInput
                id="service-image"
                type="url"
                dir="ltr"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/service.jpg"
                maxLength={2048}
              />
            </div>
            <div className="relative h-32 overflow-hidden rounded-xl border border-studio-border bg-studio-soft">
              {imageUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl.trim()}
                  alt="معاينة صورة الخدمة"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-studio-fg-subtle">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">معاينة الصورة ستظهر هنا</span>
                </div>
              )}
            </div>
          </FieldSection>

          <div className="h-px bg-studio-border/70" />

          <FieldSection
            icon={ListChecks}
            title="أبرز المميزات"
            hint="أضف نقاطاً قصيرة توضّح ما يميز الخدمة (حتى 12 نقطة)."
          >
            <div className="space-y-2">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs tabular-nums text-studio-fg-subtle">
                    {index + 1}
                  </span>
                  <AppInput
                    value={item}
                    onChange={(event) =>
                      setHighlights((current) =>
                        current.map((value, i) =>
                          i === index ? event.target.value : value,
                        ),
                      )
                    }
                    placeholder="ميزة واضحة ومختصرة"
                    maxLength={180}
                  />
                  <AppButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive/70 hover:text-destructive"
                    onClick={() =>
                      setHighlights((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    aria-label="حذف المميزة"
                  >
                    <Trash2 className="h-4 w-4" />
                  </AppButton>
                </div>
              ))}
            </div>
            {highlights.length < 12 && (
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                className="border-dashed"
                onClick={() => setHighlights((current) => [...current, ""])}
              >
                <Plus className="h-4 w-4" />
                إضافة مميزة
              </AppButton>
            )}
          </FieldSection>

          <div className="h-px bg-studio-border/70" />

          <FieldSection
            icon={Contact}
            title="مسؤول التواصل"
            hint="يمكنك اختيار أحد المدربين أو إدخال بيانات تواصل مخصصة."
          >
            <div className="space-y-1.5">
              <Label>مدرب معيّن</Label>
              <AppSelect value={instructorId} onValueChange={handleInstructorChange}>
                <AppSelectTrigger>
                  <AppSelectValue placeholder="بدون مدرب — إدخال يدوي" />
                </AppSelectTrigger>
                <AppSelectContent>
                  <AppSelectItem value={NO_INSTRUCTOR}>
                    بدون مدرب — إدخال يدوي
                  </AppSelectItem>
                  {instructors.map((instructor) => (
                    <AppSelectItem key={instructor.id} value={String(instructor.id)}>
                      {instructor.name} — {instructor.phone}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="service-contact-name">اسم مسؤول التواصل</Label>
                <AppInput
                  id="service-contact-name"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="الاسم الظاهر للزوار"
                  disabled={hasInstructor}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="service-contact-phone">رقم الهاتف *</Label>
                <AppInput
                  id="service-contact-phone"
                  dir="ltr"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="+201234567890"
                  disabled={hasInstructor}
                />
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-studio-fg-subtle">
              يظهر زر واتساب للزوار ويستخدم هذا الرقم لبدء المحادثة مباشرة.
            </p>
          </FieldSection>

          <div className="h-px bg-studio-border/70" />

          <FieldSection
            icon={BadgeCheck}
            title="النشر والترتيب"
            hint="تحكّم في ظهور الخدمة ومكانها داخل الكتالوج."
          >
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-studio-border bg-studio-surface px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-studio-fg">
                  الخدمة منشورة
                </span>
                <span className="mt-0.5 block text-xs text-studio-fg-muted">
                  تظهر للزوار في صفحة الخدمات العامة
                </span>
              </span>
              <AppSwitch
                checked={isPublished}
                onCheckedChange={(checked) => setIsPublished(Boolean(checked))}
                aria-label="حالة نشر الخدمة"
              />
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="service-sort">ترتيب العرض</Label>
              <AppInput
                id="service-sort"
                type="number"
                min={0}
                max={100000}
                dir="ltr"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="max-w-[160px]"
              />
              <p className="text-[11px] text-studio-fg-subtle">
                الأقل رقماً يظهر أولاً.
              </p>
            </div>
          </FieldSection>

          {error && (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <footer
          className={cn(
            "flex items-center justify-end gap-2 border-t border-studio-border",
            "bg-studio-surface px-6 py-4",
          )}
        >
          <AppButton
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            إلغاء
          </AppButton>
          <AppButton type="submit" loading={saving}>
            {service ? "حفظ التعديلات" : "إضافة الخدمة"}
          </AppButton>
        </footer>
      </form>
    </AppDrawer>
  );
}
