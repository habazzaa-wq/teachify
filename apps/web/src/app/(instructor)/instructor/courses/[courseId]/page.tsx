"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CourseStudio } from "@/features/course-studio";
import { useCourse, usePublishCourse } from "@/features/courses/hooks";
import { useInstructorAuth } from "@/features/instructors/InstructorAuthProvider";

export default function InstructorCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? null;
  const { accessToken } = useInstructorAuth();
  const { data: course, isLoading } = useCourse(courseId, accessToken);
  const publishCourse = usePublishCourse(accessToken);

  const handlePublish = useCallback(() => {
    if (!course) return;
    publishCourse.mutate(course.id, {
      onSuccess: () => toast.success(`تم نشر "${course.title}" بنجاح`),
      onError: () => toast.error("فشل نشر الدورة"),
    });
  }, [course, publishCourse]);

  if (isLoading || !accessToken) {
    return <main className="mx-auto max-w-4xl px-5 py-10">جارٍ تحميل الدورة...</main>;
  }

  if (!course) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p role="alert" className="text-destructive">
          الدورة غير متاحة أو غير معيّنة لك.
        </p>
        <Link className="mt-4 inline-block underline" href="/instructor/courses">
          العودة للدورات
        </Link>
      </main>
    );
  }

  return (
    <div className="h-[calc(100dvh-13rem)] min-h-[30rem] md:h-[calc(100dvh-11rem)] md:min-h-0">
      <CourseStudio
        mode="ready"
        instructorMode
        courseId={course.id}
        courseName={course.title}
        courseStatus={course.status}
        courseVisibility={course.visibility}
        studentsCount={course.studentsCount}
        isSaved
        breadcrumbItems={[
          { label: "الدورات", href: "/instructor/courses" },
          { label: course.title },
        ]}
        onPublish={course.status !== "published" ? handlePublish : undefined}
      />
    </div>
  );
}
