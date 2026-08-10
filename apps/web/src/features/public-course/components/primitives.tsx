import { memo, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Crown } from "lucide-react";
import { cn } from "@/lib/cn";
import { CTA_GRADIENT } from "../brand";

/* ─── Section header with brand icon chip ──────────────────────────── */

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionHeader = memo(function SectionHeader({
  icon,
  title,
  subtitle,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3.5", className)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)]">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
});

/* ─── Premium gradient subscribe button ────────────────────────────── */

interface SubscribeButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  size?: "md" | "lg";
}

export const SubscribeButton = memo(function SubscribeButton({
  onClick,
  label = "اشترك الآن",
  className,
  size = "lg",
}: SubscribeButtonProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={prefersReduced ? undefined : { scale: 1.02, y: -1 }}
      whileTap={prefersReduced ? undefined : { scale: 0.98 }}
      className={cn(
        "group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl font-bold text-white shadow-lg transition-shadow duration-300",
        "shadow-[0_8px_28px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        size === "lg" ? "px-7 py-4 text-base" : "px-6 py-3 text-sm",
        className,
      )}
      style={{ background: CTA_GRADIENT }}
    >
      <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Crown className="relative h-5 w-5" />
      <span className="relative">{label}</span>
    </motion.button>
  );
});

/* ─── Locked banner chip ───────────────────────────────────────────── */

export const LockedChip = memo(function LockedChip({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400",
        className,
      )}
    >
      <Lock className="h-2.5 w-2.5 fill-current" />
      مقفل
    </span>
  );
});
