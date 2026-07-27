"use client";

import { motion } from "framer-motion";
import { BookOpen, Layers, Clock, Users, Award, Infinity } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { PublicCourse } from "../types";

interface StatsBarProps {
  course: PublicCourse;
}

interface StatItem {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
  bg: string;
}

function buildStats(course: PublicCourse): StatItem[] {
  const hours = course.duration ? Math.round(course.duration / 3600) : null;
  return [
    {
      icon: BookOpen,
      value: formatNumber(course.lessonsCount),
      label: "درس",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Layers,
      value: formatNumber(course.sectionsCount),
      label: "وحدة تعليمية",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    ...(hours !== null
      ? [
          {
            icon: Clock,
            value: `${hours}`,
            label: "ساعة من المحتوى",
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
          } as StatItem,
        ]
      : []),
    {
      icon: Users,
      value: formatNumber(course.studentsCount),
      label: "طالب مسجّل",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
    ...(course.certificateEnabled
      ? [
          {
            icon: Award,
            value: "✓",
            label: "شهادة إتمام",
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-500/10",
          } as StatItem,
        ]
      : []),
    {
      icon: Infinity,
      value: "✓",
      label: "وصول دائم",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
    },
  ];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function StatsBar({ course }: StatsBarProps) {
  const stats = buildStats(course);

  return (
    <motion.section
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={item}
          className={cn(
            "group flex flex-col items-center gap-2.5 rounded-2xl border border-border/30 bg-card/40 p-4",
            "transition-all duration-300 hover:border-primary/15 hover:bg-card/70 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5",
          )}
        >
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.bg)}>
            <stat.icon className={cn("h-5 w-5", stat.color)} />
          </div>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {stat.value}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">
            {stat.label}
          </span>
        </motion.div>
      ))}
    </motion.section>
  );
}
