"use client";

import { useParams } from "next/navigation";
import { CourseStudio } from "@/features/course-studio";
import { useCourse } from "@/features/courses/hooks";

function CourseWorkspacePage() {
  const params = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(params?.courseId ?? null);

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
    />
  );
}

export default CourseWorkspacePage;
