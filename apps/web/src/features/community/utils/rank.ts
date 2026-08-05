/** Gamification rank tiers: mapping backend slugs to a 6-level display. */

export interface RankTier {
  key: string;
  label: string;
  english: string;
  minXp: number;
  color: string;
  barClass: string;
  chipClass: string;
  icon: "beginner" | "bronze" | "silver" | "gold" | "diamond" | "legend";
  description: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    key: "beginner",
    label: "مبتدئ",
    english: "Beginner",
    minXp: 0,
    color: "text-slate-500",
    barClass: "from-slate-400 to-slate-500",
    chipClass: "bg-slate-500/10 text-slate-600 ring-slate-500/20",
    icon: "beginner",
    description: "بداية رحلتك في المجتمع",
  },
  {
    key: "bronze",
    label: "برونزي",
    english: "Bronze",
    minXp: 100,
    color: "text-amber-700",
    barClass: "from-amber-700 to-orange-700",
    chipClass: "bg-amber-700/10 text-amber-800 ring-amber-700/25",
    icon: "bronze",
    description: "عضو نشط ومتفاعل",
  },
  {
    key: "silver",
    label: "فضي",
    english: "Silver",
    minXp: 300,
    color: "text-slate-400",
    barClass: "from-slate-300 to-slate-400",
    chipClass: "bg-slate-300/20 text-slate-500 ring-slate-300/40",
    icon: "silver",
    description: "مساهم دائم في النقاشات",
  },
  {
    key: "gold",
    label: "ذهبي",
    english: "Gold",
    minXp: 600,
    color: "text-amber-500",
    barClass: "from-amber-400 to-yellow-500",
    chipClass: "bg-amber-400/15 text-amber-600 ring-amber-400/30",
    icon: "gold",
    description: "من أبرز الأعضاء المساعدين",
  },
  {
    key: "diamond",
    label: "ماسي",
    english: "Diamond",
    minXp: 1000,
    color: "text-cyan-500",
    barClass: "from-cyan-400 to-blue-500",
    chipClass: "bg-cyan-400/15 text-cyan-600 ring-cyan-400/30",
    icon: "diamond",
    description: "نجم المجتمع الأول",
  },
  {
    key: "legend",
    label: "أسطوري",
    english: "Legend",
    minXp: 2000,
    color: "text-purple-500",
    barClass: "from-fuchsia-500 via-purple-500 to-indigo-500",
    chipClass:
      "bg-gradient-to-l from-fuchsia-500/15 via-purple-500/15 to-indigo-500/15 text-purple-600 ring-purple-500/25",
    icon: "legend",
    description: "أسطورة المجتمع",
  },
];

/**
 * Resolve the display tier for a member.
 * `slug` comes from the backend gamification endpoint; we still honour the
 * higher Legend threshold when XP reaches it.
 */
export function rankTierFor(
  slug: string | null | undefined,
  totalXp = 0,
): RankTier {
  const bySlug = RANK_TIERS.find((t) => t.key === slug);
  const effectiveXp = Math.max(totalXp, bySlug?.minXp ?? 0);
  let tier = bySlug ?? RANK_TIERS[0]!;
  for (const candidate of RANK_TIERS) {
    if (effectiveXp >= candidate.minXp) {
      tier = candidate;
    }
  }
  return tier;
}

/** The next tier above `xp` (for progress bars), or null when maxed. */
export function nextTierFor(totalXp: number): RankTier | null {
  return RANK_TIERS.find((t) => totalXp < t.minXp) ?? null;
}

/** Progress 0–1 towards the next tier, or 1 when maxed. */
export function rankProgress(totalXp: number): number {
  const tier = rankTierFor(undefined, totalXp);
  const next = nextTierFor(totalXp);
  if (!next) return 1;
  const span = next.minXp - tier.minXp;
  if (span <= 0) return 1;
  return Math.min(1, (totalXp - tier.minXp) / span);
}
