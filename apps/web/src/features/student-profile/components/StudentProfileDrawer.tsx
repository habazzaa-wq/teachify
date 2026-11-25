"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Loader2,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Calendar,
  Shield,
  Pencil,
  Lock,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { AppButton, AppInput } from "@/components/ui";
import { cn } from "@/lib/cn";
import { usePublicStages } from "@/features/homepage/educational-stages/hooks";
import {
  CITIES_BY_GOVERNORATE,
  GENDER_OPTIONS,
  GOVERNORATES,
  normalizeStudentFieldConfig,
  STUDY_TYPES,
  type StudentFieldKey,
} from "@/features/student-fields";
import { useTenantStore } from "@/stores/tenant.store";
import { useStudentProfile, useUpdateStudentProfile, useUploadAvatar } from "../hooks";
import type {
  StudentEditableProfileFields,
  StudentProfileUpdateValues,
} from "../types";
import { useAuthStore } from "@/stores/auth.store";

interface StudentProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM: StudentEditableProfileFields = {
  name: "",
  parentPhone: "",
  gender: "",
  studyType: "",
  nationality: "",
  studyLevel: "",
  governorate: "",
  city: "",
};

/** Maps an editable profile field to the admin-controlled config key. */
const CONFIG_KEY: Record<keyof StudentEditableProfileFields, StudentFieldKey | null> = {
  name: null,
  parentPhone: "parent_phone",
  gender: "gender",
  studyType: "study_type",
  nationality: "nationality",
  studyLevel: "study_level",
  governorate: "governorate",
  city: "city",
};

const MAX_LENGTH: Partial<Record<keyof StudentEditableProfileFields, number>> = {
  name: 255,
  parentPhone: 50,
  gender: 20,
  studyType: 100,
  nationality: 100,
  studyLevel: 100,
  governorate: 100,
  city: 100,
};

