import { cn } from "@/lib/cn";

function Shimmer({ className, tint = "primary" }: { className?: string; tint?: "primary" | "secondary" }) {
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
 * Loading placeholder that mirrors `StageMilestone` geometry (image window,
 * stamped rule, body lines, metric pills) so swapping in real content causes
 * zero layout shift.
 */
export function StageMilestoneSkeleton() {
  return (
    <div aria-hidden="true" className="relative w-full">
      <article className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-soft-md sm:flex-row">
        <span className="absolute inset-x-0 top-0 h-1 bg-muted" />
        <div className="sm:[flex-basis:42%] sm:shrink-0">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted sm:h-full sm:aspect-auto">
            <Shimmer className="absolute inset-0" tint="secondary" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2.5 p-5 sm:p-7 lg:p-8">
          <Shimmer className="h-4 w-28 rounded-full" tint="secondary" />
          <Shimmer className="h-7 w-44 rounded-lg sm:h-8" />
          <Shimmer className="h-0.5 w-12 rounded-full" tint="secondary" />
          <Shimmer className="h-3.5 w-full rounded-full" />
          <Shimmer className="h-3.5 w-4/6 rounded-full" />
          <div className="mt-1 flex items-center gap-2">
            <Shimmer className="h-7 w-20 rounded-full" tint="secondary" />
            <Shimmer className="h-7 w-20 rounded-full" tint="secondary" />
          </div>
          <Shimmer className="mt-1 h-4 w-32 rounded-full" tint="secondary" />
        </div>
      </article>
    </div>
  );
}
