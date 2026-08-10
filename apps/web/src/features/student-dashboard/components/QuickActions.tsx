"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import type { StudentDashboardData } from "../types";
import { StudentCard, StudentCardHeader } from "./StudentCard";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_TEXT_ON_PRIMARY,
  BRAND_TEXT_ON_SECONDARY,
} from "../constants";

interface QuickActionsProps {
  data: StudentDashboardData;
}

const buttonBase =
  "inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg";

export function QuickActions({ data }: QuickActionsProps) {
  const hasContinue = data.continueLearning.length > 0;
  const hasAttempts = data.recentAttempts.length > 0;

  return (
    <StudentCard className="h-full">
      <StudentCardHeader
        icon={Sparkles}
        title="إجراءات سريعة"
        subtitle="متابعة أسرع لرحلتك"
        accent={BRAND_SECONDARY}
      />
      <div className="p-5 sm:p-6">
        <div className="grid gap-2.5 sm:grid-cols-3">
          <Link
            href={hasContinue ? `/courses/${data.continueLearning[0]!.courseSlug}` : "/courses"}
            className={buttonBase}
            style={{
              backgroundColor: BRAND_PRIMARY,
              color: BRAND_TEXT_ON_PRIMARY,
              boxShadow: `0 8px 20px rgb(var(--brand-primary-rgb) / 0.2)`,
            }}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {hasContinue ? "متابعة التعلم" : "تصفح الدورات"}
          </Link>

          <Link
            href={hasAttempts ? `/exam-results/${data.recentAttempts[0]!.attemptId}` : "/courses"}
            className={buttonBase}
            style={{
              backgroundColor: BRAND_SECONDARY,
              color: BRAND_TEXT_ON_SECONDARY,
              boxShadow: `0 8px 20px rgb(var(--brand-secondary-rgb) / 0.2)`,
            }}
          >
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            {hasAttempts ? "مراجعة آخر اختبار" : "ابدأ التعلم"}
          </Link>

          <Link
            href="/courses"
            className={buttonBase}
            style={{
              border: `1.5px solid var(--brand-primary)`,
              color: BRAND_PRIMARY,
              backgroundColor: "transparent",
            }}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            اكتشف المزيد
          </Link>
        </div>
      </div>
    </StudentCard>
  );
}
