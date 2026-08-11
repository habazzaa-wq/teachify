"use client";

import type { LucideIcon } from "lucide-react";
import { useBrandTheme } from "./StudentCard";
import { BRAND_PRIMARY } from "../constants";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  accent?: string;
}

/** Editorial empty state — a stamped circular seal instead of a plain box. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  accent = BRAND_PRIMARY,
}: EmptyStateProps) {
  const t = useBrandTheme();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
      <div className="relative">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            backgroundColor: accent,
            color: t.isDark ? "#141414" : "#ffffff",
            boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
          }}
        >
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
        <div
          className="absolute -inset-2 rounded-full border border-dashed"
          style={{ borderColor: accent, opacity: 0.45 }}
          aria-hidden="true"
        />
        <div
          className="absolute -inset-4 rounded-full border"
          style={{ borderColor: accent, opacity: 0.18 }}
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="text-base font-extrabold" style={{ color: t.ink }}>
          {title}
        </p>
        {description && (
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed" style={{ color: t.muted }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
