"use client";

import { useState, type FormEvent } from "react";
import { instructorApiErrorMessage } from "@/features/instructors/api";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";

export default function InstructorChangePasswordPage() {
  const { changePassword, logout } = useInstructorAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12">
      <section className="w-full rounded-2xl border bg-card p-7 shadow-sm">
        <h1 className="text-2xl font-bold">تغيير كلمة المرور</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          يجب تعيين كلمة مرور جديدة قبل استخدام لوحة المدرّس.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            كلمة المرور الجديدة
            <input
              className="w-full rounded-lg border bg-background px-3 py-2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              dir="ltr"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            تأكيد كلمة المرور
            <input
              className="w-full rounded-lg border bg-background px-3 py-2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              dir="ltr"
            />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
            type="submit"
            disabled={submitting || password !== confirmation}
          >
            {submitting ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
          </button>
          <button type="button" className="w-full py-2 text-sm underline" onClick={() => void logout()}>
            تسجيل الخروج
          </button>
        </form>
      </section>
    </main>
  );
}
