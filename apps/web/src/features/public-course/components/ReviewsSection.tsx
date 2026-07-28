"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PublicCourse } from "../types";

interface ReviewsSectionProps {
  course: PublicCourse;
}

export function ReviewsSection({}: ReviewsSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      <h2 className="section-title-accent mb-6 text-lg font-semibold tracking-tight">
        تقييمات الطلاب
      </h2>

      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60",
          "bg-card/40 px-6 py-16 text-center",
        )}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Star className="h-8 w-8 text-muted-foreground/50" />
        </div>

        <h3 className="mb-1 text-base font-semibold text-foreground">
          لا توجد تقييمات بعد
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          كن أول من يقيّم هذه الدورة بعد مشاهدتها.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-5 w-5 text-muted-foreground/30"
              />
            ))}
          </div>
          <span className="text-lg font-bold text-muted-foreground">0.0</span>
        </div>
      </div>
    </motion.section>
  );
}
