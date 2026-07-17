"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Layers,
  Clock,
  Users,
  FolderOpen,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { PublicCourse } from "../types";

interface CourseStatsProps {
  course: PublicCourse;
}

interface StatCard {
  icon: React.ElementType;
  value: string;
  label: string;
}

function buildStats(course: PublicCourse): StatCard[] {
  return [
    {
      icon: BookOpen,
      value: formatNumber(course.lessonsCount),
      label: "درس",
    },
    {
      icon: Layers,
      value: formatNumber(course.sectionsCount),
      label: "وحدة",
    },
    {
      icon: Clock,
      value: course.duration ? `${Math.round(course.duration / 60)}` : "—",
      label: "ساعة",
    },
    {
      icon: Users,
      value: formatNumber(course.studentsCount),
      label: "طالب",
    },
    {
      icon: FolderOpen,
      value: formatNumber(course.tags.length),
      label: "مورد",
    },
    {
      icon: Timer,
      value: course.duration
        ? `${Math.round(course.duration / 60)}`
        : "—",
      label: "المدة",
    },
  ];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const card = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function CourseStats({ course }: CourseStatsProps) {
  const stats = buildStats(course);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={card}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-4",
              "transition-all duration-200 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
