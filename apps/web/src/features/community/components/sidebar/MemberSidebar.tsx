"use client";

import { Users, Trophy, BarChart3, Loader2 } from "lucide-react";
import { useOnlineMembers } from "../../hooks/usePresence";
import { useLeaderboard } from "../../hooks/useGamification";
import { useCommunityStatsMap } from "../../hooks/useStats";
import { formatNumber, formatCompact } from "../../utils/format";
import { useCommunityStore } from "../../stores/community.store";
import { MemberAvatar } from "../atoms";
import { RankProgressCard } from "../gamification/RankProgressCard";
import { RankChip } from "../gamification/RankChip";
import { cn } from "@/lib/cn";

const MEDALS = ["🥇", "🥈", "🥉"];

export function MemberSidebar({ className }: { className?: string }) {
  const { data: online } = useOnlineMembers();
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const statsMap = useCommunityStatsMap();
  const activeChannelId = useCommunityStore((s) => s.activeChannelId);

  const activeHere = (online ?? []).filter((m) =>
    activeChannelId ? m.current_channel_id === activeChannelId : true,
  );

  return (
    <div className={cn("flex h-full flex-col overflow-y-auto bg-card", className)}>
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-extrabold">
          <Users className="h-4 w-4 text-primary" />
          الأعضاء
          <span className="ms-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            {online?.length ?? 0} متصل
          </span>
        </div>
        {activeChannelId && activeHere.length > 0 && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {activeHere.length} في هذه القناة
          </p>
        )}
      </div>

      <div className="p-3">
        <RankProgressCard />
      </div>

      {/* Online members */}
      <div className="px-4 pb-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          متصل الآن
        </div>
        <div className="space-y-0.5">
          {(online ?? []).slice(0, 12).map((member) => (
            <div
              key={member.id ?? member.name}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
            >
              <MemberAvatar
                name={member.name}
                avatar={member.avatar}
                size="sm"
                online={member.status !== "offline"}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {member.name ?? "عضو"}
              </span>
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  member.status === "busy"
                    ? "bg-destructive"
                    : member.status === "away"
                      ? "bg-amber-500"
                      : "bg-emerald-500",
                )}
              />
            </div>
          ))}
          {(online ?? []).length === 0 && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              لا يوجد أعضاء متصلون حالياً
            </p>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4 pb-2 pt-3">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          أفضل المساهمين
        </div>
        <div className="space-y-0.5">
          {leaderboardLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              جارٍ التحميل…
            </div>
          )}
          {(leaderboard ?? []).slice(0, 5).map((member, i) => (
            <div key={member.member_id ?? member.name} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span className="w-5 text-center text-sm font-extrabold">
                {MEDALS[i] ?? <span className="text-[10px] text-muted-foreground">{i + 1}</span>}
              </span>
              <MemberAvatar name={member.name} avatar={member.avatar} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {member.name ?? "عضو"}
              </span>
              <RankChip slug={rankSlug(member.total_xp)} totalXp={member.total_xp} size="xs" />
              <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                {formatNumber(member.total_xp)}
              </span>
            </div>
          ))}
          {(leaderboard ?? []).length === 0 && !leaderboardLoading && (
            <p className="py-3 text-center text-xs text-muted-foreground">لا توجد بيانات بعد</p>
          )}
        </div>
      </div>

      {/* Community stats */}
      <div className="px-4 pb-4 pt-3">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          إحصائيات المجتمع
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCell label="الأعضاء النشطون" value={formatCompact(statsMap.active_members ?? 0)} />
          <StatCell label="رسائل اليوم" value={formatCompact(statsMap.today_messages ?? 0)} />
          <StatCell label="إجمالي الرسائل" value={formatCompact(statsMap.total_messages ?? 0)} />
          <StatCell label="الموضوعات" value={formatCompact(statsMap.total_threads ?? 0)} />
          <StatCell label="التفاعلات" value={formatCompact(statsMap.total_reactions ?? 0)} />
          <StatCell label="متصلون الآن" value={formatCompact(statsMap.online_members ?? online?.length ?? 0)} />
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-2.5">
      <div className="text-sm font-extrabold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function rankSlug(xp: number): string {
  if (xp >= 2000) return "legend";
  if (xp >= 1000) return "diamond";
  if (xp >= 600) return "gold";
  if (xp >= 300) return "silver";
  if (xp >= 100) return "bronze";
  return "beginner";
}
