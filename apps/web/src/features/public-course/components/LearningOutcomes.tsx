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
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, x: 12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function LearningOutcomes({ outcomes }: LearningOutcomesProps) {
  if (!outcomes.length) return null;

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          ماذا ستتعلم في هذه الدورة؟
        </h2>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="grid gap-2.5 sm:grid-cols-2"
      >
        {outcomes.map((outcome, index) => (
          <motion.div
            key={index}
            variants={item}
            className={cn(
              "flex items-start gap-3 rounded-2xl border border-border/30 bg-card/40 p-4",
              "transition-all duration-300 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] hover:shadow-sm",
            )}
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 15,
                delay: 0.1 + index * 0.04,
              }}
              className="mt-0.5 shrink-0"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            </motion.div>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {outcome}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
