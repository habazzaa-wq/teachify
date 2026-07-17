"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface CourseDescriptionProps {
  description: string | null;
  fullDescription: string | null;
}

export function CourseDescription({
  description,
  fullDescription,
}: CourseDescriptionProps) {
  const html = fullDescription || description;

  if (!html) {
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
        وصف الدورة
      </h2>

      <div
        dir="rtl"
        className={cn(
          "prose prose-slate dark:prose-invert",
          "prose-headings:font-bold prose-headings:tracking-tight",
          "prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4",
          "prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3",
          "prose-p:leading-relaxed prose-p:text-muted-foreground",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-strong:text-foreground",
          "prose-code:text-primary prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg",
          "prose-img:rounded-xl prose-img:shadow-md",
          "prose-li:text-muted-foreground prose-li:marker:text-primary",
          "prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1",
          "max-w-none rounded-xl border border-border/50 bg-card/50 p-6 sm:p-8",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </motion.section>
  );
}
