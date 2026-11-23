"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Phone, Lock, LogIn, CheckCircle, Mail } from "lucide-react";
import { authService } from "@/services/api/auth.service";
import { tenantService } from "@/services/api/tenant.service";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantStore } from "@/stores/tenant.store";
import type { CurrentUserResponse, LoginResponse } from "@/types/auth.types";
import { cn } from "@/lib/cn";

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

interface FormErrors { [key: string]: string }

const ERROR_MESSAGES: Record<number, string> = {
  0: "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت",
  401: "بيانات الدخول غير صحيحة",
  402: "انتهت صلاحية الاشتراك",
  403: "هذا الحساب غير نشط",
  422: "بيانات الدخول غير صحيحة",
  429: "محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا",
};

export function PublicLoginCard({ open, onClose, onSuccess }: PublicLoginCardProps) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
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
    if (name === "phone") {
      if (!value.trim()) return "";
      if (!/^[\d+\s()-]{7,20}$/.test(value.trim())) return "رقم الهاتف غير صحيح";
    }
    if (name === "email") {
      if (!value.trim()) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "البريد الإلكتروني غير صحيح";
    }
    if (name === "password" && !value) return "كلمة المرور مطلوبة";
    return "";
  }, []);

  const validateAndUpdate = useCallback((field: string, value: string) => {
    const error = validateField(field, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[field] = error; else delete next[field];
      return next;
    });
  }, [validateField]);

  const handleChange = (field: string, value: string) => {
    if (field === "phone") setPhone(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setApiError(null);
    if (touched[field]) validateAndUpdate(field, value);
  };

  const handleBlur = (field: string) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const value = field === "phone" ? phone : field === "email" ? email : password;
    validateAndUpdate(field, value);
  };

  const resetForm = useCallback(() => {
    setPhone(""); setEmail(""); setEmailNotificationsEnabled(true); setPassword("");
    setErrors({}); setTouched({}); setApiError(null); setShowPassword(false); setDone(false);
  }, []);

  const handleClose = useCallback(() => { resetForm(); onClose(); }, [resetForm, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const allErrors: FormErrors = {};
    const phoneErr = validateField("phone", phone);
    const emailErr = validateField("email", email);
    const passErr = validateField("password", password);
    if (phoneErr) allErrors.phone = phoneErr;
    if (emailErr) allErrors.email = emailErr;
    if (passErr) allErrors.password = passErr;
    if (!phone.trim() && !email.trim()) allErrors.identifier = "أدخل رقم الهاتف أو البريد الإلكتروني";
    setTouched({ phone: true, email: true, password: true });
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    setIsPending(true);
    setApiError(null);
    try {
      const payload: any = { password };
      if (phone.trim()) payload.phone = phone.trim();
      if (email.trim()) {
        payload.email = email.trim();
        payload.email_notifications_enabled = !!emailNotificationsEnabled;
      }
      const loginResult: LoginResponse = await authService.login(payload);

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
        tenant: context.tenant, membership: context.membership, roles: context.roles,
        permissions: context.permissions, abilities: context.abilities, navigation: context.navigation,
      });

      localStorage.setItem("public-register-state", JSON.stringify({
        name: loginResult.user.name,
        token: loginResult.access_token,
        refreshToken: loginResult.refresh_token,
        avatar: loginResult.user.avatar ?? null,
      }));
      window.dispatchEvent(new Event("public-auth-updated"));

      setDone(true);
      setTimeout(() => onSuccess({
        name: loginResult.user.name,
        avatar: loginResult.user.avatar ?? null,
        token: loginResult.access_token,
        refreshToken: loginResult.refresh_token,
      }), 900);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string; fieldErrors?: Record<string, string[]> };
      const status = apiErr?.status ?? 0;
      if (apiErr?.fieldErrors) {
        const flat: FormErrors = {};
        for (const [k, msgs] of Object.entries(apiErr.fieldErrors)) flat[k] = Array.isArray(msgs) ? (msgs[0] ?? "") : String(msgs);
        setErrors((p) => ({ ...p, ...flat }));
      }
      setApiError(apiErr?.message || ERROR_MESSAGES[status] || "حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setIsPending(false);
    }
  }, [phone, email, emailNotificationsEnabled, password, validateField, setAuthTokens, setAuthUser, setTenantContext, onSuccess]);

  const inputClasses = (field: string) => cn(
    "h-10 w-full rounded-xl border bg-background/80 px-3 text-[13px] transition-all duration-200 placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-offset-1",
    touched[field] && errors[field] ? "border-red-400 focus:ring-red-400/30" : "border-border/50 focus:ring-primary/20 focus:border-primary/50",
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed z-[100] inset-x-0 inset-y-0 m-auto w-[calc(100vw-2rem)] max-w-md h-fit max-h-[90vh] rounded-3xl border border-border/40 bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl" style={{ background: `var(--brand-primary)` }} />
            <div className="p-5 sm:p-6 flex flex-col min-h-0 flex-1 overflow-y-auto">
              {done ? (
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="h-10 w-10 mb-4" style={{ color: "var(--brand-primary)" }} />
                  <h3 className="text-lg font-bold text-foreground">تم تسجيل الدخول بنجاح!</h3>
                </motion.div>
              ) : (
                <>
                  <div className="mb-5 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `var(--brand-primary)` }}>
                      <LogIn className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-base font-bold text-foreground">تسجيل الدخول</h2>
                    <p className="mt-1 text-xs text-muted-foreground/60">أدخل رقم الهاتف أو البريد الإلكتروني مع كلمة المرور</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground/50" />رقم الهاتف</label>
                      <input type="tel" dir="ltr" value={phone} onChange={(e) => handleChange("phone", e.target.value)} onBlur={() => handleBlur("phone")}
                        placeholder="+20 1XXXXXXXXX" disabled={isPending} className={cn(inputClasses("phone"), "text-left")} />
                      {touched.phone && errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground/50" />البريد الإلكتروني</label>
                      <input type="email" dir="ltr" value={email} onChange={(e) => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")}
                        placeholder="name@gmail.com" disabled={isPending} className={cn(inputClasses("email"), "text-left")} />
                      {touched.email && errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                      <label className="flex items-center gap-2 text-xs text-foreground/70 cursor-pointer">
                        <input type="checkbox" checked={emailNotificationsEnabled} onChange={(e) => setEmailNotificationsEnabled(e.target.checked)} className="h-4 w-4 rounded border-border" />
                        تفعيل البريد الإلكتروني لاستقبال الإشعارات
                      </label>
                    </div>

                    {errors.identifier && <p className="text-xs text-red-500">{errors.identifier}</p>}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-muted-foreground/50" />كلمة المرور</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} dir="ltr" value={password} onChange={(e) => handleChange("password", e.target.value)} onBlur={() => handleBlur("password")}
                          placeholder="********" disabled={isPending} className={cn(inputClasses("password"), "text-left pe-10")} />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70" tabIndex={-1}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {touched.password && errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>

                    {apiError && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3"><p className="text-sm text-red-600 dark:text-red-400 text-center">{apiError}</p></div>}

                    <div className="flex gap-3 pt-1">
                      <button type="submit" disabled={isPending} className="relative flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: `var(--brand-primary)` }}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                        <span>{isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}</span>
                      </button>
                      <button type="button" onClick={handleClose} disabled={isPending} className="h-10 px-5 rounded-xl text-sm font-medium border border-border/50 bg-background/80 text-muted-foreground hover:text-foreground">إلغاء</button>
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
