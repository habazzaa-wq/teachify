"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ListChecks } from "lucide-react";

interface CourseRequirementsProps {
  requirements: string[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

export function CourseRequirements({ requirements }: CourseRequirementsProps) {
  if (!requirements.length) return null;

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <ListChecks className="h-5 w-5 text-violet-500/70" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          متطلبات الدورة
        </h2>
      </div>

      <motion.ul
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="rounded-2xl border border-border/30 bg-card/40 p-5"
      >
        {requirements.map((req, index) => (
          <motion.li
            key={index}
            variants={item}
            className={cn(
              "flex items-start gap-4 py-3",
              index !== requirements.length - 1 && "border-b border-border/25",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-600 dark:text-violet-400">
              {index + 1}
            </span>
            <span className="pt-0.5 text-sm leading-relaxed text-muted-foreground">
              {req}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
