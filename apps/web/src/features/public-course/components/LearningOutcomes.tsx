"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, GraduationCap } from "lucide-react";
import { SectionHeader } from "./primitives";

interface LearningOutcomesProps {
  outcomes: string[];
}

function LearningOutcomesInner({ outcomes }: LearningOutcomesProps) {
  if (!outcomes.length) {
    return null;
  }

  return (
    <motion.section className="scroll-mt-24">
      <SectionHeader
        icon={<GraduationCap className="h-5 w-5" />}
        title="ماذا ستتعلم؟"
        subtitle="مهارات وقدرات ستتقنها بعد إتمام الدورة"
        className="mb-6"
      />

      <div
        dir="rtl"
        className="grid gap-3 sm:grid-cols-2"
      >
        {outcomes.map((outcome, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: (index % 8) * 0.04, ease: "easeOut" }}
            className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm shadow-black/[0.02] transition-colors duration-200 hover:border-[var(--brand-primary)]"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-medium leading-relaxed text-foreground/90">
              {outcome}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

const LearningOutcomes = memo(LearningOutcomesInner);

export { LearningOutcomes };
export type { LearningOutcomesProps };
