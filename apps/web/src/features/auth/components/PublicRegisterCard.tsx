"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, CheckCircle, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { usePublicRegister, type PublicRegisterPayload, type PublicRegisterResponse } from "../hooks/use-public-register";
import { usePublicStages } from "@/features/homepage/educational-stages/hooks";
import { cn } from "@/lib/cn";

const secondary = "var(--brand-secondary)";

interface PublicRegisterCardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (response: PublicRegisterResponse) => void;
}

interface FormErrors {
  [key: string]: string;
}

interface FormData {
  name: string;
  phone: string;
  parent_phone: string;
  password: string;
  password_confirmation: string;
  gender: string;
  study_type: string;
  study_level: string;
  governorate: string;
  city: string;
}

const STUDY_TYPES = [
  "أونلاين", "اوفلاين",
];

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحيرة", "المنوفية",
  "الغربية", "كفر الشيخ", "دمياط", "الشرقية", "الفيوم", "بني سويف",
  "المنيا", "أسيوط", "الوادي الجديد", "سوهاج", "قنا", "الأقصر",
  "أسوان", "البحر الأحمر", "الإسماعيلية", "السويس", "بورسعيد",
  "شمال سيناء", "جنوب سيناء", "مطروح",
];

const CITIES_BY_GOVERNORATE: Record<string, string[]> = {
  "القاهرة": ["مدينة نصر", "المعادي", "شبرا", "مصر الجديدة", "الزمالك", "وسط البلد", "التجمع الخامس", "الشروق", "العبور"],
  "الجيزة": ["الهرم", "فيصل", "الدقي", "المهندسين", "أكتوبر", "السادس من أكتوبر", "الحى السابع", "العبور"],
  "الإسكندرية": ["سيدي جابر", "المنشية", "العطاريد", "الرمل", "الجمرك", "الບাকوس", "المايストرو", "العجمي"],
  "السويس": ["الجناين", "الفيروز", "عريش", "عتاقة", "ال-arab"],
  "الدقهلية": ["المنصورة", "طلخا", "المحلة الكبيرة", "نبروه", "شربين"],
  "البحيرة": ["الإسكندرية", "دمنهور", "كفر الدوار", "رشيد", "الرحمانية"],
  "المنوفية": ["شبين الكوم", "منوف", "السادات", "أشمون"],
  "الغربية": ["المحلة الكبيرة", "زفتى", "طنطا", "السنبلاوين", "كفر الزيات"],
  "كفر الشيخ": ["كفر الشيخ", "دسوق", "بيلا", "الحامول", "فوه"],
  "الفيوم": ["الفيوم", "سنورس", "طامية", "إبشواي", "العOKIE"],
  "الشرقية": ["الزقازيق", "العاشر من رمضان", "بلبيس", "منيا القمح", "أبو حماد"],
  "بني سويف": ["بني سويف", "الواسطى", "ناصر", "إهناسيا", "ببا"],
  "المنيا": ["المنيا", "ملوي", "سمالوط", "أبوقرقاص", "العدوة"],
  "أسيوط": ["أسيوط", "القوصية", "الغنايم", "أبو تيج", "طموه"],
  "سوهاج": ["سوهاج", "جراجة", "العريش", "طهطا", "البلينا"],
  "قنا": ["قنا", "دشنا", "فرشوط", "القوصية", "أبو تشت"],
  "الأقصر": ["الأقصر", "الوادي الجديد", "إسنا", "طيبة"],
  "أسوان": ["أسوان", "كوم أمبو", "دراو", "نصر النوبة", "إدفو"],
  "البحر الأحمر": ["الغردقة", "رأس سدر", "ال�hea", "سافاجا"],
  "الإسماعيلية": ["الإسماعيلية", "القنطرة شرق", "القنطرة غرب", "فايد"],
  "بورسعيد": ["بورسعيد", "العرب"],
  "شمال سيناء": ["العريش", "رفح", "الشيخ زويد"],
  "جنوب سيناء": ["الطور", "سانت كاترين", "دهب", "طابا"],
  "مطروح": ["مطروح", "الحمام", "العلمين", "سلوم"],
};

