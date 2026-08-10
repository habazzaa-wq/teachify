"use client";

import { Play, Bookmark, Clock, Folder, Users } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { PublicCourse } from "@/features/public-course/types";

interface HeroSectionProps {
  course: PublicCourse;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && mins > 0) return `${hours}.${Math.round(mins / 6)}0`;
  if (hours > 0) return `${hours}`;
  return `${mins}`;
}

function getDifficultyLabel(d: string): string {
  const map: Record<string, string> = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    all_levels: "جميع المستويات",
  };
  return map[d] ?? d;
}

export function HeroSection({ course }: HeroSectionProps) {
  const hours = course.duration ? formatDuration(course.duration) : null;
  const instructorInitial = course.instructor?.name?.charAt(0) ?? "؟";

  return (
    <section className="relative overflow-hidden bg-[var(--course-page-bg)]">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, var(--course-hero-gradient-from) 0%, var(--course-hero-gradient-via) 40%, var(--course-hero-gradient-to) 80%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Right side — Content */}
          <div className="order-2 lg:order-1 space-y-6">
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[var(--course-badge-bg)] px-4 py-1.5 text-xs font-semibold course-accent-text">
                {course.category?.name ?? "دورة احترافية"}
              </span>
              {course.difficulty && (
                <span className="inline-flex items-center rounded-full bg-[var(--course-icon-bg)] px-3 py-1 text-xs font-medium course-text-secondary">
                  {getDifficultyLabel(course.difficulty)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] course-text-primary">
              {course.title}
            </h1>

            {/* Subtitle / short description */}
            {(course.subtitle || course.shortDescription) && (
              <p className="max-w-xl text-base leading-relaxed sm:text-lg course-text-secondary">
                {course.subtitle || course.shortDescription}
              </p>
            )}

            {/* Instructor row */}
            {course.instructor && (
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[var(--course-card-border)]">
                  {course.instructor.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--course-icon-bg)] text-sm font-bold course-accent-text">
                      {instructorInitial}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold course-text-primary">{course.instructor.name}</p>
                  <p className="text-xs course-text-secondary">مدرس الدورة</p>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 course-accent-text" />
                <span className="font-semibold course-text-primary">{formatNumber(course.studentsCount)}</span>
                <span className="course-text-secondary">طالب</span>
              </div>
              {hours && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 course-accent-text" />
                  <span className="course-text-secondary">{hours} ساعة محتوى</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Folder className="h-4 w-4 course-accent-text" />
                <span className="course-text-secondary">{formatNumber(course.lessonsCount)} درس</span>
              </div>
              {course.certificateEnabled && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🎓</span>
                  <span className="course-text-secondary">شهادة إتمام</span>
                </div>
              )}
            </div>
          </div>

          {/* Left side — Video/Image preview */}
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-lg">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-[var(--course-card-border)]">
                {/* Cover image or fallback */}
                {course.coverImage || course.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.coverImage || course.thumbnail!}
                    alt={course.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, var(--course-hero-gradient-from), var(--course-hero-gradient-via))`,
                    }}
                  />
                )}

                {/* Bookmark */}
                <button
                  type="button"
                  className="absolute start-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                  aria-label="حفظ الدورة"
                >
                  <Bookmark className="h-4 w-4" />
                </button>

                {/* React atom fallback icon (only when no image) */}
                {!course.coverImage && !course.thumbnail && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div
                        className="absolute inset-0 -m-12 rounded-full opacity-30 blur-2xl"
                        style={{
                          background: "radial-gradient(circle, var(--course-accent-glow-strong), transparent 70%)",
                        }}
                      />
                      <svg
                        viewBox="0 0 100 100"
                        className="relative h-20 w-20 sm:h-24 sm:w-24"
                        fill="none"
                        stroke="var(--brand-primary)"
                        strokeWidth="1.5"
                      >
                        <circle cx="50" cy="50" r="4" fill="var(--brand-primary)" stroke="none" />
                        <ellipse cx="50" cy="50" rx="30" ry="12" />
                        <ellipse cx="50" cy="50" rx="30" ry="12" transform="rotate(60 50 50)" />
                        <ellipse cx="50" cy="50" rx="30" ry="12" transform="rotate(120 50 50)" />
                        <circle cx="80" cy="50" r="3" fill="var(--brand-primary)" stroke="none" />
                        <circle cx="35" cy="24" r="3" fill="var(--brand-primary)" stroke="none" />
                        <circle cx="35" cy="76" r="3" fill="var(--brand-primary)" stroke="none" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Play button */}
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center z-10"
                  aria-label="تشغيل معاينة"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/30">
                    <Play className="h-7 w-7 fill-white" />
                  </div>
                </button>

                {/* Free badge */}
                {course.pricingType === "free" && (
                  <div className="absolute bottom-4 start-4 z-10">
                    <span className="inline-flex items-center rounded-full bg-[var(--brand-primary)] px-3.5 py-1 text-xs font-bold text-white shadow-lg">
                      مجانية الدورة
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
