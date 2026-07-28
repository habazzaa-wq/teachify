"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface LearningOutcomesProps {
  outcomes: string[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, x: 16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function LearningOutcomes({ outcomes }: LearningOutcomesProps) {
  if (!outcomes.length) {
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
        ماذا ستتعلم في هذه الدورة؟
      </h2>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {outcomes.map((outcome, index) => (
          <motion.div
            key={index}
            variants={item}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border/50 bg-card/60 p-4",
              "transition-colors duration-200 hover:border-primary/20 hover:bg-primary/5",
            )}
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm leading-relaxed text-muted-foreground">
              {outcome}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
