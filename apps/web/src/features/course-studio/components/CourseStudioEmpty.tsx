"use client";

import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { StudioEmptyState } from "@/components/studio/states/EmptyStates";
import { cn } from "@/lib/cn";

interface CourseStudioEmptyProps {
  variant?: "navigator" | "canvas" | "inspector";
  className?: string;
}

const messages = {
  navigator: {
    title: "لا توجد محاضرات",
    description: "لم يتم إضافة أي محاضرات بعد. ابدأ بإنشاء أول محاضرة.",
  },
  canvas: {
    title: "لا يوجد محتوى لعرضه",
    description: "اختر عنصراً من القائمة الجانبية أو ابدأ بإنشاء محتوى جديد.",
  },
  inspector: {
    title: "خصائص العنصر",
    description: "اختر عنصراً لعرض خصائصه",
  },
} as const;

function CourseStudioEmpty({ variant = "canvas", className }: CourseStudioEmptyProps) {
  const msg = messages[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
      className={cn("flex h-full items-center justify-center", className)}
    >
      <StudioEmptyState
        icon={<Inbox className="h-8 w-8" />}
        title={msg.title}
        description={msg.description}
      />
    </motion.div>
  );
}

export { CourseStudioEmpty };
