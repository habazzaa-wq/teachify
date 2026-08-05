"use client";

import { CalendarDays, Flame, MapPin, Sparkles, Trophy } from "lucide-react";
import type { StudentDashboardData } from "../types";
import { useBrandTheme } from "./StudentCard";
import {
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  BRAND_TEXT_ON_PRIMARY,
  BRAND_TEXT_ON_SECONDARY,
} from "../constants";
import { formatDate } from "@/lib/format";

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
  const t = useBrandTheme();
  const student = data.student;
  const stats = data.stats;

  return (
    <section
      className="home-enter-up relative overflow-hidden rounded-3xl border p-6 md:p-8"
      style={{
        background: t.isDark
          ? "linear-gradient(160deg, #121418 0%, #16181d 55%, #181a1f 100%)"
          : "linear-gradient(160deg, #fdfbf7 0%, #f7f1e7 55%, #fdfbf7 100%)",
        borderColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(216,123,99,0.14)",
        boxShadow: t.isDark
          ? "0 1px 2px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.2)"
          : "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(216,123,99,0.10)",
      }}
      aria-label="ترحيب الطالب"
    >
      {/* Decorative orbs — one brand color per orb */}
      <div
        className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${BRAND_PRIMARY}30, transparent 70%)` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -start-10 h-56 w-56 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${BRAND_SECONDARY}26, transparent 70%)` }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar with a brand glow ring */}
          <div className="home-enter-pop relative shrink-0" style={{ animationDelay: "0.1s" }}>
            <div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: `radial-gradient(circle, ${BRAND_PRIMARY}45, transparent 70%)` }}
              aria-hidden="true"
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] bg-white/80 text-lg font-bold sm:h-20 sm:w-20"
              style={{
                borderColor: BRAND_PRIMARY,
                color: BRAND_PRIMARY,
                boxShadow: `0 0 24px ${BRAND_PRIMARY}40, 0 8px 20px rgba(0,0,0,0.12)`,
              }}
            >
              {student.avatar ? (
                <img src={student.avatar} alt={student.name} className="h-full w-full object-cover" />
              ) : (
                student.name?.charAt(0) ?? <Sparkles className="h-6 w-6" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="home-enter-up flex flex-wrap items-center gap-2" style={{ animationDelay: "0.2s" }}>
              <span className="text-sm font-medium" style={{ color: t.muted }}>
                {greeting()}،
              </span>
              <h1
                className="truncate text-xl font-extrabold tracking-tight md:text-2xl"
                style={{ color: t.ink }}
              >
                {student.name}
              </h1>
            </div>
            <div
              className="home-enter-up mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
              style={{ color: t.muted, animationDelay: "0.25s" }}
            >
              {student.studyLevel && (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: BRAND_SECONDARY }} aria-hidden="true" />
                  {student.studyLevel}
                </span>
              )}
              {student.governorate && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" style={{ color: BRAND_PRIMARY }} aria-hidden="true" />
                  {student.governorate}
                </span>
              )}
              {student.joinedAt && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" style={{ color: BRAND_SECONDARY }} aria-hidden="true" />
                  انضم منذ {formatDate(student.joinedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badges — each uses exactly one brand color */}
        <div className="home-enter-pop flex flex-wrap items-center gap-2" style={{ animationDelay: "0.35s" }}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold"
            style={{
              backgroundColor: BRAND_SECONDARY,
              color: BRAND_TEXT_ON_SECONDARY,
              boxShadow: `0 4px 14px ${BRAND_SECONDARY}40`,
            }}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            {stats.currentStreakDays} يوم تعلم متتالي
          </span>
          {stats.certificatesCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold"
              style={{
                backgroundColor: BRAND_PRIMARY,
                color: BRAND_TEXT_ON_PRIMARY,
                boxShadow: `0 4px 14px ${BRAND_PRIMARY}40`,
              }}
            >
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              {stats.certificatesCount} شهادة
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
