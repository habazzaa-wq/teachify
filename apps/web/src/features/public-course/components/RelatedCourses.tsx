"use client";

import { motion } from "framer-motion";
import { Star, Users, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppBadge } from "@/components/ui/AppBadge";
import type { RelatedCourse } from "../types";
import { DIFFICULTY_COLORS } from "../constants";

interface RelatedCoursesProps {
  courses: RelatedCourse[];
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  all_levels: "جميع المستويات",
};

const card = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function RelatedCourses({ courses }: RelatedCoursesProps) {
  if (!courses.length) return null;

  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-6">
        الدورات ذات الصلة
      </h2>

      <div
        dir="rtl"
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin lg:grid lg:grid-cols-3 lg:overflow-x-auto"
      >
        {courses.map((course) => {
          const diffColors = DIFFICULTY_COLORS[course.difficulty] ?? DIFFICULTY_COLORS.beginner!;

          return (
            <motion.a
              key={course.id}
              variants={card}
              href={`/courses/${course.slug}`}
              className={cn(
                "group flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/30 bg-card/40",
                "transition-all duration-300 hover:border-primary/15 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                "lg:w-auto lg:flex-col",
              )}
            >
              <div className="relative aspect-video w-full overflow-hidden">
                {course.coverImage || course.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.coverImage || course.thumbnail!}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <span className="text-sm text-muted-foreground">لا توجد صورة</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <span
                  className={cn(
                    "absolute start-3 top-3 text-[10px] font-bold",
                    diffColors.light,
                    diffColors.dark,
                  )}
                >
                  {DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  {course.title}
                </h3>

                {course.instructor && (
                  <p className="text-xs text-muted-foreground">{course.instructor.name}</p>
                )}

                <div className="mt-auto flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.studentsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.duration ? `${Math.round(course.duration / 60)} س` : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border/30 pt-3">
                  {course.pricingType === "free" ? (
                    <AppBadge variant="success" className="text-[10px]">
                      مجاني
                    </AppBadge>
                  ) : course.discountPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        {course.discountPrice} {course.currency ?? "ر.س"}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        {course.price} {course.currency ?? "ر.س"}
                      </span>
                    </div>
                  ) : course.price ? (
                    <span className="text-sm font-bold text-primary">
                      {course.price} {course.currency ?? "ر.س"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}

                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-muted-foreground">0.0</span>
                  </div>
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
