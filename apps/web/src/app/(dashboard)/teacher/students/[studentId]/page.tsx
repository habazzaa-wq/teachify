"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppSection,
  AppDivider,
  AppButton,
  AppTabs,
  AppTabsList,
  AppTabsTrigger,
  AppAvatar,
  AppAvatarFallback,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/lib/format";
import { useStudent } from "@/features/students/hooks";
import { StudentCoursesTab } from "@/features/students/components/StudentCoursesTab";
import { StudentReportTab } from "@/features/students/components/StudentReportTab";
import { StudentFinancialTab } from "@/features/students/components/StudentFinancialTab";
import { STUDENT_STATUS_CONFIG } from "@/features/students/constants";

const TABS = [
  { value: "courses", label: "الكورسات" },
  { value: "report", label: "التقرير الشامل" },
  { value: "financial", label: "الحساب المالي" },
];

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("courses");

  const { data: student, isLoading, isError } = useStudent(params?.studentId ?? null);

  const handleBack = useCallback(() => {
    router.push("/teacher/students");
  }, [router]);

  if (isLoading) {
    return (
      <AppPage maxWidth="xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppPage>
    );
  }

  if (isError || !student) {
    return (
      <AppPage maxWidth="xl">
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold mb-2">الطالب غير موجود</h2>
          <p className="text-sm text-muted-foreground mb-4">
            لم يتم العثور على بيانات هذا الطالب.
          </p>
          <AppButton variant="outline" onClick={handleBack}>
            <ArrowRight className="h-4 w-4" />
            العودة للقائمة
          </AppButton>
        </div>
      </AppPage>
    );
  }

  const statusConfig = STUDENT_STATUS_CONFIG[student.status];

  return (
    <AppPage maxWidth="xl">
      <AppPageHeader
        title=""
        description=""
        actions={
          <AppButton variant="outline" size="sm" onClick={handleBack}>
            <ArrowRight className="h-4 w-4" />
            العودة
          </AppButton>
        }
      />

      <div className="flex items-start gap-6 mb-8">
        <AppAvatar className="h-20 w-20 shrink-0">
          <AppAvatarFallback className="text-2xl">{initialsOf(student.fullName)}</AppAvatarFallback>
        </AppAvatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{student.fullName}</h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                student.status === "active" && "bg-success/10 text-success",
                student.status === "inactive" && "bg-muted text-muted-foreground",
                student.status === "suspended" && "bg-destructive/10 text-destructive",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  student.status === "active" && "bg-success",
                  student.status === "inactive" && "bg-muted-foreground",
                  student.status === "suspended" && "bg-destructive",
                )}
              />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3" dir="ltr">{student.email}</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {student.phone && <span dir="ltr">{student.phone}</span>}
            <span>
              <span className="font-medium text-foreground">{student.enrolledCoursesCount}</span> كورس
            </span>
            <span>
              <span className="font-medium text-foreground">{student.completedCoursesCount}</span> مكتمل
            </span>
            {student.averageProgress > 0 && (
              <span>
                متوسط التقدم: <span className="font-medium text-foreground">{student.averageProgress}%</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <AppDivider className="mb-6" />

      <div className="shrink-0 border-b mb-6">
        <AppTabs value={activeTab} onValueChange={setActiveTab}>
          <AppTabsList className="flex h-auto gap-0 bg-transparent p-0 w-full border-0">
            {TABS.map((tab) => (
              <AppTabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                  "bg-transparent shadow-none rounded-none",
                  "hover:text-foreground",
                  "data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  "data-[state=inactive]:text-muted-foreground",
                  "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:transition-all after:duration-200",
                  "data-[state=active]:after:bg-primary after:scale-x-0 data-[state=active]:after:scale-x-100",
                  "data-[state=inactive]:hover:after:bg-muted-foreground/20 data-[state=inactive]:hover:after:scale-x-100",
                )}
              >
                {tab.label}
              </AppTabsTrigger>
            ))}
          </AppTabsList>
        </AppTabs>
      </div>

      <AppSection>
        {activeTab === "courses" && (
          <StudentCoursesTab studentId={student.id} />
        )}
        {activeTab === "report" && (
          <StudentReportTab studentId={student.id} />
        )}
        {activeTab === "financial" && (
          <StudentFinancialTab />
        )}
      </AppSection>
    </AppPage>
  );
}
