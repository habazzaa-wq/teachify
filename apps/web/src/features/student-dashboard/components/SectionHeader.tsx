"use client";

import * as React from "react";
import { useBrandTheme } from "./StudentCard";
import { formatNumber } from "@/lib/format";

interface SectionHeaderProps {
  index: number;
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/** Editorial section heading — numbered eyebrow, display title, optional action. */
export function SectionHeader({
  index,
  eyebrow,
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  const t = useBrandTheme();

  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black tabular-nums"
            style={{
              backgroundColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              color: t.muted,
            }}
          >
            {formatNumber(index)}
          </span>
          <span
            className="text-[11px] font-black uppercase tracking-[0.18em]"
            style={{ color: t.muted }}
          >
            {eyebrow}
          </span>
        </div>
        <h2
          className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
          style={{ color: t.ink }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm" style={{ color: t.muted }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