function validateField(name: string, value: string, allData: FormData): string {
  switch (name) {
    case "name": {
      if (!value.trim()) return "اسم الطالب مطلوب";
      const parts = value.trim().split(/\s+/);
      if (parts.length < 4) return "الأسم يجب ان يكون رباعي, أو اكثر";
      return "";
    }
    case "phone":
      if (!value.trim()) return "";
      if (!/^[\d+\s()-]{7,20}$/.test(value.trim())) return "رقم الهاتف غير صحيح";
      return "";
    case "parent_phone":
      if (!value.trim()) return "";
      if (!/^[\d+\s()-]{7,20}$/.test(value.trim())) return "رقم الهاتف غير صحيح";
      return "";
    case "password": {
      if (!value) return "كلمة المرور مطلوبة";
      if (value.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
      return "";
    }
    case "password_confirmation": {
      if (!value) return "تأكيد كلمة المرور مطلوب";
      if (value !== allData.password) return "كلمتا المرور غير متطابقتين";
      return "";
    }
    default:
      return "";
  }
}

export function PublicRegisterCard({ open, onClose, onSuccess }: PublicRegisterCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    parent_phone: "",
    password: "",
    password_confirmation: "",
    gender: "",
    study_type: "",
    study_level: "",
    governorate: "",
    city: "",
  });

  const registerMutation = usePublicRegister();
  const { data: stagesData } = usePublicStages();
  const stages = stagesData?.items ?? [];

  const availableCities = useMemo(() => {
    if (!form.governorate) return [];
    return CITIES_BY_GOVERNORATE[form.governorate] ?? [];
  }, [form.governorate]);

  const validateAndUpdate = useCallback(
    (fieldName: string, value: string) => {
      const error = validateField(fieldName, value, { ...form, [fieldName]: value });
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[fieldName] = error;
        } else {
          delete next[fieldName];
        }
        return next;
      });
    },
    [form],
  );

  const handleChange = useCallback(
    (fieldName: string, value: string) => {
      setForm((prev) => ({ ...prev, [fieldName]: value }));
      if (touched[fieldName]) {
        validateAndUpdate(fieldName, value);
      }
      if (fieldName === "governorate") {
        setForm((prev) => ({ ...prev, city: "" }));
      }
      if (fieldName === "password" && touched.password_confirmation) {
        validateAndUpdate("password_confirmation", form.password_confirmation);
      }
    },
    [touched, form, validateAndUpdate],
  );

  const handleBlur = useCallback(
    (fieldName: string) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
      validateAndUpdate(fieldName, form[fieldName as keyof FormData]);
    },
    [form, validateAndUpdate],
  );

  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const allTouched: Record<string, boolean> = {};
      const allErrors: FormErrors = {};
      for (const [key, value] of Object.entries(form)) {
        allTouched[key] = true;
        const error = validateField(key, value, form);
        if (error) allErrors[key] = error;
      }
      setTouched(allTouched);
      setErrors(allErrors);

      if (Object.keys(allErrors).length > 0) return;

      const payload: PublicRegisterPayload = {
        name: form.name.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.parent_phone.trim()) payload.parent_phone = form.parent_phone.trim();
      if (form.gender) payload.gender = form.gender;
      if (form.study_type) payload.study_type = form.study_type;
      if (form.study_level) payload.study_level = form.study_level;
      if (form.governorate) payload.governorate = form.governorate;
      if (form.city) payload.city = form.city;

      registerMutation.mutate(payload, {
        onSuccess: (data) => {
          onSuccess(data);
        },
        onError: (err: unknown) => {
          const apiErr = err as { fieldErrors?: Record<string, string[]>; message?: string };
          const serverErrors = apiErr?.fieldErrors;
          if (serverErrors) {
            const flat: FormErrors = {};
            for (const [key, msgs] of Object.entries(serverErrors)) {
              flat[key] = Array.isArray(msgs) ? (msgs[0] ?? "") : String(msgs);
            }
            setErrors(flat);
            setTouched(
              Object.keys(serverErrors).reduce((acc, k) => ({ ...acc, [k]: true }), {}),
            );
          }
        },
      });
    },
    [form, registerMutation, onSuccess],
  );

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      phone: "",
      parent_phone: "",
      password: "",
      password_confirmation: "",
      gender: "",
      study_type: "",
      study_level: "",
      governorate: "",
      city: "",
    });
    setErrors({});
    setTouched({});
    setShowPassword(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const inputClasses = (field: string) =>
    cn(
      "h-9 w-full rounded-lg border bg-background/80 px-3 py-1.5 text-[13px] transition-all duration-200",
      "placeholder:text-muted-foreground/40",
      "focus:outline-none focus:ring-2 focus:ring-offset-1",
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-400/30"
        : "border-border/50 focus:ring-primary/20 focus:border-primary/50",
    );

  const selectClasses = (field: string) =>
    cn(
      "h-9 w-full rounded-lg border bg-background/80 px-3 py-1.5 text-[13px] transition-all duration-200 appearance-none cursor-pointer",
      "focus:outline-none focus:ring-2 focus:ring-offset-1",
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-red-400/30"
        : "border-border/50 focus:ring-primary/20 focus:border-primary/50",
    );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed z-[100] inset-x-0 inset-y-0 m-auto w-[calc(100vw-2rem)] max-w-lg h-fit max-h-[90vh] rounded-3xl border border-border/40 bg-card shadow-2xl shadow-black/10 flex flex-col"
            style={{ boxShadow: `0 25px 60px -12px rgb(var(--brand-primary-rgb) / 0.145), 0 0 0 1px rgb(var(--brand-primary-rgb) / 0.063)` }}
          >
            <div className="p-5 sm:p-6 flex flex-col min-h-0 flex-1 overflow-y-auto">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-foreground text-center">إنشاء حساب طالب جديد</h2>
                  <p className="mt-1 text-xs text-muted-foreground/60 text-center">
                    أكمل البيانات التالية للتسجيل في الأكاديمية
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">
                      اسم الطالب <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      placeholder="أحمد محمد عبدالله علي"
                      className={inputClasses("name")}
                    />
                    {touched.name && errors.name && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500">{errors.name}</motion.p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">نوع الدراسة</label>
                    <div className="relative">
                      <select
                        value={form.study_type}
                        onChange={(e) => handleChange("study_type", e.target.value)}
                        onBlur={() => handleBlur("study_type")}
                        className={selectClasses("study_type")}
                      >
                        <option value="">اختر النوع</option>
                        {STUDY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground/80">رقم الهاتف</label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        onBlur={() => handleBlur("phone")}
                        placeholder="+20 1XXXXXXXXX"
                        className={cn(inputClasses("phone"), "text-left")}
                      />
                      {touched.phone && errors.phone && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500">{errors.phone}</motion.p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground/80">رقم هاتف ولي الأمر</label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={form.parent_phone}
                        onChange={(e) => handleChange("parent_phone", e.target.value)}
                        onBlur={() => handleBlur("parent_phone")}
                        placeholder="+20 1XXXXXXXXX"
                        className={cn(inputClasses("parent_phone"), "text-left")}
                      />
                      {touched.parent_phone && errors.parent_phone && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500">{errors.parent_phone}</motion.p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">
                      كلمة المرور <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        dir="ltr"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        onBlur={() => handleBlur("password")}
                        placeholder="8 أحرف على الأقل"
                        className={cn(inputClasses("password"), "text-left pe-10")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500">{errors.password}</motion.p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">
                      تأكيد كلمة المرور <span className="text-destructive">*</span>
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={form.password_confirmation}
                      onChange={(e) => handleChange("password_confirmation", e.target.value)}
                      onBlur={() => handleBlur("password_confirmation")}
                      placeholder="أعد إدخال كلمة المرور"
                      className={cn(inputClasses("password_confirmation"), "text-left")}
                    />
                    {touched.password_confirmation && errors.password_confirmation && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500">{errors.password_confirmation}</motion.p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">الجنس</label>
                    <div className="relative">
                      <select
                        value={form.gender}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        onBlur={() => handleBlur("gender")}
                        className={selectClasses("gender")}
                      >
                        <option value="">اختر الجنس</option>
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                      <ChevronDown className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">المرحلة الدراسية</label>
                    <div className="relative">
                      <select
                        value={form.study_level}
                        onChange={(e) => handleChange("study_level", e.target.value)}
                        onBlur={() => handleBlur("study_level")}
                        className={selectClasses("study_level")}
                      >
                        <option value="">اختر المرحلة الدراسية</option>
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.name}>{stage.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground/80">المحافظة</label>
                      <div className="relative">
                        <select
                          value={form.governorate}
                          onChange={(e) => handleChange("governorate", e.target.value)}
                          onBlur={() => handleBlur("governorate")}
                          className={selectClasses("governorate")}
                        >
                          <option value="">اختر المحافظة</option>
                          {GOVERNORATES.map((gov) => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground/80">المدينة</label>
                      <div className="relative">
                        <select
                          value={form.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          onBlur={() => handleBlur("city")}
                          disabled={!form.governorate}
                          className={cn(selectClasses("city"), !form.governorate && "opacity-50 cursor-not-allowed")}
                        >
                          <option value="">اختر المدينة</option>
                          {availableCities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {registerMutation.isError && !hasErrors && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {(registerMutation.error as { message?: string })?.message ?? "حدث خطأ أثناء التسجيل. حاول مرة أخرى."}
                      </p>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="relative flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60"
                      style={{
                        background: `linear-gradient(135deg, var(--brand-primary), rgb(var(--brand-primary-rgb) / 0.867))`,
                        boxShadow: `0 4px 16px rgb(var(--brand-primary-rgb) / 0.251)`,
                      }}
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      <span>{registerMutation.isPending ? "جارٍ التسجيل..." : "إنشاء الحساب"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={registerMutation.isPending}
                      className="h-10 px-5 rounded-lg text-sm font-medium border border-border/50 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>

                <div className="mt-3 pt-3 border-t border-border/30 text-center">
                  <p className="text-[11px] text-muted-foreground/40">
                    بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية
                  </p>
                </div>
              </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function RegisterSuccessOverlay({ name, onDone }: { name: string; onDone: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        key="overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
        onClick={onDone}
      />
      <motion.div
        key="overlay-card"
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="fixed z-[100] top-1/2 inset-x-0 mx-auto -translate-y-1/2 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-border/40 bg-card p-8 text-center shadow-2xl"
        style={{ boxShadow: `0 25px 60px -12px rgb(var(--brand-secondary-rgb) / 0.188)` }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.15 }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: `linear-gradient(135deg, rgb(var(--brand-secondary-rgb) / 0.125), rgb(var(--brand-primary-rgb) / 0.082))`,
          }}
        >
          <CheckCircle className="h-8 w-8" style={{ color: secondary }} />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground">تم التسجيل بنجاح!</h3>
        <p className="mt-2 text-sm text-muted-foreground/60">
          مرحباً <span className="font-semibold text-foreground">{name}</span>
          <br />
          تم إنشاء حسابك بنجاح في الأكاديمية
        </p>
        <button
          onClick={onDone}
          className="mt-6 h-11 px-8 rounded-xl text-sm font-semibold text-white transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, var(--brand-primary), rgb(var(--brand-primary-rgb) / 0.867))`,
            boxShadow: `0 4px 16px rgb(var(--brand-primary-rgb) / 0.251)`,
          }}
        >
          الذهاب للرئيسية
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
