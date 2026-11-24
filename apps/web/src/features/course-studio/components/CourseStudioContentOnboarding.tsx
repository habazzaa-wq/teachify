"use client";

import { motion } from "framer-motion";
import { Sparkles, Plus, Video, ClipboardList } from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { cn } from "@/lib/cn";

interface CourseStudioContentOnboardingProps {
  onAddContent?: () => void;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function ContentOnboardingIllustration() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="flex items-center justify-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-studio-accent/10 via-studio-accent/5 to-transparent" />
          <div className="absolute -inset-4 rounded-full bg-studio-accent/5 blur-2xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-studio-accent/20"
          />
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-6, 6, -6] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -start-3 -top-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-studio-border/60 bg-studio-surface shadow-lg"
          >
            <Video className="h-5 w-5 text-secondary" />
          </motion.div>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [6, -6, 6] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute -bottom-1 -end-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-studio-border/60 bg-studio-surface shadow-lg"
          >
            <ClipboardList className="h-5 w-5 text-emerald-500" />
          </motion.div>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-studio-accent-soft ring-8 ring-studio-bg">
            <Sparkles className="h-10 w-10 text-studio-accent" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 1 }}
            className="absolute -end-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-xl bg-studio-success/15"
          >
            <Sparkles className="h-4 w-4 text-studio-success" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CourseStudioContentOnboarding({
  onAddContent,
  className,
}: CourseStudioContentOnboardingProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-studio-border bg-gradient-to-br from-studio-accent/5 via-studio-surface to-studio-surface p-8 text-center",
        className,
      )}
    >
      <div className="absolute -inset-4 rounded-full bg-studio-accent/5 blur-3xl" />
      <div className="relative">
        <motion.div variants={itemVariants} className="mb-6 flex justify-center">
          <ContentOnboardingIllustration />
        </motion.div>

        <motion.div variants={itemVariants} className="mx-auto max-w-md space-y-2">
          <h3 className="text-xl font-bold text-studio-fg">
            المحتوى التعليمي يبدأ من هنا
          </h3>
          <p className="text-sm leading-relaxed text-studio-fg-muted">
            أضف فيديوهات تعليمية، ملفات PDF، اختبارات تفاعلية، واجبات، أو أي نوع من المحتوى
            التعليمي. اختر نوع المحتوى الذي تريد إضافته للبدء.
          </p>
        </motion.div>

        {onAddContent && (
          <motion.div variants={itemVariants} className="mt-8">
            <StudioButton
              onClick={onAddContent}
              variant="primary"
              size="lg"
              icon={<Plus className="h-4 w-4" />}
            >
              إضافة محتوى
            </StudioButton>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export { CourseStudioContentOnboarding };
