"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, TrendingUp, Search } from "lucide-react";
import { AppSearchInput, AppEmptyState, AppErrorState, AppLoadingState, AppPagination, AppBadge, AppAvatar, AppAvatarImage, AppAvatarFallback, AppProgress } from "@/components/ui";
import { useEnrollments } from "@/features/enrollments/hooks";
import { ENROLLMENT_STATUS_CONFIG } from "@/features/enrollments/constants";
import { formatDate } from "@/lib/format";
import { initialsOf } from "@/lib/format";

interface WorkspaceStudentsProps {
  courseId: string;
}

function WorkspaceStudents({ courseId }: WorkspaceStudentsProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      course_id: courseId,
      search: search || undefined,
      page,
      per_page: 10,
    }),
    [courseId, search, page],
  );

  const { data, isLoading, isError, refetch } = useEnrollments(filters);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  const enrollments = data?.data ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.currentPage ?? 1;
  const lastPage = data?.lastPage ?? 1;

  const stats = useMemo(() => {
    const active = enrollments.filter((e) => e.status === "active").length;
    const completed = enrollments.filter((e) => e.status === "completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { active, completed, completionRate };
  }, [enrollments, total]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary/60" />
            </div>
          </div>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">إجمالي الطلاب</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-emerald-500/70" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">الطلاب النشطون</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-500/70" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.completionRate}%</p>
          <p className="text-xs text-muted-foreground/70 mt-1">معدل الإكمال</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <AppSearchInput
          value={search}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder="بحث عن طالب..."
          containerClassName="flex-1 max-w-sm"
        />
      </div>

      {isLoading ? (
        <AppLoadingState label="جارٍ تحميل الطلاب..." />
      ) : isError ? (
        <AppErrorState
          title="حدث خطأ"
          description="تعذّر تحميل قائمة الطلاب"
          onRetry={() => refetch()}
        />
      ) : enrollments.length === 0 ? (
        <AppEmptyState
          icon={Users}
          title="لا يوجد طلاب"
          description={search ? "لا توجد نتائج للبحث" : "لم يتم تسجيل أي طالب في هذه الدورة بعد"}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="divide-y">
            {enrollments.map((enrollment) => {
              const statusConfig = ENROLLMENT_STATUS_CONFIG[enrollment.status];
              return (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <AppAvatar className="h-10 w-10 shrink-0">
                    <AppAvatarImage src={enrollment.student.avatar ?? undefined} alt={enrollment.student.name} />
                    <AppAvatarFallback>{initialsOf(enrollment.student.name)}</AppAvatarFallback>
                  </AppAvatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{enrollment.student.name}</p>
                    <p className="text-xs text-muted-foreground/70">{enrollment.student.email}</p>
                  </div>
                  <div className="hidden sm:block w-32">
                    <AppProgress value={enrollment.progress} size="sm" variant={enrollment.progress >= 100 ? "success" : "default"} />
                    <p className="text-xs text-muted-foreground/60 mt-1">{Math.round(enrollment.progress)}%</p>
                  </div>
                  <div className="hidden md:block text-xs text-muted-foreground/70 min-w-[80px]">
                    {enrollment.lastActivityAt ? formatDate(enrollment.lastActivityAt) : "—"}
                  </div>
                  <AppBadge variant={statusConfig.color as any} className="text-[11px] shrink-0">
                    {statusConfig.label}
                  </AppBadge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lastPage > 1 && (
        <AppPagination
          currentPage={currentPage}
          lastPage={lastPage}
          total={total}
          onPageChange={setPage}
        />
      )}
    </motion.div>
  );
}

export { WorkspaceStudents };