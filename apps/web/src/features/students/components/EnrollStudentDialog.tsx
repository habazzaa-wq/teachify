"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { AppButton, AppSelect, AppSelectContent, AppSelectItem, AppSelectTrigger, AppSelectValue, AppModal } from "@/components/ui";
import { useCourses } from "@/features/courses/hooks";
import { useCreateEnrollment } from "@/features/enrollments/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { STUDENTS_QUERY_KEY } from "@/features/students/constants";

interface EnrollStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentTenantUserId: string;
}

function EnrollStudentDialog({ open, onOpenChange, studentId, studentTenantUserId }: EnrollStudentDialogProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [error, setError] = useState("");

  const qc = useQueryClient();
  const { data: coursesData, isLoading: coursesLoading } = useCourses({ per_page: 100, status: "published" });
  const createEnrollment = useCreateEnrollment();

  const courses = coursesData?.data ?? [];

  const handleEnroll = () => {
    if (!selectedCourseId) {
      setError("يرجى اختيار كورس");
      return;
    }

    setError("");
    createEnrollment.mutate(
      { courseId: selectedCourseId, tenantUserId: studentTenantUserId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY, "enrollments", studentId] });
          setSelectedCourseId("");
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          setError(axiosErr?.response?.data?.message ?? "حدث خطأ أثناء تسجيل الطالب في الكورس");
        },
      },
    );
  };

  const handleClose = () => {
    setSelectedCourseId("");
    setError("");
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={handleClose}
      title="إضافة كورس للطالب"
      description="اختر الكورس الذي تريد إعطاء الطالب صلاحية الوصول إليه"
      footer={
        <div className="flex gap-3">
          <AppButton
            onClick={handleEnroll}
            loading={createEnrollment.isPending}
            disabled={coursesLoading || courses.length === 0}
          >
            <Plus className="h-4 w-4" />
            تسجيل في الكورس
          </AppButton>
          <AppButton variant="outline" onClick={handleClose}>
            إلغاء
          </AppButton>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {coursesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            لا توجد كورسات منشورة متاحة
          </p>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">اختر الكورس</label>
            <AppSelect value={selectedCourseId} onValueChange={(v) => { setSelectedCourseId(v); setError(""); }}>
              <AppSelectTrigger className={error ? "border-destructive" : ""}>
                <AppSelectValue placeholder="اختر كورس..." />
              </AppSelectTrigger>
              <AppSelectContent>
                {courses.map((course) => (
                  <AppSelectItem key={course.id} value={course.id}>
                    {course.title}
                  </AppSelectItem>
                ))}
              </AppSelectContent>
            </AppSelect>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </AppModal>
  );
}

export { EnrollStudentDialog };
