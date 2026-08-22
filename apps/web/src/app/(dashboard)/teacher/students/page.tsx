"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, Trash2, Ban, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  AppPage,
  AppPageHeader,
  AppSection,
  AppDivider,
  AppButton,
  AppPagination,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppDropdownMenuSeparator,
  AppConfirmDialog,
} from "@/components/ui";
import {
  useStudents,
  useStudentMetrics,
  useDeleteStudent,
  useBulkDeleteStudents,
  useActivateStudent,
  useSuspendStudent,
  useBulkActivateStudents,
  useBulkSuspendStudents,
} from "@/features/students/hooks";
import { StudentMetricCards } from "@/features/students/components/StudentMetricCards";
import { StudentToolbar } from "@/features/students/components/StudentToolbar";
import { StudentTable } from "@/features/students/components/StudentTable";
import { StudentCreateDrawer } from "@/features/students/components/StudentCreateDrawer";
import { StudentEmptyState } from "@/features/students/components/StudentEmptyState";
import { StudentLoadingState } from "@/features/students/components/StudentLoadingState";
import { StudentErrorState } from "@/features/students/components/StudentErrorState";
import type { Student, StudentStatus } from "@/features/students/types";

function exportStudentsToCSV(students: Student[]) {
  const headers = ["الاسم", "البريد", "الهاتف", "عدد الكورسات", "المكتملة", "الحالة", "آخر نشاط", "تاريخ الانضمام"];
  const rows = students.map((s) => [
    s.fullName,
    s.email,
    s.phone,
    String(s.enrolledCoursesCount),
    String(s.completedCoursesCount),
    s.status,
    s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString("ar") : "—",
    new Date(s.createdAt).toLocaleDateString("ar"),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const [sort, setSort] = useState("created_at");
  const [page, setPage] = useState(1);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const params = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter,
      sort: sort as "created_at" | "last_login_at" | "last_accessed_at",
      page,
      per_page: 25,
    }),
    [search, statusFilter, sort, page],
  );

  const studentsQuery = useStudents(params);
  const metricsQuery = useStudentMetrics();
  const deleteStudent = useDeleteStudent();
  const bulkDelete = useBulkDeleteStudents();
  const activateStudent = useActivateStudent();
  const suspendStudent = useSuspendStudent();
  const bulkActivate = useBulkActivateStudents();
  const bulkSuspend = useBulkSuspendStudents();

  const students = useMemo(() => studentsQuery.data?.data ?? [], [studentsQuery.data]);
  const isLoading = studentsQuery.isLoading || metricsQuery.isLoading;
  const isError = studentsQuery.isError;

  const hasFilters = !!search || statusFilter !== "all" || sort !== "created_at";

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: StudentStatus | "all") => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSort(value);
    setPage(1);
  }, []);

  const handleView = useCallback(
    (student: Student) => {
      router.push(`/teacher/students/${student.id}`);
    },
    [router],
  );

  const handleActivate = useCallback(
    (student: Student) => {
      activateStudent.mutate(student.id, {
        onSuccess: () => toast.success(`تم تفعيل الطالب ${student.fullName}`),
        onError: () => toast.error("حدث خطأ أثناء تفعيل الطالب"),
      });
    },
    [activateStudent],
  );

  const handleSuspend = useCallback(
    (student: Student) => {
      suspendStudent.mutate(student.id, {
        onSuccess: () => toast.success(`تم إيقاف الطالب ${student.fullName}`),
        onError: () => toast.error("حدث خطأ أثناء إيقاف الطالب"),
      });
    },
    [suspendStudent],
  );

  const handleDelete = useCallback((student: Student) => {
    setDeleteTarget(student);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteStudent.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`تم حذف الطالب ${deleteTarget.fullName}`);
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
      onError: () => toast.error("حدث خطأ أثناء حذف الطالب"),
    });
  }, [deleteTarget, deleteStudent]);

  const handleBulkAction = useCallback(
    (action: string) => {
      if (selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);
      switch (action) {
        case "delete":
          setBulkDeleteOpen(true);
          return;
        case "suspend":
          bulkSuspend.mutate(ids, {
            onSuccess: () => toast.success(`تم إيقاف ${ids.length} طالب`),
            onError: () => toast.error("حدث خطأ أثناء الإيقاف الجماعي"),
          });
          break;
        case "activate":
          bulkActivate.mutate(ids, {
            onSuccess: () => toast.success(`تم تفعيل ${ids.length} طالب`),
            onError: () => toast.error("حدث خطأ أثناء التفعيل الجماعي"),
          });
          break;
      }
      setSelectedIds(new Set());
    },
    [selectedIds, bulkSuspend, bulkActivate],
  );

  const confirmBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    bulkDelete.mutate(ids, {
      onSuccess: () => {
        toast.success(`تم حذف ${ids.length} طالب`);
        setBulkDeleteOpen(false);
        setSelectedIds(new Set());
      },
      onError: () => toast.error("حدث خطأ أثناء الحذف الجماعي"),
    });
  }, [selectedIds, bulkDelete]);

  const handleSelectToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (students.length > 0 && prev.size === students.length) return new Set();
      return new Set(students.map((s) => s.id));
    });
  }, [students]);

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة الطلاب"
        description="عرض جميع حسابات الطلاب وإدارة الكورسات المفتوحة لكل طالب"
        actions={
          <>
            <AppDropdownMenu>
              <AppDropdownMenuTrigger asChild>
                <AppButton variant="outline" size="sm" disabled={selectedIds.size === 0}>
                  إجراءات جماعية ({selectedIds.size})
                </AppButton>
              </AppDropdownMenuTrigger>
              <AppDropdownMenuContent align="end" className="w-48">
                <AppDropdownMenuItem onClick={() => handleBulkAction("activate")}>
                  <UserCheck className="h-4 w-4" />
                  تفعيل
                </AppDropdownMenuItem>
                <AppDropdownMenuItem onClick={() => handleBulkAction("suspend")}>
                  <Ban className="h-4 w-4" />
                  إيقاف
                </AppDropdownMenuItem>
                <AppDropdownMenuSeparator />
                <AppDropdownMenuItem
                  onClick={() => handleBulkAction("delete")}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف
                </AppDropdownMenuItem>
              </AppDropdownMenuContent>
            </AppDropdownMenu>
            <AppButton variant="outline" size="sm" onClick={() => exportStudentsToCSV(students)}>
              <Download className="h-4 w-4" />
              تصدير
            </AppButton>
            <AppButton size="sm" onClick={() => setCreateDrawerOpen(true)}>
              <Plus className="h-4 w-4" />
              إضافة طالب
            </AppButton>
          </>
        }
      />

      <AppDivider className="mb-8" />

      <AppSection>
        <StudentMetricCards data={metricsQuery.data} loading={metricsQuery.isLoading} />
      </AppSection>

      <AppSection>
        {isError ? (
          <StudentErrorState onRetry={() => studentsQuery.refetch()} />
        ) : isLoading ? (
          <StudentLoadingState />
        ) : students.length === 0 && !hasFilters ? (
          <StudentEmptyState hasFilters={false} onCreate={() => setCreateDrawerOpen(true)} />
        ) : (
          <>
            <div className="mb-4">
              <StudentToolbar
                search={search}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                sort={sort}
                onSortChange={handleSortChange}
                onRefresh={() => studentsQuery.refetch()}
                refreshing={studentsQuery.isRefetching}
              />
            </div>
            {selectedIds.size > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  تم تحديد <span className="font-semibold text-foreground">{selectedIds.size}</span> طالب
                </span>
                <div className="mr-auto flex items-center gap-2">
                  <AppButton
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteOpen(true)}
                    loading={bulkDelete.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف المحددة
                  </AppButton>
                  <AppButton variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                    إلغاء التحديد
                  </AppButton>
                </div>
              </div>
            )}
            {students.length === 0 ? (
              <StudentEmptyState hasFilters onCreate={() => setCreateDrawerOpen(true)} />
            ) : (
              <StudentTable
                students={students}
                selectedIds={selectedIds}
                onSelectToggle={handleSelectToggle}
                onSelectAll={handleSelectAll}
                onView={handleView}
                onActivate={handleActivate}
                onSuspend={handleSuspend}
                onDelete={handleDelete}
              />
            )}
            {students.length > 0 && (
              <div className="mt-4">
                <AppPagination
                  currentPage={studentsQuery.data?.currentPage ?? 1}
                  lastPage={studentsQuery.data?.lastPage ?? 1}
                  total={studentsQuery.data?.total ?? 0}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </AppSection>

      <StudentCreateDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <AppConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف الطالب"
        description={
          deleteTarget ? `هل أنت متأكد من حذف الطالب "${deleteTarget.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.` : ""
        }
        confirmLabel="حذف"
        destructive
        loading={deleteStudent.isPending}
        onConfirm={confirmDelete}
      />

      <AppConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="حذف الطلاب المحددين"
        description={`هل أنت متأكد من حذف ${selectedIds.size} طالب؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        destructive
        loading={bulkDelete.isPending}
        onConfirm={confirmBulkDelete}
      />
    </AppPage>
  );
}

export default StudentsPage;
