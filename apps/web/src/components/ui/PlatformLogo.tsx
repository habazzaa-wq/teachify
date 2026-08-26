"use client";

import { cn } from "@/lib/cn";
import { env } from "@/config/env";

function LogoMark({ className }: { className?: string }) {
  const gradId = "platform-logo-grad";
  const ringId = "platform-logo-ring";

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="شعار المنصة"
      fill="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-primary)" />
          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.82" />
        </linearGradient>
        <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-secondary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--brand-secondary)" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect x="4" y="4" width="56" height="56" rx="17" fill={`url(#${gradId})`} />
      <rect
        x="7.5"
        y="7.5"
        width="49"
        height="49"
        rx="14"
        stroke={`url(#${ringId})`}
        strokeWidth="1.5"
      />

      {/* Mortarboard */}
      <path d="M32 16 L49 27 L32 38 L15 27 Z" fill="var(--brand-secondary)" />
      <path d="M15 27 L49 27 L49 30.5 L15 30.5 Z" fill="var(--brand-secondary)" fillOpacity="0.55" />
      <path d="M25 37 L39 37 L36 47.5 L28 47.5 Z" fill="#ffffff" />

      {/* Tassel */}
      <path
        d="M32 27 C 41 29 46 33 46 39"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="46" cy="40" r="2.6" fill="#ffffff" />

      {/* Sparkle */}
      <path
        d="M51 11 C 52 14 53 15 56 16 C 53 17 52 18 51 21 C 50 18 49 17 46 16 C 49 15 50 14 51 11 Z"
        fill="#ffffff"
        fillOpacity="0.92"
      />
    </svg>
  );
}

export function PlatformLogo({
  className,
  showWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark
        className={cn("h-10 w-10 shrink-0 drop-shadow-[0_6px_18px_rgba(0,0,0,0.18)]", className)}
      />
      {showWordmark && (
        <span
          className={cn(
            "text-xl font-extrabold tracking-tight text-foreground",
            wordmarkClassName,
          )}
        >
          {env.appName}
        </span>
      )}
    </span>
  );
}

export { LogoMark };
