"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, KeyRound, CheckCircle, ShieldCheck } from "lucide-react";
import { changePasswordService } from "@/features/auth/services/change-password.service";
import { cn } from "@/lib/cn";

const secondary = "var(--brand-secondary)";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface FormErrors {
  [key: string]: string;
}

const ERROR_MESSAGES: Record<number, string> = {
  0: "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت",
  401: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى",
  422: "يرجى مراجعة البيانات المدخلة",
  429: "محاولات كثيرة جداً. حاول مرة أخرى لاحقاً",
};

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);

  const resetForm = useCallback(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setTouched({});
    setApiError(null);
    setIsPending(false);
    setDone(false);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }, []);

  const validateField = useCallback((name: string, value: string) => {
    switch (name) {
      case "current_password":
        if (!value) return "كلمة المرور الحالية مطلوبة";
        return "";
      case "password":
        if (!value) return "كلمة المرور الجديدة مطلوبة";
        if (value.length < MIN_PASSWORD_LENGTH) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
        if (value === currentPassword) return "كلمة المرور الجديدة يجب أن تختلف عن الحالية";
        return "";
      case "password_confirmation":
        if (!value) return "تأكيد كلمة المرور مطلوب";
        if (value !== newPassword) return "كلمتا المرور غير متطابقتين";
        return "";
      default:
        return "";
    }
  }, [currentPassword, newPassword]);

  const validateAndUpdate = useCallback(
    (fieldName: string, value: string) => {
      const error = validateField(fieldName, value);
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
    [validateField],
  );

  const handleChange = useCallback(
    (fieldName: string, value: string) => {
      if (fieldName === "current_password") setCurrentPassword(value);
      if (fieldName === "password") setNewPassword(value);
      if (fieldName === "password_confirmation") setConfirmPassword(value);
      setApiError(null);
      if (touched[fieldName]) {
        validateAndUpdate(fieldName, value);
      }
    },
    [touched, validateAndUpdate],
  );

  const handleBlur = useCallback(
    (fieldName: string) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
      const value =
        fieldName === "current_password"
          ? currentPassword
          : fieldName === "password"
            ? newPassword
            : confirmPassword;
      validateAndUpdate(fieldName, value);
    },
    [currentPassword, newPassword, confirmPassword, validateAndUpdate],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const allTouched: Record<string, boolean> = {
        current_password: true,
        password: true,
        password_confirmation: true,
      };
      const allErrors: FormErrors = {};
      const currentErr = validateField("current_password", currentPassword);
      const newErr = validateField("password", newPassword);
      const confirmErr = validateField("password_confirmation", confirmPassword);
      if (currentErr) allErrors.current_password = currentErr;
      if (newErr) allErrors.password = newErr;
      if (confirmErr) allErrors.password_confirmation = confirmErr;
      setTouched(allTouched);
      setErrors(allErrors);
      if (Object.keys(allErrors).length > 0) return;

      setIsPending(true);
      setApiError(null);

      try {
        const result = await changePasswordService.changePassword({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        });
        setDone(true);
        onSuccess?.(result.message);
      } catch (err: unknown) {
        const apiErr = err as { status?: number; message?: string; fieldErrors?: Record<string, string[]> };
        const status = apiErr?.status ?? 0;

        if (apiErr?.fieldErrors) {
          const flat: FormErrors = {};
          for (const [key, msgs] of Object.entries(apiErr.fieldErrors)) {
            flat[key] = Array.isArray(msgs) ? (msgs[0] ?? "") : String(msgs);
          }
          setErrors(flat);
          setTouched(Object.keys(apiErr.fieldErrors).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
        }

        const msg = apiErr?.message || ERROR_MESSAGES[status] || "حدث خطأ غير متوقع. حاول مرة أخرى.";
        setApiError(msg);
      } finally {
        setIsPending(false);
      }
    },
    [currentPassword, newPassword, confirmPassword, validateField, onSuccess],
  );

  const handleClose = useCallback(() => {
    if (isPending) return;
    resetForm();
    onClose();
  }, [isPending, onClose, resetForm]);

  const inputClasses = (field: string) =>
    cn(
      "h-10 w-full rounded-xl border bg-background/80 px-3 text-[13px] transition-all duration-200",
      "placeholder:text-muted-foreground/35",
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
            className="fixed z-[100] inset-x-0 inset-y-0 m-auto w-[calc(100vw-2rem)] max-w-md h-fit max-h-[90vh] rounded-3xl border border-border/40 bg-card shadow-2xl shadow-black/10 flex flex-col overflow-hidden"
            style={{ boxShadow: `0 25px 60px -12px rgba(0,0,0,0.145), 0 0 0 1px rgba(0,0,0,0.063)` }}
            role="dialog"
            aria-modal="true"
            aria-label="تغيير كلمة المرور"
          >
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
              style={{ background: `var(--brand-primary)` }}
            />

            <div className="p-5 sm:p-6 flex flex-col min-h-0 flex-1 overflow-y-auto">
              {done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                    className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                  >
                    <CheckCircle className="h-8 w-8" style={{ color: secondary }} />
                  </motion.div>
                  <h3 className="text-lg font-bold text-foreground">تم تغيير كلمة المرور بنجاح!</h3>
                  <p className="mt-2 text-sm text-muted-foreground/60 text-center">
                    يمكنك الآن استخدام كلمة المرور الجديدة عند تسجيل الدخول
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 h-10 px-8 rounded-xl text-sm font-semibold text-white transition-all duration-300"
                    style={{
                      background: `var(--brand-primary)`,
                      boxShadow: `0 4px 16px rgba(0,0,0,0.251)`,
                    }}
                  >
                    تم
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-5 text-center">
                    <div
                      className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: `var(--brand-primary)`,
                        boxShadow: `0 4px 16px rgba(0,0,0,0.251)`,
                      }}
                    >
                      <KeyRound className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-base font-bold text-foreground">تغيير كلمة المرور</h2>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                        كلمة المرور الحالية
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrent ? "text" : "password"}
                          dir="ltr"
                          value={currentPassword}
                          onChange={(e) => handleChange("current_password", e.target.value)}
                          onBlur={() => handleBlur("current_password")}
                          placeholder="••••••••"
                          disabled={isPending}
                          autoComplete="current-password"
                          className={cn(inputClasses("current_password"), "text-left pe-10")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent((v) => !v)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                          tabIndex={-1}
                        >
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {touched.current_password && errors.current_password && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
                          {errors.current_password}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                        كلمة المرور الجديدة
                      </label>
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          dir="ltr"
                          value={newPassword}
                          onChange={(e) => handleChange("password", e.target.value)}
                          onBlur={() => handleBlur("password")}
                          placeholder="••••••••"
                          disabled={isPending}
                          autoComplete="new-password"
                          className={cn(inputClasses("password"), "text-left pe-10")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((v) => !v)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                          tabIndex={-1}
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {touched.password && errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
                          {errors.password}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                        تأكيد كلمة المرور الجديدة
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          dir="ltr"
                          value={confirmPassword}
                          onChange={(e) => handleChange("password_confirmation", e.target.value)}
                          onBlur={() => handleBlur("password_confirmation")}
                          placeholder="••••••••"
                          disabled={isPending}
                          autoComplete="new-password"
                          className={cn(inputClasses("password_confirmation"), "text-left pe-10")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {touched.password_confirmation && errors.password_confirmation && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
                          {errors.password_confirmation}
                        </motion.p>
                      )}
                    </div>

                    {apiError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3"
                      >
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">
                          {apiError}
                        </p>
                      </motion.div>
                    )}

                    <div className="flex items-center gap-1.5 px-1 pt-0.5">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: secondary }} />
                      <p className="text-[11px] text-muted-foreground/50">
                        كلمة المرور يجب أن تتكون من 8 أحرف على الأقل
                      </p>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="relative flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60 group overflow-hidden"
                        style={{
                          background: `var(--brand-primary)`,
                          boxShadow: `0 4px 16px rgba(0,0,0,0.251)`,
                        }}
                      >
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin relative z-10" />
                        ) : (
                          <KeyRound className="h-4 w-4 relative z-10" />
                        )}
                        <span className="relative z-10">
                          {isPending ? "جارٍ تغيير كلمة المرور..." : "تغيير كلمة المرور"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isPending}
                        className="h-10 px-5 rounded-xl text-sm font-medium border border-border/50 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
