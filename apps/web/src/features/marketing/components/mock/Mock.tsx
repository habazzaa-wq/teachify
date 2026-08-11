import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "coral" | "gold" | "blue" | "green" | "violet" | "red" | "ink";

/**
 * Tiny presentational atoms used to build the product mockups. Static,
 * deterministic markup — no state, no network.
 */

export function MockAvatar({
  initials,
  tone = "coral",
  size = 28,
  className,
}: {
  initials: string;
  tone?: Tone;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("mk-avatar", `mk-avatar-${tone}`, className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function MockAvatarRow({
  items,
  size = 24,
  className,
}: {
  items: { initials: string; tone: Tone }[];
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center -space-x-1.5 rtl:space-x-reverse", className)}>
      {items.map((item, i) => (
        <MockAvatar key={i} initials={item.initials} tone={item.tone} size={size} />
      ))}
    </span>
  );
}

export function MockBar({
  value,
  tone = "coral",
  className,
}: {
  value: number;
  tone?: "coral" | "gold" | "blue" | "ok";
  className?: string;
}) {
  return (
    <span className={cn("mk-bar block w-full", className)}>
      <span
        className={cn("mk-bar-fill block", `mk-bar-fill-${tone}`)}
        style={{ width: `${value}%` }}
      />
    </span>
  );
}

export function MockPill({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone?: "coral" | "gold" | "ok";
  className?: string;
}) {
  return <span className={cn("mk-pill", tone && `mk-pill-${tone}`, className)}>{children}</span>;
}

export function MockIconTile({
  icon: Icon,
  tone = "coral",
  size = 36,
  className,
}: {
  icon: ReactNode;
  tone?: Tone;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("mk-icon-tile", `mk-icon-tile-${tone}`, className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {Icon}
    </span>
  );
}

export function MockLine({
  width,
  tone = "line",
  height = 8,
  className,
}: {
  width: string;
  tone?: "line" | "muted";
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("block rounded-full", className)}
      style={{
        width,
        height,
        background:
          tone === "line"
            ? "hsl(var(--mk-line-strong) / 0.55)"
            : "hsl(var(--mk-muted) / 0.35)",
      }}
    />
  );
}

export function MiniDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("mk-tag-dot", className)}
      style={{ background: color }}
      aria-hidden="true"
    />
  );
}

export function AppSidebar({
  items,
  activeIndex = 0,
  className,
  compact = false,
}: {
  items: { icon: ReactNode; label: string }[];
  activeIndex?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-2.5 rounded-lg",
            i === activeIndex
              ? "bg-[hsl(var(--mk-primary-soft))] font-bold text-[hsl(var(--mk-primary-deep))]"
              : "text-[hsl(var(--mk-muted))]",
          )}
          style={{
            padding: compact ? "0.3rem 0.5rem" : "0.42rem 0.6rem",
            fontSize: compact ? "0.68rem" : "0.75rem",
          }}
        >
          <span
            className="shrink-0"
            style={{ width: compact ? 12 : 15, height: compact ? 12 : 15 }}
          >
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
          {i === activeIndex && (
            <span
              className="ms-auto h-1.5 w-1.5 rounded-full"
              style={{ background: "hsl(var(--mk-primary))" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function StatRow({
  items,
  className,
}: {
  items: { value: string; label: string; tone?: Tone }[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-line))]", className)}>
      {items.map((item, i) => (
        <div key={i} className="bg-[hsl(var(--mk-surface))] px-3 py-2.5">
          <div
            className="text-lg font-extrabold leading-none"
            style={{ color: item.tone ? `hsl(var(--mk-${item.tone}))` : "hsl(var(--mk-ink))" }}
          >
            {item.value}
          </div>
          <div className="mt-1 text-[0.62rem] font-medium text-[hsl(var(--mk-muted))]">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/** CSS-variable driven spacer to keep chart alignment simple. */
export function vh(value: string): CSSProperties {
  return { height: value } as CSSProperties;
}
