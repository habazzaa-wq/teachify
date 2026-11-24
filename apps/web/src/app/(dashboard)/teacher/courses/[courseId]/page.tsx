"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-background px-3 pt-2 sm:px-4 md:pt-3">
        <div className="flex gap-2 overflow-x-auto studio-scrollbar" role="tablist" aria-label="أقسام الدورة">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            role="tab"
            aria-selected={activeTab === "content"}
            className={`shrink-0 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "content" ? "border border-b-0 bg-muted/40 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            المحتوى
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            role="tab"
            aria-selected={activeTab === "sessions"}
            className={`shrink-0 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "sessions" ? "border border-b-0 bg-muted/40 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            الجلسات
            {hasSessions && <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">مفعّل</span>}
          </button>
        </div>
      </div>

      {activeTab === "content" ? (
        <>
          {/* ارتفاع ثابت نسبيًا للشاشة عشان لوحة العمل تفضل قابلة للتحكم
              والتمرير جوهها، وباقي الأقسام تفضل متاحة بالتمرير تحت. */}
          <div className="h-[calc(100dvh-11rem)] min-h-[30rem] md:h-[calc(100dvh-12rem)] md:min-h-0">
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
        <div className="flex-1 overflow-auto">
          <div className="px-4 pb-8">
            <CourseSessionsPanel courseId={course.id} />
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseWorkspacePage;
