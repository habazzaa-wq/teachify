"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Play,
  ClipboardCheck,
  FolderOpen,
  Clock,
  Users,
  AudioLines,
} from "lucide-react";
import { formatNumber } from "@/lib/format";
import { getCourseStats } from "../utils";
import { ACCENT, PRIMARY } from "../brand";
import type { PublicCourse, PublicCourseModule } from "../types";

interface CourseStatsProps {
  course: PublicCourse;
  modules?: PublicCourseModule[];
}

interface Stat {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}

function CourseStatsInner({ course, modules }: CourseStatsProps) {
  const moduleStats = useMemo(() => getCourseStats(modules ?? []), [modules]);

  const stats = useMemo<Stat[]>(() => {
    const hours = course.duration
      ? Math.round(course.duration / 3600) > 0
        ? `${formatNumber(Math.round(course.duration / 3600))}`
        : `${formatNumber(Math.max(1, Math.round(course.duration / 60)))}`
      : "—";

    const list: Stat[] = [
      {
        icon: BookOpen,
        value: formatNumber(course.lessonsCount),
        label: "درس",
        color: PRIMARY,
      },
      {
        icon: Play,
        value: formatNumber(moduleStats.videos || course.lessonsCount),
        label: "فيديو",
        color: "#3b82f6",
      },
      {
        icon: ClipboardCheck,
        value: formatNumber(moduleStats.exams),
        label: "امتحان",
        color: "#f59e0b",
      },
      {
        icon: FolderOpen,
        value: formatNumber(moduleStats.resources || moduleStats.files),
        label: "مورد",
        color: "#10b981",
      },
      {
        icon: AudioLines,
        value: formatNumber(moduleStats.audio),
        label: "صوتي",
        color: "#a855f7",
      },
      {
        icon: Clock,
        value: hours,
        label: "ساعة تعلم",
        color: ACCENT,
      },
      {
        icon: Users,
        value: formatNumber(course.studentsCount),
        label: "طالب",
        color: PRIMARY,
      },
    ];

    return list.filter((s) => {
      const meaningful = s.value !== "0" && s.value !== "—";
      const always = s.label === "طالب" || s.label === "درس";
      return meaningful || always;
    });
  }, [course, moduleStats]);

  return (
    <motion.section className="scroll-mt-24">
      <div dir="rtl" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.3, delay: (i % 8) * 0.04, ease: "easeOut" }}
            className="group flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card px-2 py-4 text-center shadow-sm shadow-black/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)]"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{ background: `${stat.color}14` }}
            >
              <stat.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: stat.color }} />
            </div>
            <span className="text-base font-extrabold tabular-nums text-foreground">
              {stat.value}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

const CourseStats = memo(CourseStatsInner);

export { CourseStats };
export type { CourseStatsProps };
