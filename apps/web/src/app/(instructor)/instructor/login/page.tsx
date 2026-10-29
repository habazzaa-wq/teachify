"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { instructorApiErrorMessage } from "@/features/instructors/api";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { useTenantContext } from "@/providers/TenantProvider";

export default function InstructorLoginPage() {
  const router = useRouter();
  const { activeTenant } = useTenantContext();
  const { login } = useInstructorAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12">
      <section className="w-full rounded-2xl border bg-card p-7 shadow-sm">
        <p className="mb-2 text-sm text-muted-foreground">{activeTenant?.name ?? "Teachify"}</p>
        <h1 className="text-2xl font-bold">دخول المدرّس</h1>
        <p className="mt-2 text-sm text-muted-foreground">استخدم حساب المدرّس المخصص لك.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            البريد الإلكتروني
            <input
              className="w-full rounded-lg border bg-background px-3 py-2"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              dir="ltr"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            كلمة المرور
            <input
              className="w-full rounded-lg border bg-background px-3 py-2"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              dir="ltr"
            />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </section>
    </main>
  );
}
