"use client";

import { useMemo } from "react";
import { AppDrawer, Skeleton } from "@/components/ui";
import { useCourse } from "../hooks";
import type { CreateCoursePayload } from "../types";
import { CourseFormPanel } from "./CourseFormPanel";

interface CourseEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | null;
  onSave?: (id: string, data: CreateCoursePayload) => void;
  saving?: boolean;
}

function CourseEditDrawer({
  open,
  onOpenChange,
  courseId,
  onSave,
  saving,
}: CourseEditDrawerProps) {
  const { data: course, isLoading } = useCourse(courseId);

  const initialValues = useMemo<CreateCoursePayload | null>(() => {
    if (!course) return null;
    return {
      title: course.title,
      subtitle: course.subtitle ?? "",
      shortDescription: course.shortDescription ?? "",
      description: course.description ?? "",
      fullDescription: course.fullDescription ?? "",
      thumbnailPath: course.thumbnail,
      visibility: course.visibility,
      difficulty: course.difficulty,
      language: course.language,
      pricingType: course.pricingType,
      price: course.price,
      currency: course.currency,
      tagIds: course.tags.map((t) => Number(t.id)),
      requirements: course.requirements,
      learningOutcomes: course.learningOutcomes,
      targetAudience: course.targetAudience,
    };
  }, [course]);

  if (isLoading) {
    return (
      <AppDrawer open={open} onOpenChange={onOpenChange} side="end" className="w-full sm:max-w-[440px] lg:max-w-[480px]">
        <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
          <header className="flex items-center justify-between border-b px-6 py-4 shrink-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </header>
          <div className="flex-1 p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </AppDrawer>
    );
  }

  return (
    <CourseFormPanel
      open={open}
      onOpenChange={onOpenChange}
      title="تعديل الدورة"
      formKey={courseId ?? "edit"}
      initialValues={initialValues}
      onSave={onSave ? (data) => onSave(courseId as string, data) : undefined}
      saving={saving}
    />
  );
}

export { CourseEditDrawer };
