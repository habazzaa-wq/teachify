"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { AppButton } from "@/components/ui/AppButton";
import type { PublicCourse } from "../types";

interface MobilePurchaseBarProps {
  course: PublicCourse;
  isEnrolled: boolean;
  onEnroll: () => void;
}

export function MobilePurchaseBar({
  course,
  isEnrolled,
  onEnroll,
}: MobilePurchaseBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "border-t border-border/50 bg-background/95 backdrop-blur-lg",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex flex-1 flex-col">
          {course.pricingType === "free" ? (
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              مجاني
            </span>
          ) : course.discountPrice ? (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-primary">
                {course.discountPrice} {course.currency ?? "ر.س"}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {course.price} {course.currency ?? "ر.س"}
              </span>
            </div>
          ) : course.price ? (
            <span className="text-base font-bold text-primary">
              {course.price} {course.currency ?? "ر.س"}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        <AppButton
          onClick={onEnroll}
          disabled={isEnrolled}
          size="lg"
          className={cn(
            "min-w-[140px]",
            isEnrolled &&
              "bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-600",
          )}
        >
          {isEnrolled ? "أنت مشترك" : "اشترك الآن"}
        </AppButton>
      </div>
    </motion.div>
  );
}
