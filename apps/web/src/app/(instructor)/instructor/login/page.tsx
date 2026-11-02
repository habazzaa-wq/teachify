"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { instructorApiErrorMessage } from "@/features/instructors/api";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { useUiStore } from "@/stores/ui.store";

export default function InstructorLoginPage() {
  const router = useRouter();
  const { activeTenant } = useTenantContext();
  const { login } = useInstructorAuth();
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const mustChangePassword = await login(email, password);
      router.replace(mustChangePassword ? "/instructor/change-password" : "/instructor/courses");
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="tenant-theme relative isolate flex min-h-screen flex-col overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10 lg:py-8"
      dir="rtl"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <GraduationCap aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="font-bold tracking-tight">{activeTenant?.name ?? "Teachify"}</p>
            <p className="text-xs text-muted-foreground">مساحة المدرّبين</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur sm:flex">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />
            دخول آمن للمدرّبين
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            title={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Sun aria-hidden="true" className="absolute inset-0 m-auto h-4 w-4 transition-all dark:rotate-90 dark:scale-0" />
            <Moon aria-hidden="true" className="absolute inset-0 m-auto h-4 w-4 scale-0 -rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </button>
        </div>
      </header>

      <div className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:py-12">
        <section className="mx-auto w-full max-w-lg motion-safe:animate-[fade-in-up_0.7s_ease-out_both]">
          <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-9">
            <div className="mb-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary/20 px-3 py-1.5 text-xs font-semibold text-foreground">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-secondary-foreground" />
                بوابتك إلى مساحة التعليم
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">أهلاً بعودتك</h1>
              <p className="mt-3 leading-7 text-muted-foreground">
                سجّل الدخول لإدارة دوراتك ومتابعة رحلتك التعليمية.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="instructor-email" className="text-sm font-semibold">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="instructor-email"
                    className="h-12 w-full rounded-xl border border-input bg-background/80 pr-11 pl-4 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    type="email"
                    autoComplete="username"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="instructor-password" className="text-sm font-semibold">
                  كلمة المرور
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="instructor-password"
                    className="h-12 w-full rounded-xl border border-input bg-background/80 py-2 pr-11 pl-12 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="أدخل كلمة المرور"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <button
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-primary to-primary/80 px-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-60"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
                {!submitting && (
                  <ArrowLeft
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />
              دخول آمن ومخصص لحسابات المدرّبين
            </div>
          </div>
        </section>

        <aside className="hidden motion-safe:animate-[fade-in-up_0.85s_ease-out_both] lg:block">
          <div className="relative mx-auto max-w-xl">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl" />
            <div className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary to-primary/90 p-9 text-primary-foreground shadow-2xl shadow-primary/20 xl:p-12">
              <div aria-hidden="true" className="absolute -left-16 -top-16 h-56 w-56 rounded-full border border-white/15" />
              <div aria-hidden="true" className="absolute -left-8 -top-8 h-40 w-40 rounded-full border border-white/15" />
              <div aria-hidden="true" className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-secondary/30 blur-2xl" />

              <div className="relative flex h-full min-h-[28rem] flex-col">
                <div className="mb-auto">
                  <span className="mb-12 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur">
                    <BookOpen aria-hidden="true" className="h-8 w-8" />
                  </span>
                  <p className="mb-3 text-sm font-semibold text-primary-foreground/75">
                    علّم. ألهم. اصنع فرقاً.
                  </p>
                  <h2 className="text-3xl font-extrabold leading-tight xl:text-4xl">
                    خبرتك تستحق
                    <br />
                    مساحة أكبر.
                  </h2>
                  <p className="mt-5 max-w-sm leading-8 text-primary-foreground/80">
                    أنشئ دوراتك، شارك معرفتك، وتابع أثر ما تقدّمه لطلابك من لوحة واحدة.
                  </p>
                </div>

                <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <Sparkles aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">ابدأ من حيث توقفت</p>
                      <p className="mt-1 text-xs text-primary-foreground/70">
                        دوراتك وأدواتك جاهزة في مكان واحد
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