/** Registration stores Arabic gender values; legacy male/female still exist. */
function normalizeGender(value: string): string {
  const v = value.trim();
  if (v === "male" || v === "ذكر") return "ذكر";
  if (v === "female" || v === "أنثى" || v === "انثى") return "أنثى";
  return v;
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function FieldItem({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function EditField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  dir,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <AppInput
        id={id}
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(dir === "ltr" && "text-left", error && "border-destructive")}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function EditSelect({
  id,
  label,
  value,
  options,
  onChange,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm pe-9",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            error && "border-destructive",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function StudentProfileDrawer({ open, onClose }: StudentProfileDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState<StudentEditableProfileFields>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { data: profile, isLoading } = useStudentProfile({ enabled: open });
  const { data: stagesData } = usePublicStages();
  const uploadMutation = useUploadAvatar();
  const updateProfile = useUpdateStudentProfile();

  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);
  const storedFields = useTenantStore((s) => s.studentFields);
  const studentFields = useMemo(() => normalizeStudentFieldConfig(storedFields), [storedFields]);

  const avatarUrl = previewUrl || profile?.avatar || currentUser?.avatar || null;
  const guardianPhoneLocked = Boolean(profile?.parentPhone?.trim());

  const handleClose = useCallback(() => {
    setIsEditing(false);
    setPreviewUrl(null);
    setFieldErrors({});
    setGeneralError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleClose]);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("الرجاء اختيار ملف صورة.");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت.");
        e.target.value = "";
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      try {
        const result = await uploadMutation.mutateAsync(file);
        if (currentUser) setUser({ ...currentUser, avatar: result.avatar });
        try {
          const stored = localStorage.getItem("public-register-state");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.avatar = result.avatar;
            localStorage.setItem("public-register-state", JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
        try {
          window.dispatchEvent(
            new CustomEvent("student-profile-updated", { detail: { avatar: result.avatar } }),
          );
        } catch { /* ignore */ }
        setPreviewUrl(result.avatar);
      } catch {
        setPreviewUrl(null);
        toast.error("تعذر رفع الصورة. حاول مرة أخرى.");
      } finally {
        URL.revokeObjectURL(objectUrl);
        e.target.value = "";
      }
    },
    [uploadMutation, currentUser, setUser],
  );

  const startEditing = useCallback(() => {
    if (!profile) return;
    setFormValues({
      name: profile.name ?? "",
      parentPhone: profile.parentPhone ?? "",
      gender: normalizeGender(profile.gender ?? ""),
      studyType: profile.studyType ?? "",
      nationality: profile.nationality ?? "",
      studyLevel: profile.studyLevel ?? "",
      governorate: profile.governorate ?? "",
      city: profile.city ?? "",
    });
    setFieldErrors({});
    setGeneralError(null);
    setIsEditing(true);
  }, [profile]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setFieldErrors({});
    setGeneralError(null);
  }, []);

  const setField = useCallback(
    (field: keyof StudentEditableProfileFields, value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const studyLevelOptions = useMemo(() => {
    const names = (stagesData?.items ?? []).map((stage) => stage.name).filter(Boolean);
    if (formValues.studyLevel && !names.includes(formValues.studyLevel)) {
      names.unshift(formValues.studyLevel);
    }
    return names;
  }, [stagesData?.items, formValues.studyLevel]);

  const governorateOptions = useMemo(() => {
    const names = [...GOVERNORATES];
    if (formValues.governorate && !names.includes(formValues.governorate)) {
      names.unshift(formValues.governorate);
    }
    return names;
  }, [formValues.governorate]);

  const studyTypeOptions = useMemo(() => {
    const types = [...STUDY_TYPES];
    if (formValues.studyType && !types.includes(formValues.studyType)) {
      types.unshift(formValues.studyType);
    }
    return types;
  }, [formValues.studyType]);

  const cityOptions = useMemo(() => {
    const cities = [...(CITIES_BY_GOVERNORATE[formValues.governorate] ?? [])];
    if (formValues.city && !cities.includes(formValues.city)) cities.unshift(formValues.city);
    return cities;
  }, [formValues.governorate, formValues.city]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errors: Record<string, string> = {};
      const name = formValues.name.trim();
      if (!name) errors.name = "الاسم مطلوب";
      else if (name.length > (MAX_LENGTH.name ?? 255)) errors.name = "الاسم طويل جداً";

      const payload: StudentProfileUpdateValues = { name };
      (Object.keys(formValues) as Array<keyof StudentEditableProfileFields>).forEach((field) => {
        const configKey = CONFIG_KEY[field];
        if (configKey && !studentFields[configKey]) return;
        if (field === "parentPhone" && guardianPhoneLocked) return;

        const value = String(formValues[field] ?? "").trim();
        const max = MAX_LENGTH[field];
        if (max && value.length > max) {
          errors[field] = "القيمة طويلة جداً";
        }
        payload[field] = value || null;
      });

      setFieldErrors(errors);
      setGeneralError(null);
      if (Object.keys(errors).length > 0) return;

      try {
        const updated = await updateProfile.mutateAsync(payload);
        setIsEditing(false);

        // Keep auth store, local session and navbar in sync after a rename.
        if (currentUser) setUser({ ...currentUser, name: updated.name });
        try {
          const stored = localStorage.getItem("public-register-state");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.name = updated.name;
            localStorage.setItem("public-register-state", JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
        try {
          window.dispatchEvent(
            new CustomEvent("student-profile-updated", {
              detail: { name: updated.name, avatar: updated.avatar || currentUser?.avatar || null },
            }),
          );
        } catch { /* ignore */ }
        toast.success("تم حفظ التعديلات بنجاح.");
      } catch (error) {
        const err = error as Error & { fieldErrors?: Record<string, string[]> };
        const flat: Record<string, string> = {};
        for (const [key, messages] of Object.entries(err.fieldErrors ?? {})) {
          flat[snakeToCamel(key)] = messages[0] ?? "";
        }
        setFieldErrors(flat);
        if (Object.keys(flat).length === 0) {
          setGeneralError(err.message || "تعذر حفظ التعديلات. حاول مرة أخرى.");
        }
      }
    },
    [formValues, studentFields, guardianPhoneLocked, updateProfile, currentUser, setUser],
  );

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const showStudyInfo =
    studentFields.study_type ||
    studentFields.study_level ||
    studentFields.governorate ||
    studentFields.city;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleClose}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-profile-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-xl"
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute end-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center px-6 pt-8 pb-5">
                <div className="relative group mb-4">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="relative cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="تغيير الصورة الشخصية"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground text-xl font-semibold overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={profile?.name ?? ""} className="h-full w-full object-cover" />
                      ) : profile?.name ? (
                        getInitials(profile.name)
                      ) : (
                        <User className="h-8 w-8" />
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    {uploadMutation.isPending && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                </div>

                <h2 id="student-profile-title" className="text-lg font-semibold text-foreground">
                  {isEditing ? formValues.name.trim() || profile?.name : profile?.name}
                </h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>

              <div className="mx-6 border-t border-border" />

              <div className="px-6 py-5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : profile ? (
                  isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex items-start gap-2 rounded-lg border border-muted bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>البريد الإلكتروني ورقم الهاتف لا يمكن تعديلهما. هاتف ولي الأمر يُضاف مرة واحدة فقط.</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <FieldItem label="البريد" value={profile.email} icon={Mail} />
                        <FieldItem label="الهاتف" value={profile.phone || "غير محدد"} icon={Phone} />
                        {studentFields.parent_phone && guardianPhoneLocked && (
                          <FieldItem label="هاتف ولي الأمر" value={profile.parentPhone} icon={Lock} />
                        )}
                      </div>

                      <EditField
                        id="profile-name"
                        label="الاسم"
                        value={formValues.name}
                        onChange={(value) => setField("name", value)}
                        error={fieldErrors.name}
                        placeholder="الاسم الكامل"
                      />

                      {studentFields.parent_phone && !guardianPhoneLocked && (
                        <EditField
                          id="profile-parent-phone"
                          label="هاتف ولي الأمر"
                          value={formValues.parentPhone}
                          onChange={(value) => setField("parentPhone", value)}
                          error={fieldErrors.parentPhone}
                          placeholder="+20 1XXXXXXXXX"
                          dir="ltr"
                        />
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {studentFields.gender && (
                          <EditSelect
                            id="profile-gender"
                            label="الجنس"
                            value={formValues.gender}
                            options={GENDER_OPTIONS.map((option) => option.value)}
                            onChange={(value) => setField("gender", value)}
                            error={fieldErrors.gender}
                            placeholder="اختر الجنس"
                          />
                        )}
                        {studentFields.nationality && (
                          <EditField
                            id="profile-nationality"
                            label="الجنسية"
                            value={formValues.nationality}
                            onChange={(value) => setField("nationality", value)}
                            error={fieldErrors.nationality}
                            placeholder="مصرية / سعودية / ..."
                          />
                        )}
                      </div>

                      {studentFields.study_type && (
                        <EditSelect
                          id="profile-study-type"
                          label="نوع الدراسة"
                          value={formValues.studyType}
                          options={studyTypeOptions}
                          onChange={(value) => setField("studyType", value)}
                          error={fieldErrors.studyType}
                          placeholder="اختر نوع الدراسة"
                        />
                      )}

                      {studentFields.study_level && (
                        <EditSelect
                          id="profile-study-level"
                          label="المرحلة الدراسية"
                          value={formValues.studyLevel}
                          options={studyLevelOptions}
                          onChange={(value) => setField("studyLevel", value)}
                          error={fieldErrors.studyLevel}
                          placeholder="اختر المرحلة الدراسية"
                        />
                      )}

                      {(studentFields.governorate || studentFields.city) && (
                        <div className="grid grid-cols-2 gap-3">
                          {studentFields.governorate && (
                            <EditSelect
                              id="profile-governorate"
                              label="المحافظة"
                              value={formValues.governorate}
                              options={governorateOptions}
                              onChange={(value) => {
                                setFormValues((prev) => ({ ...prev, governorate: value, city: "" }));
                              }}
                              error={fieldErrors.governorate}
                              placeholder="اختر المحافظة"
                            />
                          )}
                          {studentFields.city && (
                            <EditSelect
                              id="profile-city"
                              label="المدينة"
                              value={formValues.city}
                              options={cityOptions}
                              onChange={(value) => setField("city", value)}
                              error={fieldErrors.city}
                              placeholder="اختر المدينة"
                            />
                          )}
                        </div>
                      )}

                      {generalError && (
                        <p role="alert" className="text-xs text-destructive">{generalError}</p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <AppButton type="submit" className="flex-1" loading={updateProfile.isPending}>
                          حفظ التغييرات
                        </AppButton>
                        <AppButton
                          type="button"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={updateProfile.isPending}
                        >
                          إلغاء
                        </AppButton>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">البيانات الشخصية</h3>
                          <AppButton
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={startEditing}
                            className="h-7 gap-1.5 px-2 text-[11px]"
                          >
                            <Pencil className="h-3 w-3" />
                            تعديل المعلومات الشخصية
                          </AppButton>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FieldItem label="الاسم" value={profile.name} icon={User} />
                          <FieldItem label="البريد" value={profile.email} icon={Mail} />
                          <FieldItem label="الهاتف" value={profile.phone || "غير محدد"} icon={Phone} />
                          {studentFields.parent_phone && (
                            <FieldItem label="هاتف ولي الأمر" value={profile.parentPhone || "غير محدد"} icon={Phone} />
                          )}
                          {studentFields.gender && (
                            <FieldItem label="الجنس" value={normalizeGender(profile.gender) || "غير محدد"} icon={Shield} />
                          )}
                          {studentFields.nationality && (
                            <FieldItem label="الجنسية" value={profile.nationality || "غير محدد"} icon={MapPin} />
                          )}
                        </div>
                      </div>

                      {showStudyInfo && (
                        <div>
                          <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">معلومات الدراسة</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {studentFields.study_type && (
                              <FieldItem label="نوع الدراسة" value={profile.studyType || "غير محدد"} icon={BookOpen} />
                            )}
                            {studentFields.study_level && (
                              <FieldItem label="المستوى الدراسي" value={profile.studyLevel || "غير محدد"} icon={BookOpen} />
                            )}
                            {studentFields.governorate && (
                              <FieldItem label="المحافظة" value={profile.governorate || "غير محدد"} icon={MapPin} />
                            )}
                            {studentFields.city && (
                              <FieldItem label="المدينة" value={profile.city || "غير محدد"} icon={MapPin} />
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">معلومات الحساب</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <FieldItem
                            label="تاريخ الانضمام"
                            value={profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "غير محدد"}
                            icon={Calendar}
                          />
                          <FieldItem
                            label="تاريخ الإنشاء"
                            value={new Date(profile.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                            icon={Calendar}
                          />
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <User className="h-10 w-10" />
                    <p className="text-sm">لم يتم العثور على البيانات</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
