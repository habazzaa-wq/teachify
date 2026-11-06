"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { instructorApi, instructorApiErrorMessage } from "@/features/instructors/api";

export default function NewInstructorCoursePage() {
  const router = useRouter();
  const { accessToken } = useInstructorAuth();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    setError("");
    try {
      const response = await instructorApi.createCourse(accessToken, {
        title: title.trim(),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      });
      router.replace(`/instructor/courses/${response.id}`);
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link className="text-sm text-muted-foreground underline" href="/instructor/courses">
        العودة إلى الدورات
      </Link>
      <h1 className="mt-3 text-2xl font-bold">إنشاء دورة جديدة</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ستُنشأ الدورة كمسودة وتُسند إليك تلقائياً، ويمكنك استكمال تفاصيلها قبل النشر.
      </p>

      <form onSubmit={createCourse} className="mt-6 space-y-5 rounded-xl border bg-card p-5">
        <label className="block space-y-2 text-sm font-medium">
          عنوان الدورة
          <input
            autoFocus
            required
            maxLength={255}
            className="w-full rounded-lg border bg-background px-3 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          رابط الدورة (اختياري)
          <input
            dir="ltr"
            maxLength={255}
            pattern="[A-Za-z0-9_-]+"
            className="w-full rounded-lg border bg-background px-3 py-2"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "جارٍ إنشاء الدورة..." : "إنشاء الدورة"}
        </button>
      </form>
    </main>
  );
}
