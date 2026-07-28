"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PublicCourse } from "../types";

interface CoursePreviewProps {
  course: PublicCourse;
}

export function CoursePreview({ course }: CoursePreviewProps) {
  if (!course.coverImage) {
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
        معاينة الدورة
      </h2>

      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/50"
      >
        <div className="relative aspect-video w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.coverImage}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-primary/30"
              />
              <div
                className={cn(
                  "relative flex h-20 w-20 items-center justify-center rounded-full",
                  "bg-primary shadow-xl shadow-primary/30",
                  "transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-primary/40",
                )}
              >
                <Play className="h-8 w-8 text-primary-foreground fill-current" />
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-4 end-4 start-4 text-center">
            <p className="text-sm font-medium text-white/90">
              شاهد معاينة الدورة
            </p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
