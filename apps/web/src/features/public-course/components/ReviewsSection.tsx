"use client";

import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";

export function ReviewsSection() {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
          <Star className="h-5 w-5 text-amber-500/70" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          تقييمات الطلاب
        </h2>
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40",
          "bg-card/30 px-6 py-16 text-center",
        )}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50"
        >
          <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
        </motion.div>

        <h3 className="mb-1 text-base font-semibold text-foreground">
          لا توجد تقييمات بعد
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          كن أول من يقيّم هذه الدورة بعد مشاهدتها.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-5 w-5 text-muted-foreground/25" />
            ))}
          </div>
          <span className="text-lg font-bold text-muted-foreground">0.0</span>
        </div>
      </div>
    </section>
  );
}
