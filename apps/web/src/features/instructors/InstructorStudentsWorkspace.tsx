"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AppButton, AppPagination } from "@/components/ui";
import { StudentErrorState } from "@/features/students/components/StudentErrorState";
import { StudentLoadingState } from "@/features/students/components/StudentLoadingState";
import { StudentMetricCards } from "@/features/students/components/StudentMetricCards";
import { StudentTable } from "@/features/students/components/StudentTable";
import { StudentToolbar } from "@/features/students/components/StudentToolbar";
import { STUDENT_STATUS_CONFIG } from "@/features/students/constants";
import type { Student, StudentStatus } from "@/features/students/types";
import { instructorApi, instructorApiErrorMessage } from "./api";
import { useInstructorAuth } from "./InstructorAuthProvider";
import type { InstructorStudentMetrics } from "./api";

function csvCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function exportStudentsToCSV(students: Student[]) {
  const headers = ["الاسم", "البريد", "الهاتف", "عدد الكورسات", "المكتملة", "الحالة", "آخر نشاط", "تاريخ الانضمام"];
  const rows = students.map((student) => [
    student.fullName,
    student.email,
    student.phone,
    String(student.enrolledCoursesCount),
    String(student.completedCoursesCount),
    STUDENT_STATUS_CONFIG[student.status].label,
    student.lastActivityAt ? new Date(student.lastActivityAt).toLocaleDateString("ar") : "—",
    new Date(student.createdAt).toLocaleDateString("ar"),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `instructor_students_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function InstructorStudentsWorkspace() {
  const { accessToken } = useInstructorAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [metrics, setMetrics] = useState<InstructorStudentMetrics>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StudentStatus | "all">("all");
  const [sort, setSort] = useState("created_at");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [metricsError, setMetricsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setLoading(true);
    setMetricsLoading(true);
    setListError("");
    setMetricsError("");
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void instructorApi.studentMetrics(accessToken).then(({ data }) => {
      if (!cancelled) setMetrics(data);
    }).catch((cause: unknown) => {
      if (!cancelled) setMetricsError(instructorApiErrorMessage(cause));
    }).finally(() => {
      if (!cancelled) setMetricsLoading(false);
    });
    return () => { cancelled = true; };
  }, [accessToken, refreshKey]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void instructorApi.listStudentsAdminView(accessToken, {
      search,
      status,
      sort,
      sort_dir: "desc",
      page,
      per_page: 25,
    }).then((response) => {
      if (cancelled) return;
      setStudents(response.data);
      setTotal(response.total);
      setLastPage(response.last_page);
    }).catch((cause: unknown) => {
      if (!cancelled) setListError(instructorApiErrorMessage(cause));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [accessToken, page, refreshKey, search, sort, status]);

  const hasFilters = search !== "" || status !== "all" || sort !== "created_at";

  const resetPageAnd = <T,>(setter: (value: T) => void, value: T) => {
    setLoading(true);
    setListError("");
    setPage(1);
    setter(value);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">مساحة المدرّب</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">إدارة الطلاب</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            الطلاب المسجلون في الدورات المعيّنة لك فقط. يمكنك عرض بياناتهم وتصدير النتائج دون تغيير حساباتهم.
          </p>
        </div>
        <AppButton
          variant="outline"
          size="sm"
          onClick={() => exportStudentsToCSV(students)}
          disabled={loading || students.length === 0}
        >
          <Download className="h-4 w-4" />
          تصدير النتائج
        </AppButton>
      </header>

      {metricsError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          تعذر تحميل مؤشرات الطلاب: {metricsError}
        </p>
      )}
      <StudentMetricCards data={metrics} loading={metricsLoading} />
      <section className="space-y-4 rounded-2xl border border-studio-border bg-studio-panel p-4 md:p-5">
        <StudentToolbar
          search={search}
          onSearchChange={(value) => resetPageAnd(setSearch, value)}
          statusFilter={status}
          onStatusChange={(value) => resetPageAnd(setStatus, value)}
          sort={sort}
          onSortChange={(value) => resetPageAnd(setSort, value)}
          onRefresh={refresh}
          refreshing={loading}
        />
        {listError ? (
          <StudentErrorState onRetry={refresh} />
        ) : loading ? (
          <StudentLoadingState />
        ) : students.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              {hasFilters ? "لا توجد نتائج مطابقة" : "لا يوجد طلاب مسجلون في دوراتك حتى الآن"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasFilters
                ? "جرّب تغيير البحث أو عوامل التصفية."
                : "سيظهر هنا الطلاب المسجلون في الدورات المعيّنة لك."}
            </p>
          </div>
        ) : (
          <>
            <StudentTable
              students={students}
              selectedIds={new Set()}
              onSelectToggle={() => undefined}
              onSelectAll={() => undefined}
              onView={setSelectedStudent}
              readOnly
            />
            <div className="flex justify-center">
              <AppPagination
                currentPage={page}
                lastPage={lastPage}
                total={total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </section>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => setSelectedStudent(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="instructor-student-title" className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="instructor-student-title" className="text-lg font-bold">{selectedStudent.fullName}</h2>
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{selectedStudent.email}</p>
              </div>
              <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setSelectedStudent(null)}>إغلاق</button>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted-foreground">الهاتف</dt><dd className="mt-1" dir="ltr">{selectedStudent.phone || "—"}</dd></div>
              <div><dt className="text-muted-foreground">هاتف ولي الأمر</dt><dd className="mt-1" dir="ltr">{selectedStudent.parentPhone || "—"}</dd></div>
              <div><dt className="text-muted-foreground">حالة الحساب</dt><dd className="mt-1">{STUDENT_STATUS_CONFIG[selectedStudent.status].label}</dd></div>
              <div><dt className="text-muted-foreground">النوع</dt><dd className="mt-1">{selectedStudent.gender || "—"}</dd></div>
              <div><dt className="text-muted-foreground">المرحلة الدراسية</dt><dd className="mt-1">{selectedStudent.studyLevel || "—"}</dd></div>
              <div><dt className="text-muted-foreground">المحافظة / المدينة</dt><dd className="mt-1">{[selectedStudent.governorate, selectedStudent.city].filter(Boolean).join("، ") || "—"}</dd></div>
              <div><dt className="text-muted-foreground">دوراتك المسجل بها</dt><dd className="mt-1">{selectedStudent.enrolledCoursesCount}</dd></div>
              <div><dt className="text-muted-foreground">دورات مكتملة</dt><dd className="mt-1">{selectedStudent.completedCoursesCount}</dd></div>
              <div><dt className="text-muted-foreground">آخر دخول</dt><dd className="mt-1">{selectedStudent.lastLoginAt ? new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(selectedStudent.lastLoginAt)) : "—"}</dd></div>
              <div><dt className="text-muted-foreground">آخر نشاط</dt><dd className="mt-1">{selectedStudent.lastActivityAt ? new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(selectedStudent.lastActivityAt)) : "—"}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
