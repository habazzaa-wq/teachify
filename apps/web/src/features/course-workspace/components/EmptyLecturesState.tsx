"use client";

import { motion } from "framer-motion";
import { GraduationCap, Layers, Plus, Sparkles, Video } from "lucide-react";
import { PermissionGuard } from "@/components/ui";

interface EmptyLecturesStateProps {
  onCreateLecture: () => void;
}

/**
 * Onboarding state shown when a course has no lectures yet.
 */
function EmptyLecturesState({ onCreateLecture }: EmptyLecturesStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full flex-col items-center justify-center gap-8 px-6 py-16"
    >
      <div className="relative" aria-hidden="true">
        <motion.div
          initial={{ rotate: -4, y: 6 }}
          animate={{ rotate: -6, y: 10 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 3, ease: "easeInOut" }}
          className="absolute -start-10 top-4 flex h-20 w-28 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-lg shadow-primary/5"
        >
          <Video className="h-6 w-6 text-secondary" />
        </motion.div>
        <motion.div
          initial={{ rotate: 5, y: -4 }}
          animate={{ rotate: 7, y: -10 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 3.4, ease: "easeInOut" }}
          className="absolute -end-10 top-8 flex h-20 w-28 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-lg shadow-primary/5"
        >
          <Layers className="h-6 w-6 text-blue" />
        </motion.div>
        <div className="relative flex h-36 w-36 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent ring-8 ring-background">
          <GraduationCap className="h-16 w-16 text-primary/25" />
          <span className="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-xl bg-success/15">
            <Sparkles className="h-4 w-4 text-success" />
          </span>
        </div>
      </div>

      <div className="max-w-md space-y-2.5 text-center">
        <h2 className="text-xl font-bold tracking-tight">ابنِ منهج دورتك</h2>
        <p className="text-sm leading-relaxed text-muted-foreground/80">
          تتكون الدورة من محاضرات، وكل محاضرة من أقسام، وكل قسم من محتوى تعليمي.
          ابدأ بإنشاء أول محاضرة لدورتك.
        </p>
      </div>

      <PermissionGuard permission="modules.create">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreateLecture}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          أنشئ أول محاضرة
        </motion.button>
      </PermissionGuard>
    </motion.div>
  );
}

export { EmptyLecturesState };
