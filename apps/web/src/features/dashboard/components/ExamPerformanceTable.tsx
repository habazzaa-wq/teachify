"use client";

import { ClipboardList, ArrowLeft, Target, Star } from "lucide-react";
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
import type { ExamPerformanceItem } from "../types";
import { formatDate, formatNumber } from "@/lib/format";

interface ExamPerformanceTableProps {
  exams: ExamPerformanceItem[];
}

export function ExamPerformanceTable({ exams }: ExamPerformanceTableProps) {
  return (
    <AppCard className="card-elevated h-full">
      <AppCardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <AppCardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-warning" />
            أداء الامتحانات التفصيلي
          </AppCardTitle>
          <AppButton variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link href="/teacher/exams">
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </AppButton>
        </div>
      </AppCardHeader>
      <AppCardContent className="p-0">
        {exams.length === 0 ? (
          <AppEmptyState
            icon={ClipboardList}
            title="لا توجد محاولات بعد"
            description="ستظهر هنا إحصاءات امتحاناتك بمجرد شروع الطلاب في المحاولة"
            variant="compact"
          />
        ) : (
          <AppTable>
            <AppTableHeader>
              <AppTableRow className="hover:bg-transparent">
                <AppTableHead className="px-6">الامتحان</AppTableHead>
                <AppTableHead className="text-center">محاولات الفترة</AppTableHead>
                <AppTableHead>نسبة النجاح</AppTableHead>
                <AppTableHead className="text-center">متوسط الدرجة</AppTableHead>
                <AppTableHead className="text-end px-6">آخر محاولة</AppTableHead>
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {exams.map((exam) => (
                <AppTableRow key={exam.exam_id}>
                  <AppTableCell className="px-6">
                    <p className="max-w-[220px] truncate text-sm font-medium">
                      {exam.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      إجمالي المحاولات: {formatNumber(exam.attempts_total)}
                    </p>
                  </AppTableCell>
                  <AppTableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      {exam.attempts_period}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      نجح منها {exam.passed_period}
                    </p>
                  </AppTableCell>
                  <AppTableCell>
                    <div className="flex items-center gap-2">
                      <AppProgress
                        value={exam.pass_rate_period}
                        size="sm"
                        variant={
                          exam.pass_rate_period >= 70
                            ? "success"
                            : exam.pass_rate_period >= 40
                              ? "warning"
                              : "destructive"
                        }
                        className="w-24"
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {exam.pass_rate_period}%
                      </span>
                    </div>
                  </AppTableCell>
                  <AppTableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium">
                      <Star className="h-3.5 w-3.5 text-warning" />
                      {exam.avg_score_period}%
                    </span>
                  </AppTableCell>
                  <AppTableCell className="px-6 text-end text-xs text-muted-foreground">
                    {exam.last_attempted_at
                      ? formatDate(exam.last_attempted_at)
                      : "—"}
                  </AppTableCell>
                </AppTableRow>
              ))}
            </AppTableBody>
          </AppTable>
        )}
      </AppCardContent>
    </AppCard>
  );
}