"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  Layers,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { CourseStudio } from "@/features/course-studio";
import { CourseInstructorAssignments } from "@/features/courses/components/CourseInstructorAssignments";
import { CourseSessionsPanel } from "@/features/course-sessions/components/CourseSessionsPanel";
import { useCourse, usePublishCourse } from "@/features/courses/hooks";
import { cn } from "@/lib/cn";

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  review: "قيد المراجعة",
  published: "منشورة",
  scheduled: "مجدولة",
  archived: "مؤرشفة",
};

function CourseWorkspacePage() {
  const params = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(params?.courseId ?? null);
  const publishCourse = usePublishCourse();
  const [activeTab, setActiveTab] = useState<"content" | "sessions">("content");

  const handlePublish = useCallback(() => {
    if (!course) return;
    publishCourse.mutate(course.id, {
      onSuccess: () => toast.success(`تم نشر "${course.title}" بنجاح`),
      onError: () => toast.error("فشل نشر الدورة"),
    });
  }, [course, publishCourse]);

  if (isLoading) {
    return (
      <div className="course-workspace-v2">
        <CourseStudio mode="loading" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-workspace-v2">
        <CourseStudio mode="empty" courseName="دورة غير موجودة" />
      </div>
    );
  }

  const hasSessions = course.deliveryMode === "sessions_only" || course.deliveryMode === "recorded_and_sessions" || course.deliveryMode === "blended";

  return (
    <div className="course-workspace-v2 flex min-h-0 flex-1 flex-col gap-3">
      <section className="cw-topbar" aria-label="معلومات الدورة">
        <div className="cw-topbar-main">
          <Link href="/teacher/courses" className="cw-back" aria-label="العودة إلى الدورات">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <div className="cw-kicker">
              <span className="cw-live-dot" aria-hidden="true" />
              مساحة عمل الدورة
            </div>
            <h1 className="cw-title" title={course.title}>{course.title}</h1>
            <p className="cw-subline">
              {course.subtitle || "نظّم المنهج، أضف المحتوى، وتابع جاهزية الدورة للنشر."}
            </p>
          </div>
        </div>

        <div className="cw-stats" aria-label="ملخص الدورة">
          <span className="cw-stat"><Layers className="h-3.5 w-3.5" aria-hidden="true" />{course.sectionsCount} قسم</span>
          <span className="cw-stat"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{course.lessonsCount} وحدة</span>
          <span className="cw-stat"><Users className="h-3.5 w-3.5" aria-hidden="true" />{course.studentsCount} طالب</span>
          <span className="cw-stat cw-stat-status"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{statusLabels[course.status] ?? course.status}</span>
        </div>

        <div className="cw-tabs" role="tablist" aria-label="أقسام الدورة">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            role="tab"
            aria-selected={activeTab === "content"}
            className={cn("cw-tab", activeTab === "content" && "is-active")}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            المحتوى التعليمي
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            role="tab"
            aria-selected={activeTab === "sessions"}
            className={cn("cw-tab", activeTab === "sessions" && "is-active")}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            الجلسات
            {hasSessions && <span className="cw-tab-badge">مفعّل</span>}
          </button>
        </div>
      </section>

      {activeTab === "content" ? (
        <>
          <div className="cw-stage">
            <CourseStudio
              mode="ready"
              courseId={course.id}
              courseName={course.title}
              courseStatus={course.status}
              courseVisibility={course.visibility}
              studentsCount={course.studentsCount}
              lastEdited={new Date(course.updatedAt).toLocaleDateString("ar-SA")}
              isSaved
              onPublish={course.status !== "published" ? handlePublish : undefined}
            />
          </div>
          <CourseInstructorAssignments course={course} />
        </>
      ) : (
        <section className="cw-panel">
          <div className="p-4 sm:p-6">
            <CourseSessionsPanel courseId={course.id} />
          </div>
        </section>
      )}
    </div>
  );
}

export default CourseWorkspacePage;
