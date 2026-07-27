"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/lib/format";
import { AppAvatar, AppAvatarImage, AppAvatarFallback } from "@/components/ui/AppAvatar";
import type { PublicCourse } from "../types";

interface InstructorCardProps {
  instructor: NonNullable<PublicCourse["instructor"]>;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Award className="h-5 w-5 text-primary/70" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          المدرب
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/30",
          "bg-gradient-to-br from-card via-card to-primary/5",
          "p-6 sm:p-8",
        )}
      >
        <div className="absolute -start-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -end-16 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

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
            <p className="text-sm leading-relaxed text-muted-foreground">
              مدرب معتمد ذو خبرة واسعة في هذا المجال. ي致力于 تقديم محتوى تعليمي عالي الجودة يساعد الطلاب على تحقيق أهدافهم المهنية والعلمية.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
