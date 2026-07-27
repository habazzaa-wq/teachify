"use client";

import { useState } from "react";
import {
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
  Plus,
  BookOpen,
  Award,
  TrendingUp,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AppBadge,
  AppAvatar,
  AppAvatarFallback,
  AppDropdownMenu,
  AppDropdownMenuTrigger,
  AppDropdownMenuContent,
  AppDropdownMenuItem,
  AppProgress,
  AppButton,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useStudentEnrollments } from "@/features/students/hooks";
import { ENROLLMENT_STATUS_CONFIG } from "@/features/students/constants";
import type { StudentEnrollment } from "@/features/students/types";
import { EnrollStudentDialog } from "./EnrollStudentDialog";

interface StudentCoursesTabProps {
  studentId: string;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function EnrollmentCard({ enrollment }: { enrollment: StudentEnrollment }) {
  const router = useRouter();
  const statusConfig = ENROLLMENT_STATUS_CONFIG[enrollment.status];

  const getProgressVariant = () => {
    if (enrollment.completionPercent >= 100) return "success";
    if (enrollment.completionPercent >= 50) return "default";
    if (enrollment.completionPercent > 0) return "warning";
    return "default";
  };

  return (
    <div className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center overflow-hidden">
        {enrollment.courseThumbnail ? (
          <img
            src={enrollment.courseThumbnail}
            alt={enrollment.courseTitle}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <AppBadge
            variant={statusConfig.color as "default" | "secondary" | "destructive" | "success" | "warning" | "outline"}
            className="text-[10px] font-semibold backdrop-blur-sm bg-background/80"
          >
            {statusConfig.label}
          </AppBadge>
        </div>
        <div className="absolute top-3 left-3">
          <AppDropdownMenu>
            <AppDropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground/60 transition-colors hover:bg-background hover:text-foreground opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </AppDropdownMenuTrigger>
            <AppDropdownMenuContent align="end" className="w-44">
              {enrollment.courseSlug && (
                <AppDropdownMenuItem
                  onClick={() => router.push(`/teacher/courses/${enrollment.courseId}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                  عرض الكورس
                </AppDropdownMenuItem>
              )}
              {enrollment.completionPercent < 100 && (
                <AppDropdownMenuItem onClick={() => router.push(`/teacher/courses/${enrollment.courseId}`)}>
                  <Play className="h-4 w-4" />
                  متابعة التعلم
                </AppDropdownMenuItem>
              )}
            </AppDropdownMenuContent>
          </AppDropdownMenu>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2 line-clamp-2 min-h-[2.5rem]">{enrollment.courseTitle}</h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">
                {enrollment.completedLessonsCount}/{enrollment.totalLessonsCount} درس
              </span>
              <span className="font-semibold tabular-nums">{enrollment.completionPercent}%</span>
            </div>
            <AppProgress
              value={enrollment.completionPercent}
              size="sm"
              variant={getProgressVariant()}
              className="h-2"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(enrollment.enrolledAt)}
            </span>
            {enrollment.completedAt ? (
              <span className="text-xs text-success flex items-center gap-1.5 font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                مكتمل
              </span>
            ) : enrollment.completionPercent > 0 ? (
              <span className="text-xs text-primary flex items-center gap-1.5 font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                جارٍ التعلم
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5" />
                لم يبدأ
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentCoursesTab({ studentId }: StudentCoursesTabProps) {
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const { data: enrollments, isLoading, isError } = useStudentEnrollments(studentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-6 w-12 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
              <div className="h-36 bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-sm font-semibold mb-1">فشل في تحميل الكورسات</h3>
        <p className="text-xs text-muted-foreground">حدث خطأ أثناء تحميل بيانات الكورسات</p>
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-semibold mb-1.5">لا توجد كورسات مسجلة</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          لم يسجل هذا الطالب في أي كورس بعد. أضف كورساً ليبدأ الطالب رحلة التعلم.
        </p>
        <AppButton onClick={() => setEnrollDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          إضافة كورس
        </AppButton>
        <EnrollStudentDialog
          open={enrollDialogOpen}
          onOpenChange={setEnrollDialogOpen}
          studentId={studentId}
          studentTenantUserId={studentId}
        />
      </div>
    );
  }

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const completedEnrollments = enrollments.filter((e) => e.status === "completed");
  const otherEnrollments = enrollments.filter((e) => e.status !== "active" && e.status !== "completed");

  const totalEnrolled = enrollments.length;
  const totalCompleted = completedEnrollments.length;
  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.completionPercent, 0) / enrollments.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <StatCard icon={BookOpen} label="إجمالي الكورسات" value={totalEnrolled} color="bg-primary" />
          <StatCard icon={Award} label="مكتملة" value={totalCompleted} color="bg-success" />
          <StatCard icon={TrendingUp} label="متوسط التقدم" value={`${averageProgress}%`} color="bg-blue-500" />
        </div>
        <div>
          <AppButton className="w-full sm:w-auto" onClick={() => setEnrollDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة كورس
          </AppButton>
        </div>
      </div>

      <EnrollStudentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        studentId={studentId}
        studentTenantUserId={studentId}
      />

      {activeEnrollments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            كورسات نشطة
            <span className="text-xs text-muted-foreground font-normal">({activeEnrollments.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeEnrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}

      {completedEnrollments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            كورسات مكتملة
            <span className="text-xs text-muted-foreground font-normal">({completedEnrollments.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completedEnrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}

      {otherEnrollments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            أخرى
            <span className="text-xs text-muted-foreground font-normal">({otherEnrollments.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherEnrollments.map((enrollment) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { StudentCoursesTab };
