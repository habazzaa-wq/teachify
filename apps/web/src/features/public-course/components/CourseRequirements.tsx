"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ListChecks } from "lucide-react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "./primitives";

interface CourseRequirementsProps {
  requirements: string[];
}

function CourseRequirementsInner({ requirements }: CourseRequirementsProps) {
  if (!requirements.length) {
    return null;
  }

  return (
    <motion.section className="scroll-mt-24">
      <SectionHeader
        icon={<ListChecks className="h-5 w-5" />}
        title="متطلبات الدورة"
        subtitle="ما الذي تحتاجه للبدء؟"
        className="mb-6"
      />

      <div
        dir="rtl"
        className="grid gap-3 sm:grid-cols-2"
      >
        {requirements.map((req, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: (index % 8) * 0.04, ease: "easeOut" }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm shadow-black/[0.02]",
              "transition-colors duration-200 hover:border-[rgb(var(--brand-secondary-rgb)/0.4)] hover:bg-[rgb(var(--brand-secondary-rgb)/0.04)]",
            )}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))" }}
            >
              {index + 1}
            </span>
            <span className="text-sm font-medium leading-relaxed text-foreground/90">
              {req}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

const CourseRequirements = memo(CourseRequirementsInner);

export { CourseRequirements };
export type { CourseRequirementsProps };
