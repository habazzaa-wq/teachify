"use client";

import { cn } from "@/lib/cn";
import { Wifi, WifiOff } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { CONNECTION_QUALITY_CONFIG } from "../constants";
import type { ConnectionQuality } from "../types";

interface ConnectionQualityIndicatorProps {
  quality: ConnectionQuality;
  className?: string;
}

const barToneByQuality: Record<ConnectionQuality, string> = {
  offline: "bg-studio-danger",
  poor: "bg-studio-danger",
  moderate: "bg-studio-warning",
  good: "bg-studio-success",
  excellent: "bg-studio-success",
  unknown: "bg-studio-fg-subtle",
};

/**
 * Compact signal-strength indicator + label. Honors reduced-motion and is
 * fully keyboard/ARIA readable via its title + role.
 */
export function ConnectionQualityIndicator({ quality, className }: ConnectionQualityIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const config = CONNECTION_QUALITY_CONFIG[quality];
  const offline = quality === "offline";

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="status"
      aria-label={`جودة الاتصال: ${config.label}`}
      title={`جودة الاتصال: ${config.label}`}
    >
      {offline ? (
        <WifiOff className="h-3.5 w-3.5 text-studio-danger" aria-hidden />
      ) : (
        <Wifi className="h-3.5 w-3.5 text-studio-fg-muted" aria-hidden />
      )}
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3, 4].map((level) => {
          const active = level <= config.bars;
          return (
            <motion.span
              key={level}
              className={cn("w-0.5 rounded-full", active ? barToneByQuality[quality] : "bg-studio-muted")}
              initial={false}
              animate={{ height: `${4 + level * 2}px` }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
            />
          );
        })}
      </span>
      <span
        className={cn(
          "text-[10px] font-medium",
          config.tone === "danger" && "text-studio-danger",
          config.tone === "warning" && "text-studio-warning",
          config.tone === "success" && "text-studio-success",
          config.tone === "default" && "text-studio-fg-muted",
          config.tone === "info" && "text-studio-info",
        )}
      >
        {config.label}
      </span>
    </div>
  );
}
