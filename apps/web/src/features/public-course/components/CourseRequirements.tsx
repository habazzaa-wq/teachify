"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface CourseRequirementsProps {
  requirements: string[];
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
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function CourseRequirements({ requirements }: CourseRequirementsProps) {
  if (!requirements.length) {
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
        متطلبات الدورة
      </h2>

      <motion.ul
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="rounded-xl border border-border/50 bg-card/60 p-5"
      >
        {requirements.map((req, index) => (
          <motion.li
            key={index}
            variants={item}
            className={cn(
              "flex items-start gap-4 py-3",
              index !== requirements.length - 1 &&
                "border-b border-border/40",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {index + 1}
            </span>
            <span className="pt-0.5 text-sm leading-relaxed text-muted-foreground">
              {req}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.section>
  );
}
