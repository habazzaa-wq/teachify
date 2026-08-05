"use client";

import { Sprout, Medal, Trophy, Gem, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { rankTierFor, type RankTier } from "../../utils/rank";

const ICONS = {
  beginner: Sprout,
  bronze: Medal,
  silver: Medal,
  gold: Trophy,
  diamond: Gem,
  legend: Sparkles,
} as const;

/** The lucide icon for a rank tier. */
export function RankIcon({
  tier,
  className,
}: {
  tier: RankTier;
  className?: string;
}) {
  const Icon = ICONS[tier.icon] ?? Trophy;
  return <Icon className={className} />;
}

interface RankChipProps {
  slug?: string | null;
  totalXp?: number;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  xs: "gap-1 px-1.5 py-px text-[10px] [&_svg]:h-3 [&_svg]:w-3",
  sm: "gap-1.5 px-2 py-0.5 text-[11px] [&_svg]:h-3.5 [&_svg]:w-3.5",
  md: "gap-2 px-2.5 py-1 text-xs [&_svg]:h-4 [&_svg]:w-4",
} as const;

/** Pill showing a member's gamification rank. */
export function RankChip({
  slug,
  totalXp = 0,
  size = "sm",
  showLabel = true,
  className,
}: RankChipProps) {
  const tier = rankTierFor(slug, totalXp);

  return (
    <span
      title={`${tier.label} — ${tier.description}`}
      className={cn(
        "inline-flex items-center rounded-full font-bold ring-1 ring-inset",
        tier.chipClass,
        SIZE_CLASSES[size],
        className,
      )}
    >
      <RankIcon tier={tier} />
      {showLabel && <span>{tier.label}</span>}
    </span>
  );
}
