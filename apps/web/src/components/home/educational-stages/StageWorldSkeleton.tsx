import { cn } from "@/lib/cn";
import type { StageVariant } from "./types";

function Shimmer({
  className,
  tint = "primary",
}: {
  className?: string;
  tint?: "primary" | "secondary";
}) {
  const stop = tint === "primary" ? "var(--brand-primary-100)" : "var(--brand-secondary-100)";
  return (
    <span
      aria-hidden="true"
      className={cn("animate-brand-shimmer block bg-[length:200%_100%]", className)}
      style={{
        backgroundImage: `linear-gradient(110deg, transparent 32%, color-mix(in srgb, ${stop} 42%, transparent) 50%, transparent 68%)`,
      }}
    />
  );
}

/**
 * Loading placeholder that mirrors `StageWorld` geometry (rounded world-card,
 * arch media block, meta pill + name + stamped rule + body lines, metric row,
 * CTA) so real content swaps in with zero layout shift — at the same bento cell
 * height as the live card.
 */
export function StageWorldSkeleton({ variant = "standard" }: { variant?: StageVariant }) {
  const isHero = variant === "hero";
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/70 shadow-soft-md"
    >
      <div className="relative overflow-hidden">
        <div className={cn("m-2.5 overflow-hidden bg-muted", isHero ? "h-56 lg:h-64" : "h-40 sm:h-44 lg:h-48")}>
          <Shimmer className="absolute inset-0" tint="secondary" />
          <span className="absolute end-3 top-3 h-10 w-10 rounded-full bg-muted/70" />
          <span className="absolute start-3 top-3 h-10 w-10 rounded-xl bg-muted/70" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4 sm:p-6">
        <Shimmer className="h-5 w-20 rounded-full" tint="secondary" />
        <Shimmer className="mt-3 h-7 w-3/4 rounded-lg" />
        <Shimmer className="mt-2.5 h-0.5 w-12 rounded-full" tint="secondary" />
        <Shimmer className="mt-4 h-3.5 w-full rounded-full" />
        <Shimmer className="mt-2 h-3.5 w-2/3 rounded-full" />
        <div className="mt-auto flex items-center gap-4 pt-6">
          <Shimmer className="h-5 w-16 rounded-full" tint="secondary" />
          <Shimmer className="h-5 w-16 rounded-full" tint="secondary" />
        </div>
      </div>
      <div className="flex h-[3.1rem] items-center justify-between border-t border-border/60 px-6">
        <Shimmer className="h-4 w-28 rounded-full" tint="secondary" />
        <Shimmer className="h-8 w-8 rounded-full" tint="secondary" />
      </div>
    </div>
  );
}
