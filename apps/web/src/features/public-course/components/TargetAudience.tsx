"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { cn } from "@/lib/cn";

interface TargetAudienceProps {
  audience: string[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export function TargetAudience({ audience }: TargetAudienceProps) {
  if (!audience.length) return null;

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
          <Users className="h-5 w-5 text-sky-500/70" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          لمن هذه الدورة؟
        </h2>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="grid gap-2.5 sm:grid-cols-2"
      >
        {audience.map((item_text, index) => (
          <motion.div
            key={index}
            variants={item}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border/30 bg-card/40 p-4",
              "transition-all duration-300 hover:border-sky-500/15 hover:bg-sky-500/[0.02] hover:shadow-sm",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
              <Users className="h-4 w-4 text-sky-500" />
            </div>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {item_text}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
