import { cn } from "@/lib/cn";

/** Shimmer block reused for image areas, lines and buttons. */
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

/** Line skeletons for a body block, matching real text sizing/gaps. */
function BodyLines({ nameClass }: { nameClass: string }) {
  return (
    <>
      <Shimmer className={cn("h-4 w-24 rounded-full", nameClass)} tint="secondary" />
      <Shimmer className={cn("h-8 rounded-xl", nameClass)} />
      <Shimmer className="h-3.5 w-11/12 rounded-full" />
      <Shimmer className="h-3.5 w-3/4 rounded-full" />
    </>
  );
}

interface StageCardSkeletonProps {
  variant: "featured" | "regular";
  className?: string;
}

/**
 * Loading placeholder that mirrors `StageCard` geometry exactly (same aspect
 * ratios, paddings, grid structure) so swapping in real cards causes zero
 * layout shift.
 */
export function StageCardSkeleton({ variant, className }: StageCardSkeletonProps) {
  const featured = variant === "featured";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-soft-xs",
        className,
      )}
    >
      {featured ? (
        /* mirrored featured hero geometry */
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted sm:aspect-[16/9] md:aspect-auto md:h-full">
            <Shimmer className="absolute inset-0" tint="secondary" />
          </div>
          <div className="flex flex-col gap-4 p-6 sm:p-8 lg:p-10">
            <Shimmer className="h-5 w-32 rounded-full" tint="secondary" />
            <Shimmer className="h-9 w-2/3 rounded-xl" tint="primary" />
            <Shimmer className="h-3.5 w-full rounded-full" />
            <Shimmer className="h-3.5 w-5/6 rounded-full" />
            <Shimmer className="h-3.5 w-4/6 rounded-full" />
            <div className="pt-1">
              <Shimmer className="h-11 w-32 rounded-full" tint="primary" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <Shimmer className="absolute inset-0" tint="secondary" />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <BodyLines nameClass="text-lg sm:text-xl" />
            <div className="mt-auto pt-2">
              <Shimmer className="h-11 w-full rounded-full" tint="primary" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}