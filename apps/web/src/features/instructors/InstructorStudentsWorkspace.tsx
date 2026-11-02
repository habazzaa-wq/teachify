"use client";

import { useCallback, useEffect, useState } from "react";
import { StudentMetricCards } from "@/features/students/components/StudentMetricCards";
import { StudentTable } from "@/features/students/components/StudentTable";
import { StudentToolbar } from "@/features/students/components/StudentToolbar";
import type { Student, StudentStatus } from "@/features/students/types";
import { instructorApi, instructorApiErrorMessage } from "./api";
import { useInstructorAuth } from "./InstructorAuthProvider";
import type { InstructorStudentMetrics } from "./api";

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
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void instructorApi.studentMetrics(accessToken).then(({ data }) => {
      if (!cancelled) setMetrics(data);
    }).catch((cause: unknown) => {
      if (!cancelled) setError(instructorApiErrorMessage(cause));
    });
    return () => { cancelled = true; };
  }, [accessToken, refreshKey]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError("");
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
      if (!cancelled) setError(instructorApiErrorMessage(cause));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [accessToken, page, refreshKey, search, sort, status]);

  const resetPageAnd = <T,>(setter: (value: T) => void, value: T) => {
    setPage(1);
    setter(value);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">مساحة المدرّب</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">طلاب دوراتك</h1>
          <p className="mt-2 text-sm text-muted-foreground">بيانات الطلاب المسجلين في الدورات التي تدرّسها، بما فيها الدورات المشتركة.</p>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <StudentMetricCards data={metrics} loading={!metrics} />
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
        {loading ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">جارٍ تحميل الطلاب...</div>
        ) : students.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
            {search ? "لا توجد نتائج مطابقة لبحثك." : "لا يوجد طلاب مسجلون في دوراتك حتى الآن."}
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
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{total} طالب</span>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-lg border px-3 py-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>السابق</button>
                <span>صفحة {page} من {lastPage}</span>
                <button type="button" className="rounded-lg border px-3 py-1.5 disabled:opacity-40" disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>التالي</button>
              </div>
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
              <div><dt className="text-muted-foreground">الهاتف</dt><dd className="mt-1">{selectedStudent.phone || "—"}</dd></div>
              <div><dt className="text-muted-foreground">حالة الحساب</dt><dd className="mt-1">{selectedStudent.status}</dd></div>
              <div><dt className="text-muted-foreground">دوراتك المسجل بها</dt><dd className="mt-1">{selectedStudent.enrolledCoursesCount}</dd></div>
              <div><dt className="text-muted-foreground">دورات مكتملة</dt><dd className="mt-1">{selectedStudent.completedCoursesCount}</dd></div>
              <div><dt className="text-muted-foreground">آخر نشاط</dt><dd className="mt-1">{selectedStudent.lastActivityAt ? new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(selectedStudent.lastActivityAt)) : "—"}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
