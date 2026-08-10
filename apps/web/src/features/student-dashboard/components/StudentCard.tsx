"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";
import { BRAND_PRIMARY, BRAND_SECONDARY } from "../constants";

/** Returns the matching contrast token for a solid brand accent. */
export function contrastFor(accent: string): string {
  return accent === BRAND_SECONDARY
    ? "var(--brand-secondary-contrast)"
    : "var(--brand-primary-contrast)";
}

/** Shared neutral ink/muted/border tokens derived from the active theme. */
export function useBrandTheme() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";
  return {
    isDark,
    ink: isDark ? "#F0ECE6" : "#1a1510",
    muted: isDark ? "#8a8290" : "#7a7168",
    faint: isDark ? "#9a92a0" : "#8d8377",
    cardBg: isDark ? "#16141e" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    cardShadow: isDark
      ? "0 1px 2px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.2)"
      : "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(120,90,60,0.08)",
    divider: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    chipBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.6)",
  };
}

interface StudentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Card shell that mirrors the public site design: rounded-3xl, white surface,
 * soft warm shadow and a gentle lift on hover.
 */
function StudentCard({ className, children, ...props }: StudentCardProps) {
  const t = useBrandTheme();
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-0.5",
        className,
      )}
      style={{
        background: t.cardBg,
        border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

interface StudentCardHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: string;
  action?: React.ReactNode;
  className?: string;
}

function StudentCardHeader({
  icon: Icon,
  title,
  subtitle,
  accent = BRAND_PRIMARY,
  action,
  className,
}: StudentCardHeaderProps) {
  const t = useBrandTheme();
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b px-5 pb-4 pt-5 sm:px-6",
        className,
      )}
      style={{ borderColor: t.divider }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: accent,
            color: contrastFor(accent),
            boxShadow: "0 4px 12px rgba(0,0,0,0.133)",
          }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-[15px] font-extrabold leading-tight sm:text-base" style={{ color: t.ink }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] leading-snug" style={{ color: t.muted }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

interface StudentChipProps {
  children: React.ReactNode;
  accent: string;
  text?: string;
  className?: string;
}

/** Small rounded pill used for inline metadata — a single brand color. */
function StudentChip({ children, accent, text, className }: StudentChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold",
        className,
      )}
      style={{
        backgroundColor: accent,
        color: text ?? contrastFor(accent),
      }}
    >
      {children}
    </span>
  );
}

interface StudentEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  accent?: string;
}

function StudentEmptyState({
  icon: Icon,
  title,
  description,
  accent = BRAND_PRIMARY,
}: StudentEmptyStateProps) {
  const t = useBrandTheme();
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: accent, color: contrastFor(accent) }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold" style={{ color: t.ink }}>
        {title}
      </p>
      {description && (
        <p className="max-w-xs text-xs leading-relaxed" style={{ color: t.muted }}>
          {description}
        </p>
      )}
    </div>
  );
}

export {
  StudentCard,
  StudentCardHeader,
  StudentChip,
  StudentEmptyState,
  type StudentCardProps,
};
