"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppSection, PermissionGuard } from "@/components/ui";
import { instructorAdminApi, type AssignableInstructor } from "@/features/instructors/admin-api";
import { COURSES_QUERY_KEY } from "@/features/courses/constants";
import { coursesService } from "@/features/courses/services";
import type { Course } from "@/features/courses/types";

interface CourseInstructorAssignmentsProps {
  course: Course;
}

const roleLabels: Record<string, string> = {
  primary: "المدرب الأساسي",
  co_instructor: "مدرب مشارك",
  assistant: "مساعد",
};

function CourseInstructorAssignmentsContent({ course }: CourseInstructorAssignmentsProps) {
  const queryClient = useQueryClient();
  const [availableInstructors, setAvailableInstructors] = useState<AssignableInstructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [role, setRole] = useState<"co_instructor" | "assistant">("co_instructor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    instructorAdminApi.options()
      .then((items) => {
        if (active) setAvailableInstructors(items);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "تعذر تحميل قائمة المدربين.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const assignedInstructorIds = useMemo(
    () => new Set(course.instructors?.map((instructor) => instructor.id) ?? []),
    [course.instructors],
  );
  const assignableInstructors = availableInstructors.filter(
    (instructor) => !assignedInstructorIds.has(String(instructor.id)),
  );

  async function refreshCourse() {
    await queryClient.invalidateQueries({ queryKey: [COURSES_QUERY_KEY, "detail", course.id] });
  }

  async function addInstructor() {
    if (!selectedInstructor) return;
    setSaving(true);
    setError("");
    try {
      await coursesService.assignInstructor(course.id, Number(selectedInstructor), role);
      setSelectedInstructor("");
      await refreshCourse();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إسناد المدرب إلى الدورة.");
    } finally {
      setSaving(false);
    }
  }

  async function removeInstructor(assignmentId: number | undefined) {
    if (!assignmentId) return;
    setSaving(true);
    setError("");
    try {
      await coursesService.removeInstructor(course.id, assignmentId);
      await refreshCourse();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إزالة المدرب من الدورة.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppSection className="mx-auto mt-6 w-full max-w-7xl">
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">المدربون المشاركون</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف مدربين لتوزيع شرح أجزاء الدورة بينهم.
          </p>
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        {course.instructors && course.instructors.length > 0 ? (
          <div className="divide-y rounded-xl border">
            {course.instructors.map((instructor) => (
              <div key={instructor.assignmentId ?? instructor.id} className="flex items-center gap-3 p-3">
                {instructor.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={instructor.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-muted font-semibold">
                    {instructor.name.slice(0, 1)}
                  </span>
                )}
                <span className="font-medium">{instructor.name}</span>
                <span className="mr-auto rounded-full bg-muted px-2.5 py-1 text-xs">
                  {roleLabels[instructor.role] ?? roleLabels.co_instructor}
                </span>
                {instructor.role !== "primary" && (
                  <button
                    type="button"
                    disabled={saving || !instructor.assignmentId}
                    onClick={() => void removeInstructor(instructor.assignmentId)}
                    className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    إزالة
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border p-4 text-sm text-muted-foreground">لا يوجد مدربون مسندون إلى هذه الدورة بعد.</p>
        )}

        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <select
            value={selectedInstructor}
            onChange={(event) => setSelectedInstructor(event.target.value)}
            disabled={loading || saving || assignableInstructors.length === 0}
            className="rounded-lg border bg-background px-3 py-2"
            aria-label="اختيار مدرب"
          >
            <option value="">
              {loading ? "جارٍ تحميل المدربين..." : "اختر مدربًا"}
            </option>
            {assignableInstructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as "co_instructor" | "assistant")}
            disabled={saving}
            className="rounded-lg border bg-background px-3 py-2"
            aria-label="دور المدرب"
          >
            <option value="co_instructor">مدرب مشارك</option>
            <option value="assistant">مساعد</option>
          </select>
          <button
            type="button"
            disabled={saving || !selectedInstructor}
            onClick={() => void addInstructor()}
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "جارٍ الحفظ..." : "إسناد المدرب"}
          </button>
        </div>
      </div>
    </AppSection>
  );
}

export function CourseInstructorAssignments(props: CourseInstructorAssignmentsProps) {
  return (
    <PermissionGuard permission="courses.assign_instructors">
      <CourseInstructorAssignmentsContent {...props} />
    </PermissionGuard>
  );
}
