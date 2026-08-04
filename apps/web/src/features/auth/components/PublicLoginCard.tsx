"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Phone, Lock, LogIn, CheckCircle } from "lucide-react";
import { authService } from "@/services/api/auth.service";
import { tenantService } from "@/services/api/tenant.service";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import type { CurrentUserResponse, LoginResponse } from "@/types/auth.types";
import { cn } from "@/lib/cn";

const primary = "#D87B63";
const secondary = "#FFB50E";

interface PublicLoginCardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (response: {
    name: string;
    avatar?: string | null;
    token?: string | null;
    refreshToken?: string | null;
  }) => void;
}

interface FormErrors {
  [key: string]: string;
}

const ERROR_MESSAGES: Record<number, string> = {
  0: "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت",
  401: "رقم الهاتف أو كلمة المرور غير صحيحة",
  402: "انتهت صلاحية الاشتراك",
  403: "هذا الحساب غير نشط",
  422: "رقم الهاتف أو كلمة المرور غير صحيحة",
  429: "محاولات كثيرة جداً. حاول مرة أخرى لاحقاً",
};

export function PublicLoginCard({ open, onClose, onSuccess }: PublicLoginCardProps) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);

  const setAuthTokens = useAuthStore((s) => s.setTokens);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const setTenantContext = useTenantStore((s) => s.setTenantContext);

  const validateField = useCallback((name: string, value: string) => {
    switch (name) {
      case "phone":
        if (!value.trim()) return "رقم الهاتف مطلوب";
        if (!/^[\d+\s()-]{7,20}$/.test(value.trim())) return "رقم الهاتف غير صحيح";
        return "";
      case "password":
        if (!value) return "كلمة المرور مطلوبة";
        return "";
      default:
        return "";
    }
  }, []);

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
      if (fieldName === "phone") setPhone(value);
      if (fieldName === "password") setPassword(value);
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
      const value = fieldName === "phone" ? phone : password;
      validateAndUpdate(fieldName, value);
    },
    [phone, password, validateAndUpdate],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const allTouched: Record<string, boolean> = { phone: true, password: true };
      const allErrors: FormErrors = {};
      const phoneErr = validateField("phone", phone);
      const passErr = validateField("password", password);
      if (phoneErr) allErrors.phone = phoneErr;
      if (passErr) allErrors.password = passErr;
      setTouched(allTouched);
      setErrors(allErrors);
      if (Object.keys(allErrors).length > 0) return;

      setIsPending(true);
      setApiError(null);

      try {
        const loginResult: LoginResponse = await authService.login({
          phone: phone.trim(),
          password,
        });

        setAuthTokens(loginResult.access_token, loginResult.refresh_token);
        setAuthUser(loginResult.user);

        const loginData: CurrentUserResponse = {
          user: loginResult.user,
          tenant: loginResult.tenant,
          membership: loginResult.membership,
          roles: loginResult.roles,
          permissions: loginResult.permissions,
          abilities: loginResult.abilities,
          navigation: loginResult.navigation,
          subscription: loginResult.subscription,
          plan: loginResult.plan,
          feature_flags: loginResult.feature_flags,
        };
        const context = await tenantService.resolveFromLogin(loginData);

        setTenantContext({
          tenant: context.tenant,
          membership: context.membership,
          roles: context.roles,
          permissions: context.permissions,
          abilities: context.abilities,
          navigation: context.navigation,
        });

        const userState = {
          name: loginResult.user.name,
          token: loginResult.access_token,
          refreshToken: loginResult.refresh_token,
          avatar: loginResult.user.avatar ?? null,
        };
        localStorage.setItem("public-register-state", JSON.stringify(userState));

        setDone(true);
        setTimeout(() => {
          onSuccess({
            name: loginResult.user.name,
            avatar: loginResult.user.avatar ?? null,
            token: loginResult.access_token,
            refreshToken: loginResult.refresh_token,
          });
        }, 1200);
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
    [phone, password, validateField, setAuthTokens, setAuthUser, setTenantContext, onSuccess],
  );

  const resetForm = useCallback(() => {
    setPhone("");
    setPassword("");
    setErrors({});
    setTouched({});
    setApiError(null);
    setShowPassword(false);
    setDone(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

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
            style={{ boxShadow: `0 25px 60px -12px ${primary}25, 0 0 0 1px ${primary}10` }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
              style={{ background: `linear-gradient(90deg, ${primary}, ${secondary}, ${primary})` }}
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
                    style={{ background: `linear-gradient(135deg, ${secondary}20, ${primary}15)` }}
                  >
                    <CheckCircle className="h-8 w-8" style={{ color: secondary }} />
                  </motion.div>
                  <h3 className="text-lg font-bold text-foreground">تم تسجيل الدخول بنجاح!</h3>
                  <p className="mt-2 text-sm text-muted-foreground/60 text-center">
                    جارٍ تحويلك للصفحة الرئيسية...
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-5 text-center">
                    <div
                      className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${primary}, ${primary}cc)`,
                        boxShadow: `0 4px 16px ${primary}40`,
                      }}
                    >
                      <LogIn className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-base font-bold text-foreground">تسجيل الدخول</h2>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      أدخل رقم الهاتف وكلمة المرور للدخول إلى حسابك
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/50" />
                        رقم الهاتف
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          dir="ltr"
                          value={phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          onBlur={() => handleBlur("phone")}
                          placeholder="+20 1XXXXXXXXX"
                          disabled={isPending}
                          className={cn(inputClasses("phone"), "text-left ps-3")}
                        />
                      </div>
                      {touched.phone && errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-red-500 shrink-0" />
                          {errors.phone}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                        كلمة المرور
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          dir="ltr"
                          value={password}
                          onChange={(e) => handleChange("password", e.target.value)}
                          onBlur={() => handleBlur("password")}
                          placeholder="••••••••"
                          disabled={isPending}
                          className={cn(inputClasses("password"), "text-left pe-10")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

                    <div className="flex gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="relative flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60 group overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${primary}, ${primary}dd)`,
                          boxShadow: `0 4px 16px ${primary}40`,
                        }}
                      >
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin relative z-10" />
                        ) : (
                          <LogIn className="h-4 w-4 relative z-10" />
                        )}
                        <span className="relative z-10">{isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}</span>
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

                  <div className="mt-4 pt-3 border-t border-border/30 text-center">
                    <p className="text-[11px] text-muted-foreground/40">
                      ليس لديك حساب؟ تواصل مع الأكاديمية للتسجيل
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
