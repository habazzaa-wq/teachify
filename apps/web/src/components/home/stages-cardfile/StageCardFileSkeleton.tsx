import { cn } from "@/lib/cn";

function Shimmer({ className, tint = "primary" }: { className?: string; tint?: "primary" | "secondary" }) {
  const stop = tint === "primary" ? "var(--brand-primary-100)" : "var(--brand-secondary-100)";
  return (
    <div
      aria-hidden="true"
      className={cn("animate-brand-shimmer bg-[length:200%_100%]", className)}
      style={{
        backgroundImage: `linear-gradient(110deg, transparent 32%, color-mix(in srgb, ${stop} 42%, transparent) 50%, transparent 68%)`,
      }}
    />
  );
}

/**
 * Loading placeholder that mirrors the card-file geometry (tab rail + opened
 * card: matted photo window, stamped rule, body lines) so swapping in real
 * content causes zero layout shift.
 */
export function StageCardFileSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="w-full">
      {/* tab rail */}
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <Shimmer key={i} className="h-11 w-24 rounded-t-md sm:w-28" />
        ))}
      </div>

      {/* opened card */}
      <div className="mt-6 flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card/70 shadow-soft-xs sm:mt-8 lg:flex-row">
        <div className="shrink-0 p-2.5 sm:p-3 lg:w-[46%]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted sm:aspect-[16/9] lg:aspect-auto lg:h-full">
            <Shimmer className="absolute inset-0" tint="secondary" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3 p-5 pt-1 sm:p-7 sm:pt-2 lg:p-10">
          <Shimmer className="h-4 w-24 rounded-full" tint="secondary" />
          <Shimmer className="h-8 w-3/5 rounded-lg sm:h-9" />
          <Shimmer className="h-0.5 w-14 rounded-full" tint="secondary" />
          <Shimmer className="h-3.5 w-full rounded-full" />
          <Shimmer className="h-3.5 w-4/6 rounded-full" />
          <Shimmer className="mt-1 h-4 w-36 rounded-full" tint="secondary" />
        </div>
      </div>
    </div>
  );
}