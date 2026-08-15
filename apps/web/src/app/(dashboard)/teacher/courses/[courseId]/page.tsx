"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CourseStudio } from "@/features/course-studio";
import { useCourse, usePublishCourse } from "@/features/courses/hooks";

function CourseWorkspacePage() {
  const params = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(params?.courseId ?? null);
  const publishCourse = usePublishCourse();

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
    return <CourseStudio mode="empty" courseName="غير موجود" />;
  }

  return (
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
  );
}

export default CourseWorkspacePage;
