"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { UploadStatus } from "../types";

type ProgressTone = "accent" | "success" | "warning" | "danger" | "info";

const toneFill: Record<ProgressTone, string> = {
  accent: "bg-studio-accent",
  success: "bg-studio-success",
  warning: "bg-studio-warning",
  danger: "bg-studio-danger",
  info: "bg-studio-info",
};

function toneForStatus(status: UploadStatus): ProgressTone {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
    case "cancelled":
      return "danger";
    case "paused":
      return "warning";
    case "retrying":
      return "warning";
    default:
      return "accent";
  }
}

interface UploadProgressBarProps {
  value: number;
  status: UploadStatus;
  className?: string;
}

export function UploadProgressBar({ value, status, className }: UploadProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(100, Math.max(0, value));
  const tone = toneForStatus(status);
  const indeterminate = status === "preparing" || status === "processing";

  return (
    <div
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-studio-muted", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <motion.div
          className={cn("absolute inset-y-0 start-0 rounded-full", toneFill[tone])}
          initial={{ width: "15%" }}
          animate={{ x: ["-20%", "120%"], width: ["15%", "40%", "15%"] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 1.4, ease: "easeInOut", repeat: Infinity }
          }
        />
      ) : (
        <motion.div
          className={cn("h-full rounded-full", toneFill[tone])}
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
        />
      )}
    </div>
  );
}
