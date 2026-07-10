"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  Layers,
  BookOpen,
  Keyboard,
  Plus,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { StudioButton } from "@/components/studio/primitives/StudioButton";
import { cn } from "@/lib/cn";

interface KeyboardShortcut {
  keys: string[];
  label: string;
}

interface CourseStudioOnboardingProps {
  variant?: "navigator" | "canvas" | "inspector";
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  shortcuts?: KeyboardShortcut[];
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

function CanvasIllustration() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="flex items-center justify-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
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
            className="absolute -start-3 -top-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-studio-border/60 bg-studio-surface shadow-lg"
          >
            <BookOpen className="h-6 w-6 text-studio-accent" />
          </motion.div>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [6, -6, 6] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute -bottom-1 -end-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-studio-border/60 bg-studio-surface shadow-lg"
          >
            <Layers className="h-6 w-6 text-studio-warning" />
          </motion.div>
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-studio-accent-soft ring-8 ring-studio-bg">
            <GraduationCap className="h-12 w-12 text-studio-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavigatorIllustration() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="flex items-center justify-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-studio-accent/10 via-studio-accent/5 to-transparent" />
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-studio-accent-soft ring-4 ring-studio-bg"
          >
            <Layers className="h-10 w-10 text-studio-accent" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CourseStudioOnboarding({
  variant = "canvas",
  title,
  description,
  primaryAction,
  secondaryAction,
  shortcuts,
  className,
}: CourseStudioOnboardingProps) {
  const isCanvas = variant === "canvas";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex h-full w-full flex-col items-center justify-center",
        isCanvas ? "px-8 py-16" : "px-4 py-12",
        className,
      )}
    >
      <motion.div variants={itemVariants} className={isCanvas ? "mb-8" : "mb-6"}>
        {isCanvas ? <CanvasIllustration /> : <NavigatorIllustration />}
      </motion.div>

      <motion.div variants={itemVariants} className="max-w-md space-y-2 text-center">
        <h2
          className={cn(
            "font-bold tracking-tight text-studio-fg",
            isCanvas ? "text-2xl sm:text-3xl" : "text-base",
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "leading-relaxed text-studio-fg-muted",
            isCanvas ? "text-sm" : "text-xs",
          )}
        >
          {description}
        </p>
      </motion.div>

      {primaryAction && (
        <motion.div variants={itemVariants} className={cn("mt-6", !isCanvas && "mt-4")}>
          <StudioButton
            onClick={primaryAction.onClick}
            variant="primary"
            size={isCanvas ? "lg" : "sm"}
            icon={<Plus className="h-4 w-4" />}
          >
            {primaryAction.label}
          </StudioButton>
        </motion.div>
      )}

      {secondaryAction && (
        <motion.div variants={itemVariants} className="mt-3">
          <StudioButton
            onClick={secondaryAction.onClick}
            variant="ghost"
            size="sm"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {secondaryAction.label}
          </StudioButton>
        </motion.div>
      )}

      {shortcuts && shortcuts.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="mt-8 w-full max-w-sm rounded-xl border border-studio-border bg-studio-surface/50 p-4"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-studio-fg-muted">
            <Keyboard className="h-3.5 w-3.5" />
            <span>اختصارات لوحة المفاتيح</span>
          </div>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-studio-fg-muted">{shortcut.label}</span>
                <kbd className="flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-subtle">
                  {shortcut.keys.map((key, ki) => (
                    <span key={ki}>
                      {ki > 0 && <span className="mx-0.5 text-studio-fg-subtle">+</span>}
                      <span>{key}</span>
                    </span>
                  ))}
                </kbd>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export { CourseStudioOnboarding };
export type { CourseStudioOnboardingProps, KeyboardShortcut };
