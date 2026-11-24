"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { CourseStudio } from "@/features/course-studio";
import { CourseInstructorAssignments } from "@/features/courses/components/CourseInstructorAssignments";
import { CourseSessionsPanel } from "@/features/course-sessions/components/CourseSessionsPanel";
import { useCourse, usePublishCourse } from "@/features/courses/hooks";

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
    return <CourseStudio mode="loading" />;
  }

  if (!course) {
    return <CourseStudio mode="empty" courseName="دورة غير موجودة" />;
  }

  const hasSessions = course.deliveryMode === "sessions_only" || course.deliveryMode === "recorded_and_sessions" || course.deliveryMode === "blended";

  return (
    <div className="cw3-route flex min-h-0 flex-1 flex-col">
      <div className="cw3-tabs flex shrink-0 items-end gap-1 overflow-x-auto px-2 pt-2 sm:px-4" role="tablist" aria-label="أقسام الدورة">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          role="tab"
          aria-selected={activeTab === "content"}
          className="cw3-tab"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          المحتوى التعليمي
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          role="tab"
          aria-selected={activeTab === "sessions"}
          className="cw3-tab"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          الجلسات
          {hasSessions && (
            <span className="rounded-full bg-studio-accent-soft px-2 py-0.5 text-[10px] font-bold text-studio-accent">
              مفعّل
            </span>
          )}
        </button>
      </div>

      {activeTab === "content" ? (
        <>
          <div className="h-[calc(100dvh-11rem)] min-h-[32rem] border-x border-t border-studio-border bg-studio-surface shadow-sm md:h-[calc(100dvh-12rem)] md:min-h-0">
            <CourseStudio
              mode="ready"
              courseId={course.id}
              courseName={course.title}
              courseStatus={course.status}
              courseVisibility={course.visibility}
              studentsCount={course.studentsCount}
              isSaved
              onPublish={course.status !== "published" ? handlePublish : undefined}
            />
          </div>
          <CourseInstructorAssignments course={course} />
        </>
      ) : (
        <div className="flex-1 rounded-b-2xl border-x border-b border-studio-border bg-studio-surface shadow-sm">
          <div className="p-4 sm:p-6">
            <CourseSessionsPanel courseId={course.id} />
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseWorkspacePage;
