"use client";

import { Flame } from "lucide-react";
import { useGamificationMe } from "../../hooks/useGamification";
import { nextTierFor, rankProgress, rankTierFor } from "../../utils/rank";
import { formatNumber } from "../../utils/format";
import { RankChip, RankIcon } from "./RankChip";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

/** My-rank widget with XP and progress toward the next tier. */
export function RankProgressCard({ className }: { className?: string }) {
  const { data, isLoading } = useGamificationMe();

  if (isLoading || !data) {
    return (
      <div className={cn("space-y-3 rounded-2xl border bg-card p-4", className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  const totalXp = data.total_xp ?? 0;
  const tier = rankTierFor(data.rank, totalXp);
  const next = nextTierFor(totalXp);
  const progress = rankProgress(totalXp);

  return (
    <div className={cn("rounded-2xl border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted-foreground">رتبتك في المجتمع</h3>
        <RankChip slug={data.rank} totalXp={totalXp} size="sm" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset",
            tier.barClass,
            "text-white shadow-sm",
          )}
        >
          <RankIcon tier={tier} className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold">{tier.label}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="font-semibold">{formatNumber(totalXp)}</span>
            <span>نقطة</span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-gradient-to-l transition-all duration-700", tier.barClass)}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="mt-1.5 text-[10px] text-muted-foreground">
          {next ? (
            <>
              {formatNumber(next.minXp - totalXp)} نقطة متبقية لرتبة{" "}
              <span className="font-semibold">{next.label}</span>
            </>
          ) : (
            "وصلت إلى أعلى رتبة في المجتمع"
          )}
        </div>
      </div>
    </div>
  );
}
