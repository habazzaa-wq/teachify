"use client";

import { useState, useCallback } from "react";
import { UserPlus, Mail, Eye, EyeOff } from "lucide-react";
import {
  AppButton,
  AppInput,
  AppDrawer,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { useCreateStudent, useInviteStudent } from "../hooks";
import { useEducationalStagesList } from "@/features/homepage/educational-stages/hooks";

interface StudentCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREATE_TABS = [
  { value: "direct", label: "إنشاء حساب مباشر", icon: UserPlus },
  { value: "invite", label: "إرسال دعوة", icon: Mail },
];

function StudentCreateDrawer({ open, onOpenChange }: StudentCreateDrawerProps) {
  const [activeTab, setActiveTab] = useState("direct");
  const [showPassword, setShowPassword] = useState(false);

  const [directForm, setDirectForm] = useState({
    name: "",
    email: "",
    phone: "",
    parent_phone: "",
    password: "",
    password_confirmation: "",
    nationality: "",
    study_level: "",
    governorate: "",
    city: "",
  });
  const [inviteForm, setInviteForm] = useState({ email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createStudent = useCreateStudent();
  const inviteStudent = useInviteStudent();
  const { data: stagesData } = useEducationalStagesList();
  const stages = stagesData?.data ?? [];

  const resetForms = useCallback(() => {
    setDirectForm({
      name: "",
      email: "",
      phone: "",
      parent_phone: "",
      password: "",
      password_confirmation: "",
      nationality: "",
      study_level: "",
      governorate: "",
      city: "",
    });
    setInviteForm({ email: "" });
    setErrors({});
    setShowPassword(false);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    resetForms();
  }, [onOpenChange, resetForms]);

  const handleDirectSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});

      if (!directForm.name.trim()) {
        setErrors({ name: "الاسم مطلوب" });
        return;
      }
      if (!directForm.email.trim()) {
        setErrors({ email: "البريد الإلكتروني مطلوب" });
        return;
      }
      if (!directForm.password || directForm.password.length < 8) {
        setErrors({ password: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
        return;
      }
      if (directForm.password !== directForm.password_confirmation) {
        setErrors({ password_confirmation: "كلمتا المرور غير متطابقتين" });
        return;
      }

      createStudent.mutate(
        {
          name: directForm.name.trim(),
          email: directForm.email.trim(),
          phone: directForm.phone.trim() || undefined,
          parent_phone: directForm.parent_phone.trim() || undefined,
          password: directForm.password,
          password_confirmation: directForm.password_confirmation,
          nationality: directForm.nationality.trim() || undefined,
          study_level: directForm.study_level.trim() || undefined,
          governorate: directForm.governorate.trim() || undefined,
          city: directForm.city.trim() || undefined,
        },
        {
          onSuccess: () => handleClose(),
          onError: (err: unknown) => {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            const serverErrors = axiosErr?.response?.data?.errors;
            if (serverErrors) {
              const flat: Record<string, string> = {};
              for (const [key, msgs] of Object.entries(serverErrors)) {
                flat[key] = Array.isArray(msgs) ? (msgs[0] ?? "") : String(msgs);
              }
              setErrors(flat);
            }
          },
        },
      );
    },
    [directForm, createStudent, handleClose],
  );

  const handleInviteSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});

      if (!inviteForm.email.trim()) {
        setErrors({ email: "البريد الإلكتروني مطلوب" });
        return;
      }

      inviteStudent.mutate(
        { email: inviteForm.email.trim() },
        {
          onSuccess: () => handleClose(),
          onError: (err: unknown) => {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            const serverErrors = axiosErr?.response?.data?.errors;
            if (serverErrors) {
              const flat: Record<string, string> = {};
              for (const [key, msgs] of Object.entries(serverErrors)) {
                flat[key] = Array.isArray(msgs) ? (msgs[0] ?? "") : String(msgs);
              }
              setErrors(flat);
            }
          },
        },
      );
    },
    [inviteForm, inviteStudent, handleClose],
  );

  const isSubmitting = createStudent.isPending || inviteStudent.isPending;

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      className="w-full sm:max-w-[520px]"
    >
      <div className="flex flex-col bg-background" style={{ height: "100dvh" }}>
        <header className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <h2 className="text-lg font-semibold">إضافة طالب جديد</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </header>

        <div className="shrink-0 border-b bg-background">
          <div className="px-6 overflow-x-auto">
            <AppTabs value={activeTab} onValueChange={setActiveTab}>
              <AppTabsList className="flex h-auto gap-0 bg-transparent p-0 w-full border-0">
                {CREATE_TABS.map((tab) => (
                  <AppTabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                      "bg-transparent shadow-none rounded-none",
                      "hover:text-foreground",
                      "data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      "data-[state=inactive]:text-muted-foreground",
                      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all after:duration-200",
                      "data-[state=active]:after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100",
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </AppTabsTrigger>
                ))}
              </AppTabsList>
            </AppTabs>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "direct" ? (
            <form onSubmit={handleDirectSubmit} className="space-y-5">
              <div className="rounded-xl border bg-muted/20 p-4 mb-2">
                <p className="text-xs text-muted-foreground">
                  سيتم إنشاء حساب الطالب مباشرة بكلمة مرور محددة. يمكنك لاحقاً إعادة تعيين كلمة المرور إذا لزم الأمر.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  الاسم الكامل رباعي <span className="text-destructive">*</span>
                </label>
                <AppInput
                  value={directForm.name}
                  onChange={(e) => setDirectForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="أحمد محمد عبدالله علي"
                  className={cn(errors.name && "border-destructive")}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  البريد الإلكتروني <span className="text-destructive">*</span>
                </label>
                <AppInput
                  type="email"
                  dir="ltr"
                  value={directForm.email}
                  onChange={(e) => setDirectForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="student@example.com"
                  className={cn("text-left", errors.email && "border-destructive")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الهاتف</label>
                <AppInput
                  dir="ltr"
                  value={directForm.phone}
                  onChange={(e) => setDirectForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+966 5XXXXXXXX"
                  className="text-left"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">رقم هاتف ولي الأمر</label>
                <AppInput
                  dir="ltr"
                  value={directForm.parent_phone}
                  onChange={(e) => setDirectForm((p) => ({ ...p, parent_phone: e.target.value }))}
                  placeholder="+966 5XXXXXXXX"
                  className="text-left"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  كلمة المرور <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <AppInput
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={directForm.password}
                    onChange={(e) => setDirectForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="8 أحرف على الأقل"
                    className={cn("text-left pe-10", errors.password && "border-destructive")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  تأكيد كلمة المرور <span className="text-destructive">*</span>
                </label>
                <AppInput
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={directForm.password_confirmation}
                  onChange={(e) => setDirectForm((p) => ({ ...p, password_confirmation: e.target.value }))}
                  placeholder="أعد إدخال كلمة المرور"
                  className={cn("text-left", errors.password_confirmation && "border-destructive")}
                />
                {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الجنسية</label>
                <AppInput
                  value={directForm.nationality}
                  onChange={(e) => setDirectForm((p) => ({ ...p, nationality: e.target.value }))}
                  placeholder="مصرية / سعودية / ..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">المرحلة الدراسية</label>
                <AppSelect
                  value={directForm.study_level}
                  onValueChange={(v) => setDirectForm((p) => ({ ...p, study_level: v }))}
                >
                  <AppSelectTrigger>
                    <AppSelectValue placeholder="اختر المرحلة الدراسية..." />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    {stages.map((stage) => (
                      <AppSelectItem key={stage.id} value={stage.name}>
                        {stage.name}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">المحافظة</label>
                  <AppInput
                    value={directForm.governorate}
                    onChange={(e) => setDirectForm((p) => ({ ...p, governorate: e.target.value }))}
                    placeholder="القاهرة / الرياض / ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المدينة</label>
                  <AppInput
                    value={directForm.city}
                    onChange={(e) => setDirectForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="مدينة نصر / جدة / ..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <AppButton type="submit" className="flex-1" loading={isSubmitting}>
                  <UserPlus className="h-4 w-4" />
                  إنشاء الحساب
                </AppButton>
                <AppButton type="button" variant="outline" onClick={handleClose}>
                  إلغاء
                </AppButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleInviteSubmit} className="space-y-5">
              <div className="rounded-xl border bg-muted/20 p-4 mb-2">
                <p className="text-xs text-muted-foreground">
                  سيتم إرسال رابط دعوة للطالب على بريده الإلكتروني. يستطيع الطالب من خلاله إنشاء حسابه الخاص بكلمة مرور يختارها.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  البريد الإلكتروني للطالب <span className="text-destructive">*</span>
                </label>
                <AppInput
                  type="email"
                  dir="ltr"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ email: e.target.value })}
                  placeholder="student@example.com"
                  className={cn("text-left", errors.email && "border-destructive")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <AppButton type="submit" className="flex-1" loading={isSubmitting}>
                  <Mail className="h-4 w-4" />
                  إرسال الدعوة
                </AppButton>
                <AppButton type="button" variant="outline" onClick={handleClose}>
                  إلغاء
                </AppButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppDrawer>
  );
}

export { StudentCreateDrawer };
