"use client";

import { motion } from "framer-motion";
import { Star, BookOpen, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/lib/format";
import { AppAvatar, AppAvatarImage, AppAvatarFallback } from "@/components/ui/AppAvatar";
import type { PublicCourse } from "../types";

interface InstructorCardProps {
  instructor: PublicCourse["instructor"];
}

const stats = [
  { icon: BookOpen, label: "الدورات", value: "—" },
  { icon: UsersIcon, label: "الطلاب", value: "—" },
  { icon: Star, label: "التقييم", value: "0.0" },
];

export function InstructorCard({ instructor }: InstructorCardProps) {
  if (!instructor) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      <h2 className="section-title-accent mb-6 text-lg font-semibold tracking-tight">
        المدرب
      </h2>

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/50",
          "bg-gradient-to-br from-card via-card to-primary/5",
          "p-6 sm:p-8",
        )}
      >
        <div className="absolute -start-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-16 -end-16 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <AppAvatar className="h-28 w-28 border-4 border-primary/10 shadow-lg shadow-primary/10">
              {instructor.avatar ? (
                <AppAvatarImage src={instructor.avatar} alt={instructor.name} />
              ) : null}
              <AppAvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                {initialsOf(instructor.name)}
              </AppAvatarFallback>
            </AppAvatar>
          </div>

          <div className="flex-1 text-center sm:text-start">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
              المدرب
            </p>
            <h3 className="mb-2 text-xl font-bold text-foreground">
              {instructor.name}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              مدرب معتمد ذو خبرة واسعة في هذا المجال. ي致力于 تقديم محتوى تعليمي عالي الجودة يساعد الطلاب على تحقيق أهدافهم المهنية والعلمية.
            </p>

            <div className="flex items-center justify-center gap-6 sm:justify-start">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <stat.icon className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-sm font-bold text-foreground">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
