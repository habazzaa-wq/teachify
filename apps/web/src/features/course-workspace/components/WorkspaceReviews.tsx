"use client";

import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { AppEmptyState } from "@/components/ui";

interface WorkspaceReviewsProps {
  courseId: string;
}

function WorkspaceReviews({ courseId: _courseId }: WorkspaceReviewsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-muted-foreground/20 text-muted-foreground/20" />
            ))}
          </div>
          <span className="text-sm font-semibold">0.0</span>
          <span className="text-xs text-muted-foreground/60">(0 تقييم)</span>
        </div>
      </div>

      <AppEmptyState
        icon={MessageSquare}
        title="لا توجد تقييمات"
        description="لم يتم إضافة أي تقييمات بعد. ستظهر التقييمات هنا عندما يبدأ الطلاب بتقييم الدورة."
      />
    </motion.div>
  );
}

export { WorkspaceReviews };