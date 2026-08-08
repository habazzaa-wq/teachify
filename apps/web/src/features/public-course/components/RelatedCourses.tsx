"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Users, Clock, GraduationCap } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { SectionHeader } from "./primitives";
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "../brand";
import type { RelatedCourse } from "../types";

interface RelatedCoursesProps {
  courses: RelatedCourse[];
}

function RelatedCourseCard({ course }: { course: RelatedCourse }) {
  const coverSrc = course.coverImage || course.thumbnail;
  const isFree = course.pricingType === "free";
  const hasDiscount =
    !isFree &&
    course.discountPrice != null &&
    course.price != null &&
    course.discountPrice < course.price;
  const displayPrice = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);
  const originalPrice = course.price ?? 0;
  const currency = course.currency;
  const diffColor = DIFFICULTY_COLORS[course.difficulty] ?? DIFFICULTY_COLORS.beginner!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-72 shrink-0 lg:w-auto"
    >
      <Link
        href={`/courses/${course.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-[#BF6D58]/30 hover:shadow-lg hover:shadow-[#BF6D58]/10"
      >
        {/* Cover */}
        <div className="relative aspect-video w-full overflow-hidden">
          {coverSrc && coverSrc.startsWith("https") ? (
            <Image
              src={coverSrc}
              alt={course.title}
              fill
              sizes="(max-width: 1024px) 288px, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(191,109,88,0.25), rgba(255,181,14,0.12))" }}
            >
              <GraduationCap className="h-10 w-10 text-[#BF6D58]/60" />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.35))" }}
          />
          <span
            className="absolute start-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white shadow-md"
            style={{ background: diffColor }}
          >
            {DIFFICULTY_LABELS[course.difficulty] ?? course.difficulty}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-foreground transition-colors group-hover:text-[#BF6D58]">
            {course.title}
          </h3>
          {course.instructor && (
            <p className="text-xs font-medium text-muted-foreground">{course.instructor.name}</p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatNumber(course.studentsCount)}
            </span>
            {course.duration != null && course.duration > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.round(course.duration / 3600) > 0
                  ? `${formatNumber(Math.round(course.duration / 3600))} س`
                  : `${formatNumber(Math.max(1, Math.round(course.duration / 60)))} د`}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-3">
            {isFree ? (
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                مجاني
              </span>
            ) : hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#BF6D58]">
                  {formatNumber(displayPrice)} {currency ?? ""}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatNumber(originalPrice)}
                </span>
              </div>
            ) : displayPrice > 0 ? (
              <span className="text-sm font-extrabold text-[#BF6D58]">
                {formatNumber(displayPrice)} {currency ?? ""}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}

            <span className="text-[11px] font-bold text-[#BF6D58]/70 transition-colors group-hover:text-[#BF6D58]">
              عرض الدورة
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RelatedCoursesInner({ courses }: RelatedCoursesProps) {
  if (!courses.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="scroll-mt-24"
    >
      <SectionHeader
        icon={<Sparkles className="h-5 w-5" />}
        title="دورات ذات صلة"
        subtitle="محتوى مشابه قد يعجبك"
        className="mb-6"
      />

      <div
        dir="rtl"
        className="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible"
      >
        {courses.map((course) => (
          <RelatedCourseCard key={course.id} course={course} />
        ))}
      </div>
    </motion.section>
  );
}

const RelatedCourses = memo(RelatedCoursesInner);

export { RelatedCourses };
export type { RelatedCoursesProps };
