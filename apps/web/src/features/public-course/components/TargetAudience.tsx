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
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export function TargetAudience({ audience }: TargetAudienceProps) {
  if (!audience.length) {
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
        لمن هذه الدورة؟
      </h2>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {audience.map((item_text, index) => (
          <motion.div
            key={index}
            variants={item}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-4",
              "transition-colors duration-200 hover:border-primary/20 hover:bg-primary/5",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {item_text}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
