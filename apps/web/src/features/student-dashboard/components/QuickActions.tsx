"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import type { StudentDashboardData } from "../types";
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";

interface QuickActionsProps {
  data: StudentDashboardData;
}

export function QuickActions({ data }: QuickActionsProps) {
  const hasContinue = data.continueLearning.length > 0;
  const hasAttempts = data.recentAttempts.length > 0;

  return (
    <AppCard className="h-full">
      <AppCardHeader>
        <AppCardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          إجراءات سريعة
        </AppCardTitle>
      </AppCardHeader>
      <AppCardContent>
        <div className="grid gap-2 sm:grid-cols-3">
          {hasContinue ? (
            <AppButton asChild variant="default" size="sm">
              <Link href={`/courses/${data.continueLearning[0]!.courseSlug}`}>
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                متابعة التعلم
              </Link>
            </AppButton>
          ) : (
            <AppButton asChild variant="default" size="sm">
              <Link href="/courses">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                تصفح الدورات
              </Link>
            </AppButton>
          )}

          {hasAttempts ? (
            <AppButton asChild variant="outline" size="sm">
              <Link href={`/exam-results/${data.recentAttempts[0]!.attemptId}`}>
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                مراجعة آخر اختبار
              </Link>
            </AppButton>
          ) : (
            <AppButton asChild variant="outline" size="sm">
              <Link href="/courses">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                ابدأ التعلم
              </Link>
            </AppButton>
          )}

          <AppButton asChild variant="ghost" size="sm">
            <Link href="/courses">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              اكتشف المزيد
            </Link>
          </AppButton>
        </div>
      </AppCardContent>
    </AppCard>
  );
}
