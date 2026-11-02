"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  LogOut,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { instructorApiErrorMessage } from "@/features/instructors/api";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";
import { useUiStore } from "@/stores/ui.store";

export default function InstructorChangePasswordPage() {
  const { activeTenant } = useTenantContext();
  const { changePassword, logout } = useInstructorAuth();
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const meetsLengthRequirement = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmation;
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "ضعيفة", "جيدة", "قوية"][strength];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await changePassword(password, confirmation);
      window.location.assign("/instructor/courses");
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
            حماية حسابك تبدأ بكلمة مرور قوية
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            title={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Sun
              aria-hidden="true"
              className="absolute inset-0 m-auto h-4 w-4 transition-all dark:rotate-90 dark:scale-0"
            />
            <Moon
              aria-hidden="true"
              className="absolute inset-0 m-auto h-4 w-4 scale-0 -rotate-90 transition-all dark:scale-100 dark:rotate-0"
            />
          </button>
        </div>
      </header>

      <div className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 py-8 lg:grid-cols-[0.9fr_1fr] lg:gap-16 lg:py-12">
        <section className="mx-auto w-full max-w-xl motion-safe:animate-[fade-in-up_0.7s_ease-out_both]">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
              <KeyRound aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary">خطوة واحدة للبدء</p>
              <p className="mt-1 text-xs text-muted-foreground">تأمين الحساب · 01 / 01</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-9">
            <div className="mb-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary/20 px-3 py-1.5 text-xs font-semibold text-foreground">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-secondary-foreground" />
                إعداد حسابك لأول مرة
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                أنشئ كلمة مرورك الجديدة
              </h1>
              <p className="mt-3 leading-7 text-muted-foreground">
                اختر كلمة مرور خاصة بك لحماية حسابك، وبعدها ستنتقل مباشرة إلى لوحة المدرّب.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="instructor-new-password" className="text-sm font-semibold">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="instructor-new-password"
                    className="h-12 w-full rounded-xl border border-input bg-background/80 py-2 pr-11 pl-12 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="٨ أحرف على الأقل"
                    dir="ltr"
                    aria-describedby="password-guidance"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((visible) => !visible)}
                    aria-label={showPasswords ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {showPasswords ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-1" aria-live="polite">
                  <div
                    className="flex flex-1 gap-1.5"
                    role="progressbar"
                    aria-label="قوة كلمة المرور"
                    aria-valuemin={0}
                    aria-valuemax={3}
                    aria-valuenow={strength}
                  >
                    {[1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          strength >= level
                            ? strength === 1
                              ? "bg-destructive"
                              : strength === 2
                                ? "bg-secondary"
                                : "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="min-w-10 text-left text-xs text-muted-foreground">
                    {strengthLabel}
                  </span>
                </div>
                <p id="password-guidance" className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 ${meetsLengthRequirement ? "text-primary" : "text-muted-foreground/50"}`}
                  />
                  استخدم ٨ أحرف على الأقل، ويفضّل أن تكون أطول وأكثر تميزاً.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="instructor-confirm-password" className="text-sm font-semibold">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    id="instructor-confirm-password"
                    className={`h-12 w-full rounded-xl border bg-background/80 py-2 pr-11 pl-12 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:ring-4 ${
                      confirmation && !passwordsMatch
                        ? "border-destructive/60 focus:border-destructive focus:ring-destructive/10"
                        : "border-input focus:border-primary focus:ring-primary/10"
                    }`}
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="أعد كتابة كلمة المرور"
                    dir="ltr"
                    aria-invalid={Boolean(confirmation && !passwordsMatch)}
                    aria-describedby={confirmation && !passwordsMatch ? "password-match-error" : undefined}
                  />
                  {passwordsMatch && (
                    <Check
                      aria-hidden="true"
                      className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
                    />
                  )}
                </div>
                {confirmation && !passwordsMatch && (
                  <p id="password-match-error" className="text-xs text-destructive" role="status">
                    كلمتا المرور غير متطابقتين.
                  </p>
                )}
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
                disabled={submitting || !meetsLengthRequirement || !passwordsMatch}
              >
                {submitting ? "جارٍ تأمين حسابك..." : "حفظ كلمة المرور والمتابعة"}
                {!submitting && (
                  <ArrowLeft
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
                  />
                )}
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm text-muted-foreground transition hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => void logout()}
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />
              لا تشارك كلمة مرورك مع أي شخص.
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
                    <ShieldCheck aria-hidden="true" className="h-8 w-8" />
                  </span>
                  <p className="mb-3 text-sm font-semibold text-primary-foreground/75">
                    حسابك. مساحتك. بدايتك.
                  </p>
                  <h2 className="text-3xl font-extrabold leading-tight xl:text-4xl">
                    خطوة صغيرة،
                    <br />
                    وحماية أكبر.
                  </h2>
                  <p className="mt-5 max-w-sm leading-8 text-primary-foreground/80">
                    كلمة مرور قوية تساعد على إبقاء دوراتك ومحتواك التعليمي في أمان.
                  </p>
                </div>

                <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <KeyRound aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">جاهز للانطلاق؟</p>
                      <p className="mt-1 text-xs text-primary-foreground/70">
                        بعد الحفظ ستصل إلى لوحة المدرّب مباشرة
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
