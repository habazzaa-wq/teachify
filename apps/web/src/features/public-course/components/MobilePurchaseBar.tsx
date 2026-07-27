"use client";

import { motion } from "framer-motion";
import { Crown, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
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
  const isFree = course.pricingType === "free";
  const displayPrice = isFree ? 0 : (course.discountPrice ?? course.price ?? 0);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "border-t border-border/50 bg-background/95 backdrop-blur-lg",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="flex flex-1 flex-col">
          {isFree ? (
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              مجاني
            </span>
          ) : (
            <span className="text-base font-bold text-primary">
              {formatNumber(displayPrice)} {course.currency ?? "ر.س"}
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnroll}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-300",
            isEnrolled
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20",
          )}
        >
          {isEnrolled ? (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>ابدأ التعلم</span>
            </>
          ) : (
            <>
              <Crown className="h-4 w-4" />
              <span>اشترك الآن</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
