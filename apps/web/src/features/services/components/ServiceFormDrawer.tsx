"use client";

import { useRef, useState } from "react";
import {
  BadgeCheck,
  Contact,
  Image as ImageIcon,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
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
import { tenantServicesApi } from "../api";
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
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

type ImageMode = "upload" | "url";

function getUploadErrorMessage(error: unknown): string {
  const candidate = error as {
    fieldErrors?: Record<string, string[]>;
    message?: unknown;
  };
  const fieldError = Object.values(candidate?.fieldErrors ?? {}).flat()[0];
  if (fieldError) return fieldError;
  if (typeof candidate?.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }
  return "تعذر رفع الصورة إلى خادم الموقع.";
}

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
  const [imageMode, setImageMode] = useState<ImageMode>(
    service?.image_url ? "url" : "upload",
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";

    setError("");
    setImageUploadError("");

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageUploadError(
        "صيغة الصورة غير مدعومة. اختر JPEG أو PNG أو WebP أو GIF أو AVIF.",
      );
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageUploadError("حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت.");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await tenantServicesApi.uploadImage(file);
      setImageUrl(url);
      setUploadedFileName(file.name);
    } catch (uploadError) {
      setImageUploadError(getUploadErrorMessage(uploadError));
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setUploadedFileName("");
    setImageUploadError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("اسم الخدمة مطلوب.");
      return;
    }
    if (uploadingImage) {
      setError("انتظر اكتمال رفع الصورة قبل حفظ الخدمة.");
      return;
    }
    if (imageMode === "url" && imageUrl.trim()) {
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
      className="flex h-full max-h-full w-full max-w-none flex-col overflow-hidden sm:max-w-xl"
    >
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <header className="shrink-0 border-b border-studio-border bg-studio-surface px-6 py-5">
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

        <div className="studio-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-6 [touch-action:pan-y]">
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
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="طريقة إدخال صورة الخدمة"
            >
              <AppButton
                type="button"
                variant={imageMode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setImageMode("upload")}
              >
                <UploadCloud className="h-4 w-4" />
                رفع صورة
              </AppButton>
              <AppButton
                type="button"
                variant={imageMode === "url" ? "default" : "outline"}
                size="sm"
                onClick={() => setImageMode("url")}
              >
                <Link2 className="h-4 w-4" />
                رابط
              </AppButton>
            </div>

            {imageMode === "upload" ? (
              <div className="space-y-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  className="hidden"
                  onChange={handleImageFileChange}
                  aria-label="اختيار صورة الخدمة"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage || saving}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-studio-border bg-studio-soft px-4 py-5 text-center transition-colors hover:border-studio-accent/50 hover:bg-studio-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-studio-accent" />
                  ) : (
                    <UploadCloud className="h-6 w-6 text-studio-accent" />
                  )}
                  <span className="text-xs font-medium text-studio-fg">
                    {uploadingImage
                      ? "جارٍ رفع الصورة..."
                      : uploadedFileName
                        ? "تغيير الصورة المرفوعة"
                        : imageUrl
                          ? "اختر صورة لاستبدال الصورة الحالية"
                          : "اختر صورة من جهازك"}
                  </span>
                  <span className="text-[11px] text-studio-fg-subtle">
                    JPEG, PNG, WebP, GIF أو AVIF — حتى 10 ميجابايت
                  </span>
                </button>
                {(uploadedFileName || imageUrl) && !uploadingImage && (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-studio-border bg-studio-surface px-3 py-2">
                    <span
                      className="min-w-0 truncate text-xs text-studio-fg-muted"
                      dir="auto"
                    >
                      {uploadedFileName || "الصورة الحالية"}
                    </span>
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-destructive/70 hover:text-destructive"
                      onClick={removeImage}
                      disabled={saving}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      إزالة
                    </AppButton>
                  </div>
                )}
                {imageUploadError && (
                  <p className="text-xs leading-relaxed text-destructive">
                    {imageUploadError}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="service-image">رابط الصورة</Label>
                  {imageUrl && (
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive/70 hover:text-destructive"
                      onClick={removeImage}
                      disabled={saving}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      إزالة
                    </AppButton>
                  )}
                </div>
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
            )}

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
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-studio-surface/80 backdrop-blur-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-studio-accent" />
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
            "flex shrink-0 items-center justify-end gap-2 border-t border-studio-border",
            "bg-studio-surface px-6 py-4",
          )}
        >
          <AppButton
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || uploadingImage}
          >
            إلغاء
          </AppButton>
          <AppButton
            type="submit"
            loading={saving || uploadingImage}
            disabled={uploadingImage}
          >
            {service ? "حفظ التعديلات" : "إضافة الخدمة"}
          </AppButton>
        </footer>
      </form>
    </AppDrawer>
  );
}
