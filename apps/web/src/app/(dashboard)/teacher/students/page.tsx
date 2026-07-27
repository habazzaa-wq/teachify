"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { AppPage, AppPageHeader, AppSection, AppDivider, AppButton, AppConfirmDialog } from "@/components/ui";
import { useStudents, useStudentMetrics, useDeleteStudent, useBulkDeleteStudents } from "@/features/students/hooks";
import { StudentMetricCards } from "@/features/students/components/StudentMetricCards";
import { StudentToolbar } from "@/features/students/components/StudentToolbar";
import { StudentTable } from "@/features/students/components/StudentTable";
import { StudentCreateDrawer } from "@/features/students/components/StudentCreateDrawer";
import { StudentEmptyState } from "@/features/students/components/StudentEmptyState";
import { StudentLoadingState } from "@/features/students/components/StudentLoadingState";
import { StudentErrorState } from "@/features/students/components/StudentErrorState";
import type { Student, StudentStatus } from "@/features/students/types";

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const [sort, setSort] = useState("created_at");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "single" | "bulk"; student?: Student }>({ type: "bulk" });

  const params = useMemo(
    () => ({
      search,
      status: statusFilter,
      sort: sort as "created_at" | "last_login_at" | "last_accessed_at",
    }),
    [search, statusFilter, sort],
  );

  const studentsQuery = useStudents(params);
  const metricsQuery = useStudentMetrics();
  const deleteStudent = useDeleteStudent();
  const bulkDeleteStudents = useBulkDeleteStudents();

  const students = studentsQuery.data?.data ?? [];
  const isLoading = studentsQuery.isLoading || metricsQuery.isLoading;
  const isError = studentsQuery.isError;

  const hasFilters = search !== "" || statusFilter !== "all";

  const handleViewStudent = useCallback(
    (student: Student) => {
      router.push(`/teacher/students/${student.id}`);
    },
    [router],
  );

  const handleActivate = useCallback(() => {
    // TODO: implement activate mutation
  }, []);

  const handleSuspend = useCallback(() => {
    // TODO: implement suspend mutation
  }, []);

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
      const allIds = new Set(students.map((s) => s.id));
      if (prev.size === students.length) {
        return new Set();
      }
      return allIds;
    });
  }, [students]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSingle = useCallback((student: Student) => {
    setDeleteTarget({ type: "single", student });
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setDeleteTarget({ type: "bulk" });
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget.type === "single" && deleteTarget.student) {
      deleteStudent.mutate(deleteTarget.student.id, {
        onSuccess: () => {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(deleteTarget.student!.id);
            return next;
          });
          setDeleteConfirmOpen(false);
        },
        onError: () => {
          setDeleteConfirmOpen(false);
        },
      });
    } else if (deleteTarget.type === "bulk") {
      const ids = Array.from(selectedIds);
      bulkDeleteStudents.mutate(ids, {
        onSuccess: () => {
          setSelectedIds(new Set());
          setDeleteConfirmOpen(false);
        },
        onError: () => {
          setDeleteConfirmOpen(false);
        },
      });
    }
  }, [deleteTarget, selectedIds, deleteStudent, bulkDeleteStudents]);

  const isDeleting = deleteStudent.isPending || bulkDeleteStudents.isPending;

  const deleteTitle = deleteTarget.type === "single"
    ? `حذف الطالب "${deleteTarget.student?.fullName}"`
    : `حذف ${selectedIds.size} طالب`;

  const deleteDescription = deleteTarget.type === "single"
    ? "هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع بياناته نهائياً ولا يمكن التراجع عن هذا الإجراء."
    : `هل أنت متأكد من حذف ${selectedIds.size} طالب محدد؟ سيتم حذف جميع بياناتهم نهائياً ولا يمكن التراجع عن هذا الإجراء.`;

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title="إدارة الطلاب"
        description="عرض وإدارة جميع الطلاب المسجلين في الأكاديمية"
        actions={
          <AppButton size="sm" onClick={() => setCreateDrawerOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة طالب
          </AppButton>
        }
      />

      <AppDivider className="mb-8" />

      <AppSection>
        <StudentMetricCards
          data={metricsQuery.data}
          loading={metricsQuery.isLoading}
        />
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
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                sort={sort}
                onSortChange={setSort}
                onRefresh={() => studentsQuery.refetch()}
                refreshing={studentsQuery.isRefetching}
              />
            </div>

            {selectedIds.size > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border bg-primary/5 px-4 py-3">
                <span className="text-sm font-medium">
                  تم تحديد <span className="text-primary">{selectedIds.size}</span> طالب
                </span>
                <div className="mr-auto flex items-center gap-2">
                  <AppButton
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    loading={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف المحدد
                  </AppButton>
                  <AppButton size="sm" variant="ghost" onClick={handleClearSelection}>
                    إلغاء التحديد
                  </AppButton>
                </div>
              </div>
            )}

            {students.length === 0 && hasFilters ? (
              <StudentEmptyState hasFilters={true} />
            ) : (
              <>
                <StudentTable
                  students={students}
                  selectedIds={selectedIds}
                  onSelectToggle={handleSelectToggle}
                  onSelectAll={handleSelectAll}
                  onView={handleViewStudent}
                  onActivate={handleActivate}
                  onSuspend={handleSuspend}
                  onDelete={handleDeleteSingle}
                />
                <p className="mt-3 text-xs text-center text-muted-foreground/60">
                  إجمالي {studentsQuery.data?.total ?? students.length} طالب
                </p>
              </>
            )}
          </>
        )}
      </AppSection>

      <StudentCreateDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
      />

      <AppConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel="حذف"
        destructive
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </AppPage>
  );
}
