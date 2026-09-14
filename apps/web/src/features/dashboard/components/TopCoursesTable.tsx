"use client";

import {
  Trophy,
  Users,
  BookOpen,
  Wallet,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppTable,
  AppTableHeader,
  AppTableBody,
  AppTableRow,
  AppTableHead,
  AppTableCell,
  AppButton,
  AppProgress,
  AppEmptyState,
} from "@/components/ui";
import type { TopCourseItem } from "../types";
import { formatCurrency, formatNumber } from "@/lib/format";

interface TopCoursesTableProps {
  courses: TopCourseItem[];
}

export function TopCoursesTable({ courses }: TopCoursesTableProps) {
  const maxStudents = Math.max(
    ...courses.map((course) => course.students_period),
    1,
  );

  return (
    <AppCard className="card-elevated h-full">
      <AppCardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <AppCardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-warning" />
            أفضل الدورات أداءً
          </AppCardTitle>
          <AppButton variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link href="/teacher/courses">
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </AppButton>
        </div>
      </AppCardHeader>
      <AppCardContent className="p-0">
        {courses.length === 0 ? (
          <AppEmptyState
            icon={BookOpen}
            title="لا توجد دورات بعد"
            description="أضف دوراتك الأولى لتبدأ رؤية البيانات هنا"
            variant="compact"
          />
        ) : (
          <AppTable>
            <AppTableHeader>
              <AppTableRow className="hover:bg-transparent">
                <AppTableHead className="px-6">الدورة</AppTableHead>
                <AppTableHead className="text-center">طلاب الفترة</AppTableHead>
                <AppTableHead>نسبة الإتمام</AppTableHead>
                <AppTableHead className="text-end">إيرادات الفترة</AppTableHead>
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {courses.map((course, index) => {
                const share =
                  maxStudents > 0
                    ? Math.round((course.students_period / maxStudents) * 100)
                    : 0;

                return (
                  <AppTableRow key={course.id}>
                    <AppTableCell className="px-6">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-medium">
                            {course.title}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {formatNumber(course.students_total)} طالب إجمالًا
                          </p>
                        </div>
                      </div>
                    </AppTableCell>
                    <AppTableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                          {course.students_period}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {share}% من الأفضل
                        </span>
                      </div>
                    </AppTableCell>
                    <AppTableCell>
                      <div className="flex items-center gap-2">
                        <AppProgress
                          value={course.completion_rate}
                          size="sm"
                          variant={
                            course.completion_rate >= 70
                              ? "success"
                              : course.completion_rate >= 40
                                ? "warning"
                                : "default"
                          }
                          className="w-28"
                        />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {course.completion_rate}%
                        </span>
                      </div>
                    </AppTableCell>
                    <AppTableCell className="text-end">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                        <Wallet className="h-3.5 w-3.5 text-success" />
                        {formatCurrency(course.revenue_period)}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        الإجمالي {formatCurrency(course.revenue_total)}
                      </p>
                    </AppTableCell>
                  </AppTableRow>
                );
              })}
            </AppTableBody>
          </AppTable>
        )}
      </AppCardContent>
    </AppCard>
  );
}