"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Heart,
  HelpCircle,
  MessageCircle,
  MessagesSquare,
  Shield,
  Star,
  Trophy,
  Users,
  Video,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { routes } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";
import {
  STAT_KEYS,
  useCommunityStats,
} from "@/features/community/hooks/useStats";
import type { CommunityIconId, CommunitySectionSettings } from "../types";

const PublicLoginCard = dynamic(
  () =>
    import("@/features/auth/components/PublicLoginCard").then(
      (m) => m.PublicLoginCard,
    ),
  { ssr: false },
);

export const PRIMARY = "var(--brand-primary)";
export const SECONDARY = "var(--brand-secondary)";

export const COMMUNITY_ICON_MAP: Record<CommunityIconId, LucideIcon> = {
  zap: Zap,
  book: BookOpen,
  chat: MessagesSquare,
  file: FileText,
  users: Users,
  star: Star,
  trophy: Trophy,
  video: Video,
  clock: Clock,
  shield: Shield,
  heart: Heart,
  help: HelpCircle,
};

export function CommunityIcon({
  id,
  className,
  style,
}: {
  id: CommunityIconId;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = COMMUNITY_ICON_MAP[id] ?? MessageCircle;
  return <Icon className={className} style={style} />;
}

export interface CommunityDisplayData {
  isAuthenticated: boolean;
  members: string;
  online: string;
  today: string;
  threads: string;
  latestActivityText: string | null;
  latestAuthorName: string | null;
}

/** Live community stats formatted for display (guests see inviting placeholders). */
export function useCommunityDisplay(): CommunityDisplayData {
  const status = useAuthStore((s) => s.status);
  const isAuthenticated = status === "authenticated";

  const { data: stats } = useCommunityStats();

  return useMemo(() => {
    const map: Record<string, number> = {};
    for (const stat of stats ?? []) {
      map[stat.key] = stat.value;
    }

    const fmt = (n: number) => new Intl.NumberFormat("ar").format(n);

    const latest = stats?.find((s) => s.key === STAT_KEYS.LATEST_MESSAGE);
    const payload = latest?.payload as
      | { body_text?: string; author?: { name?: string } }
      | undefined;

    return {
      isAuthenticated,
      members: isAuthenticated ? fmt(map[STAT_KEYS.ACTIVE_MEMBERS] ?? 0) : "آلاف",
      online: isAuthenticated ? fmt(map[STAT_KEYS.ONLINE_MEMBERS] ?? 0) : "+١٠٠",
      today: isAuthenticated ? fmt(map[STAT_KEYS.TODAY_MESSAGES] ?? 0) : "يوميًا",
      threads: isAuthenticated ? fmt(map[STAT_KEYS.TOTAL_THREADS] ?? 0) : "+١٠٠٠",
      latestActivityText: payload?.body_text?.trim() || null,
      latestAuthorName: payload?.author?.name ?? null,
    };
  }, [isAuthenticated, stats]);
}

/**
 * CTA area shared by all designs — routes signed-in users to /community and
 * opens the public login card for guests.
 */
export function CommunityCta({
  settings,
  variant,
}: {
  settings: CommunitySectionSettings;
  variant: "solid" | "outline" | "glass";
}) {
  const { isAuthenticated } = useCommunityDisplay();
  const [loginOpen, setLoginOpen] = useState(false);

  const primaryBase =
    "group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95";

  const primaryStyle: React.CSSProperties =
    variant === "solid"
      ? {
          backgroundColor: PRIMARY,
          color: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }
      : variant === "glass"
        ? {
            backgroundColor: "rgba(255,255,255,0.14)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.35)",
            backdropFilter: "blur(8px)",
          }
        : {
            color: PRIMARY,
            border: `2px solid ${PRIMARY}`,
            backgroundColor: "transparent",
          };

  const secondaryStyle: React.CSSProperties = {
    color: SECONDARY,
    border: `1.5px solid ${SECONDARY}`,
    backgroundColor: "transparent",
  };

  const handlePrimaryClick = () => {
    if (!isAuthenticated) setLoginOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {settings.primaryCta.visible &&
          (isAuthenticated ? (
            <Link href={routes.community} className={primaryBase} style={primaryStyle}>
              <MessagesSquare className="h-5 w-5" />
              {settings.primaryCta.label}
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handlePrimaryClick}
              className={primaryBase}
              style={primaryStyle}
            >
              <MessagesSquare className="h-5 w-5" />
              {settings.primaryCta.label}
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            </button>
          ))}
        {settings.secondaryCta.visible && isAuthenticated && (
          <Link
            href={routes.community}
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
            style={secondaryStyle}
          >
            {settings.secondaryCta.label}
          </Link>
        )}
        {!settings.primaryCta.visible &&
          !settings.secondaryCta.visible &&
          !isAuthenticated && (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="text-sm font-bold underline decoration-dotted underline-offset-4 opacity-80 hover:opacity-100"
              style={{ color: PRIMARY }}
            >
              انضم للمجتمع
            </button>
          )}
        {settings.note.trim() && (
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {settings.note}
          </span>
        )}
      </div>
      <PublicLoginCard
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
      />
    </>
  );
}
