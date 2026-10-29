"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { instructorApi, instructorApiErrorMessage } from "@/features/instructors/api";
import type { InstructorCourse } from "@/features/instructors/types";

interface CourseForm {
  title: string;
  subtitle: string;
  short_description: string;
  description: string;
  difficulty: string;
  language: string;
}

function formFromCourse(course: InstructorCourse): CourseForm {
  return {
    title: course.title ?? "",
    subtitle: course.subtitle ?? "",
    short_description: course.shortDescription ?? "",
    description: course.description ?? "",
    difficulty: course.difficulty ?? "all_levels",
    language: course.language ?? "ar",
  };
}

export default function InstructorCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const { accessToken, logout } = useInstructorAuth();
  const [course, setCourse] = useState<InstructorCourse | null>(null);
  const [form, setForm] = useState<CourseForm | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadCourse() {
      if (!accessToken) return;
      try {
        const response = await instructorApi.getCourse(accessToken, courseId);
        if (cancelled) return;
        setCourse(response.data);
        setForm(formFromCourse(response.data));
        setError("");
      } catch (cause) {
        if (!cancelled) setError(instructorApiErrorMessage(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCourse();
    return () => {
      cancelled = true;
    };
  }, [accessToken, courseId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !form) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await instructorApi.updateCourse(accessToken, courseId, form);
      setCourse(response.data);
      setForm(formFromCourse(response.data));
      setNotice("تم حفظ تغييرات الدورة.");
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!accessToken) return;
    setError("");
    setNotice("");
    try {
      const response = await instructorApi.publishCourse(accessToken, courseId);
      setCourse(response.data);
      setForm(formFromCourse(response.data));
      setNotice("تم نشر الدورة.");
    } catch (cause) {
      setError(instructorApiErrorMessage(cause));
    }
  }

  if (loading) return <main className="mx-auto max-w-4xl px-5 py-10">جارٍ تحميل الدورة...</main>;
  if (!course || !form) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p role="alert" className="text-destructive">{error || "الدورة غير متاحة."}</p>
        <Link className="mt-4 inline-block underline" href="/instructor/courses">العودة للدورات</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link className="text-sm text-muted-foreground underline" href="/instructor/courses">كل الدورات</Link>
          <h1 className="mt-2 text-2xl font-bold">{course.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">الحالة: {course.status}</p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => void logout()}>
          تسجيل الخروج
        </button>
      </header>

      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mb-4 text-sm text-green-700">{notice}</p>}
      <form onSubmit={save} className="space-y-5 rounded-xl border bg-card p-5">
        <label className="block space-y-2 text-sm font-medium">
          عنوان الدورة
          <input className="w-full rounded-lg border bg-background px-3 py-2" required maxLength={255}
            value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          العنوان الفرعي
          <input className="w-full rounded-lg border bg-background px-3 py-2" maxLength={255}
            value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          وصف مختصر
          <textarea className="min-h-20 w-full rounded-lg border bg-background px-3 py-2" maxLength={500}
            value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          وصف الدورة
          <textarea className="min-h-36 w-full rounded-lg border bg-background px-3 py-2"
            value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            المستوى
            <select className="block w-full rounded-lg border bg-background px-3 py-2" value={form.difficulty}
              onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
              <option value="all_levels">كل المستويات</option>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            اللغة
            <input className="block w-full rounded-lg border bg-background px-3 py-2" maxLength={10}
              value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
          {course.status !== "published" && (
            <button type="button" onClick={() => void publish()}
              className="rounded-lg border px-4 py-2 font-semibold">
              نشر الدورة
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
