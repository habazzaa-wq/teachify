"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";
import { instructorApi, instructorApiErrorMessage } from "@/features/instructors/api";
import type { InstructorCourse } from "@/features/instructors/types";

export default function InstructorCoursesPage() {
  const { user, accessToken, logout } = useInstructorAuth();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      if (!accessToken) return;
      try {
        const response = await instructorApi.listCourses(accessToken);
        if (cancelled) return;
        setCourses(response.data);
        setError("");
      } catch (cause) {
        if (!cancelled) setError(instructorApiErrorMessage(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadKey]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">مساحة المدرّس</p>
          <h1 className="mt-1 text-2xl font-bold">مرحباً، {user?.name}</h1>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => void logout()}>
          تسجيل الخروج
        </button>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">الدورات المعيّنة لك</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              تظهر هنا الدورات التي يعيّنك عليها مسؤول الأكاديمية حالياً.
            </p>
          </div>
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => {
            setLoading(true);
            setReloadKey((key) => key + 1);
          }}>
            تحديث
          </button>
        </div>
        {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
        {loading ? (
          <p className="rounded-xl border p-6 text-sm text-muted-foreground">جارٍ تحميل الدورات...</p>
        ) : courses.length === 0 ? (
          <p className="rounded-xl border p-6 text-sm text-muted-foreground">لا توجد دورات معيّنة لك حالياً.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <Link
                className="rounded-xl border bg-card p-5 transition hover:border-primary"
                href={`/instructor/courses/${course.id}`}
                key={course.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{course.title}</h3>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{course.status}</span>
                </div>
                {course.subtitle && <p className="mt-2 text-sm text-muted-foreground">{course.subtitle}</p>}
                <p className="mt-4 text-xs text-muted-foreground">/{course.slug}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
