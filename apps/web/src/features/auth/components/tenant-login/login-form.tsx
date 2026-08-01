"use client";

import { useState, useSyncExternalStore, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/providers/AuthProvider";
import { authKeys } from "@/services/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import type { ApiError } from "@/types/common.types";
import { ErrorMessage, type NoticeKind } from "./error-message";
import { SuccessState } from "./success-state";

const schema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني أو رقم الهاتف مطلوب")
    .max(255)
    .refine(
      (value) => {
        const trimmed = value.trim();
        if (trimmed.includes("@")) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        }
        return /^[\d+\s()-]{7,20}$/.test(trimmed);
      },
      { message: "أدخل بريداً إلكترونياً أو رقم هاتف صحيحاً" },
    ),
  password: z.string().min(1, "كلمة المرور مطلوبة").max(255),
  remember: z.boolean().optional(),
});

type SchemaType = z.infer<typeof schema>;

const KIND_MAP: Record<number, NoticeKind> = {
  0: "server-unavailable",
  401: "credentials",
  402: "subscription-expired",
  403: "inactive",
  422: "credentials",
  429: "too-many-attempts",
};

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [remember, setRemember] = useState(true);
  const [alert, setAlert] = useState<{ kind: NoticeKind; message?: string } | null>(null);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const offline = useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => typeof navigator !== "undefined" && !navigator.onLine,
    () => false,
  );

  const mutation = useMutation({
    mutationFn: (data: SchemaType) => {
      const raw = data.email.trim();
      const isPhone = !raw.includes("@");
      return login({
        ...(isPhone ? { phone: raw } : { email: raw.toLowerCase() }),
        password: data.password,
      });
    },
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: authKeys.all });
        router.replace("/teacher/dashboard");
      }, 1200);
    },
    onError: (err: ApiError) => {
      const status = err?.status ?? 0;
      const msg = err?.message ?? "";
      const kind = KIND_MAP[status] ?? (status >= 500 ? "server-unavailable" : "generic");
      setAlert({ kind, message: msg });
      setShake((k) => k + 1);
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (mutation.isPending) return;
    setAlert(null);
    try {
      await mutation.mutateAsync({
        email: values.email,
        password: values.password,
        remember: values.remember,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.fieldErrors) {
        for (const [field, msgs] of Object.entries(apiErr.fieldErrors)) {
          const firstMsg = msgs[0];
          if (firstMsg) {
            setError(field as keyof SchemaType, { message: firstMsg });
          }
        }
      }
    }
  });

  const handleFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField(null);
  }, []);

  if (done) return <SuccessState />;

  return (
    <motion.form
      variants={formVariants}
      initial="hidden"
      animate="visible"
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
      aria-label="نموذج تسجيل الدخول"
    >
      {offline && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ErrorMessage kind="offline" />
        </motion.div>
      )}

      {alert && (
        <ErrorMessage
          kind={alert.kind}
          message={alert.message}
          shake={shake > 0}
        />
      )}

      <motion.div variants={fieldVariants} className="space-y-1.5">
        <label
          htmlFor="email"
          className={cn(
            "block text-xs font-medium transition-colors duration-200",
            focusedField === "email"
              ? "text-primary"
              : errors.email
                ? "text-destructive"
                : "text-muted-foreground/60",
          )}
        >
          البريد الإلكتروني أو رقم الهاتف
        </label>
        <div className="relative">
          <input
            {...register("email")}
            id="email"
            type="text"
            autoComplete="username"
            dir="ltr"
            disabled={mutation.isPending}
            placeholder="name@example.com أو 01XXXXXXXXX"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            onFocus={() => handleFocus("email")}
            onBlur={handleBlur}
            className={cn(
              "peer block h-11 w-full rounded-xl border px-3.5 text-sm transition-all duration-200",
              "bg-background text-foreground placeholder:text-muted-foreground/25",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              focusedField === "email" && !errors.email
                ? "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"
                : errors.email
                  ? "border-destructive/60 shadow-[0_0_0_3px_hsl(var(--destructive)/0.08)]"
                  : "border-border/60 hover:border-border",
            )}
          />
        </div>
        {errors.email && (
          <motion.p
            id="email-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-destructive/80 flex items-center gap-1"
            role="alert"
          >
            <span className="h-1 w-1 rounded-full bg-destructive/80 shrink-0" />
            {errors.email.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={fieldVariants} className="space-y-1.5">
        <label
          htmlFor="password"
          className={cn(
            "block text-xs font-medium transition-colors duration-200",
            focusedField === "password"
              ? "text-primary"
              : errors.password
                ? "text-destructive"
                : "text-muted-foreground/60",
          )}
        >
          كلمة المرور
        </label>
        <div className="relative">
          <input
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            dir="ltr"
            disabled={mutation.isPending}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            onFocus={() => handleFocus("password")}
            onBlur={handleBlur}
            className={cn(
              "peer block h-11 w-full rounded-xl border px-3.5 text-sm transition-all duration-200",
              "bg-background text-foreground placeholder:text-muted-foreground/25",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "ps-10",
              focusedField === "password" && !errors.password
                ? "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"
                : errors.password
                  ? "border-destructive/60 shadow-[0_0_0_3px_hsl(var(--destructive)/0.08)]"
                  : "border-border/60 hover:border-border",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute start-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-foreground/[0.04] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        {errors.password && (
          <motion.p
            id="password-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-destructive/80 flex items-center gap-1"
            role="alert"
          >
            <span className="h-1 w-1 rounded-full bg-destructive/80 shrink-0" />
            {errors.password.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        variants={fieldVariants}
        className="flex items-center justify-between"
      >
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="peer sr-only"
              disabled={mutation.isPending}
            />
            <motion.div
              className={cn(
                "h-4 w-4 rounded border-2 transition-all duration-200",
                "border-muted-foreground/25 group-hover:border-primary/40",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                remember && "border-primary bg-primary",
              )}
              animate={remember ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              {remember && (
                <svg
                  className="h-full w-full text-primary-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </motion.div>
          </div>
          <span className="text-xs text-muted-foreground/50 select-none group-hover:text-muted-foreground/70 transition-colors">
            تذكرني
          </span>
        </label>

        <Link
          href="/forgot-password"
          className="text-xs text-muted-foreground/40 hover:text-primary transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          tabIndex={mutation.isPending ? -1 : 0}
        >
          نسيت كلمة المرور؟
        </Link>
      </motion.div>

      <motion.div variants={fieldVariants}>
        <motion.button
          type="submit"
          disabled={offline || mutation.isPending}
          whileHover={!offline && !mutation.isPending ? { scale: 1.01 } : {}}
          whileTap={!offline && !mutation.isPending ? { scale: 0.99 } : {}}
          className={cn(
            "relative w-full h-11 rounded-xl text-sm font-semibold text-white overflow-hidden",
            "bg-gradient-to-r from-primary to-primary/80",
            "shadow-md shadow-primary/20 dark:shadow-primary/15",
            "transition-all duration-300 ease-out",
            "hover:shadow-lg hover:shadow-primary/25 hover:from-primary/90 hover:to-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "group",
          )}
          aria-label={
            mutation.isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"
          }
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ تسجيل الدخول...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                تسجيل الدخول
              </>
            )}
          </span>
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </motion.button>
      </motion.div>
    </motion.form>
  );
}

export { LoginForm };
