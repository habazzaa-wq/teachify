"use client";

import { CalendarDays, Flame, MapPin, Sparkles } from "lucide-react";
import type { StudentDashboardData } from "../types";
import { AppAvatar, AppAvatarFallback, AppAvatarImage } from "@/components/ui/AppAvatar";
import { AppBadge } from "@/components/ui/AppBadge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

interface StudentHeroProps {
  data: StudentDashboardData;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "تصبح على خير";
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء الخير";
}

export function StudentHero({ data }: StudentHeroProps) {
  const student = data.student;
  const stats = data.stats;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm md:p-8"
      aria-label="ترحيب الطالب"
    >
      <div className="absolute -end-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-20 -start-10 h-56 w-56 rounded-full bg-warning/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <AppAvatar className="h-16 w-16 border-4 border-background shadow-md">
            {student.avatar ? (
              <AppAvatarImage src={student.avatar} alt={student.name} />
            ) : null}
            <AppAvatarFallback className="bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </AppAvatarFallback>
          </AppAvatar>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{greeting()}،</span>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">{student.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {student.studyLevel && (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.studyLevel}
                </span>
              )}
              {student.governorate && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.governorate}
                </span>
              )}
              {student.joinedAt && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  انضم منذ {formatDate(student.joinedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AppBadge
            variant="warning"
            className={cn(
              "gap-1.5 px-3 py-1 text-xs",
              stats.currentStreakDays > 0 ? "" : "opacity-60",
            )}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            {stats.currentStreakDays} يوم تعلم متتالي
          </AppBadge>
          {stats.certificatesCount > 0 && (
            <AppBadge variant="success" className="gap-1.5 px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {stats.certificatesCount} شهادة
            </AppBadge>
          )}
        </div>
      </div>
    </section>
  );
}
