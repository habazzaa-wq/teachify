"use client";

import { memo } from "react";
import { AppAvatar, AppAvatarFallback, AppAvatarImage } from "@/components/ui/AppAvatar";
import { cn } from "@/lib/cn";
import { toAbsoluteAssetUrl } from "@/lib/url";
import type { CommunityAuthor, CommunityRole } from "../types";

interface MemberAvatarProps {
  name?: string | null;
  avatar?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<MemberAvatarProps["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

/** Avatar with graceful name fallback and optional online ring. */
export const MemberAvatar = memo(function MemberAvatar({
  name,
  avatar,
  size = "md",
  online = false,
  className,
}: MemberAvatarProps) {
  const src = toAbsoluteAssetUrl(avatar);
  const initial = (name ?? "؟").trim().charAt(0);

  return (
    <div className={cn("relative shrink-0", className)}>
      <AppAvatar className={SIZE_CLASSES[size]}>
        {src ? <AppAvatarImage src={src} alt={name ?? ""} /> : null}
        <AppAvatarFallback
          className={cn(
            "bg-gradient-to-br from-primary/20 to-secondary/30 font-bold text-primary",
          )}
        >
          {initial}
        </AppAvatarFallback>
      </AppAvatar>
      {online && (
        <span className="absolute bottom-0 end-0 block h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
      )}
    </div>
  );
});

const ROLE_LABELS: Record<Exclude<CommunityRole, null>, { label: string; className: string }> = {
  moderator: { label: "مشرف", className: "bg-sky-500/10 text-sky-600 ring-sky-500/25" },
  admin: { label: "إدارة", className: "bg-violet-500/10 text-violet-600 ring-violet-500/25" },
  super_admin: { label: "المدير العام", className: "bg-amber-500/10 text-amber-600 ring-amber-500/25" },
  member: { label: "عضو", className: "bg-muted text-muted-foreground ring-border" },
};

/** Small role badge shown next to member names. */
export function RoleBadge({ role, className }: { role?: CommunityRole; className?: string }) {
  if (!role || role === "member") return null;
  const meta = ROLE_LABELS[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-bold ring-1 ring-inset",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

interface AvatarStackProps {
  members: CommunityAuthor[];
  size?: "xs" | "sm";
  max?: number;
}

/** Overlapping avatars used for reactions / seen-by / reaction members. */
export const AvatarStack = memo(function AvatarStack({
  members,
  size = "xs",
  max = 3,
}: AvatarStackProps) {
  if (members.length === 0) return null;
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;

  return (
    <div className="flex -space-x-1.5">
      {shown.map((m, i) => (
        <div
          key={`${m.id ?? i}`}
          className="rounded-full ring-2 ring-background"
        >
          <MemberAvatar name={m.name} avatar={m.avatar} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted font-bold text-muted-foreground ring-2 ring-background",
            size === "xs" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
});

/** Animated typing indicator. */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label="يكتب…">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}
