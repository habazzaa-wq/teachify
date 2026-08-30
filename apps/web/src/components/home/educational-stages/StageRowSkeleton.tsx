import { cn } from "@/lib/cn";

interface StageRowSkeletonProps {
  /** Global 0-based position — mirrors alternation the same way real rows do. */
  index: number;
}

/**
 * Loading placeholder that mirrors `StageRow` geometry exactly (same grid,
 * alternating sides, aspect ratios, paddings) so swapping in real rows causes
 * zero layout shift. A quiet reduced-opacity pulse — no spinner, same layout.
 */
export function StageRowSkeleton({ index }: StageRowSkeletonProps) {
  const isEven = index % 2 === 0;

  return (
    <div
      aria-hidden="true"
      className="relative grid w-full overflow-hidden opacity-60 lg:grid-cols-2 lg:min-h-[min(60vh,600px)]"
    >
      {/* image block — same aspect + side alternation as the real row */}
      <div
        className={cn(
          "relative aspect-[4/3] animate-pulse bg-[var(--paper)] sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[min(60vh,600px)]",
          !isEven && "lg:order-last",
        )}
      >
        <div className="absolute inset-0 bg-[var(--ink)]/10" />
      </div>

      {/* content block — same padding + tint alternation */}
      <div
        className={cn(
          "flex items-center px-6 py-8 sm:px-8 sm:py-10 lg:px-16 lg:py-12",
          isEven ? "bg-[var(--primary-tint)]" : "bg-[var(--secondary-tint)]",
        )}
      >
        <div className="w-full max-w-[55ch]">
          <div className="h-8 w-2/3 animate-pulse rounded bg-[var(--ink)]/15 sm:h-10 lg:h-12" />
          <div className="mt-3 h-3.5 w-1/3 animate-pulse rounded bg-[var(--ink)]/10" />
          <div className="mt-5 h-4 animate-pulse rounded bg-[var(--ink)]/10" />
          <div className="mt-2.5 h-4 w-5/6 animate-pulse rounded bg-[var(--ink)]/10" />
          <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-[var(--ink)]/10" />
          <div className="mt-8 h-5 w-32 animate-pulse rounded bg-[var(--ink)]/15" />
        </div>
      </div>
    </div>
  );
}
