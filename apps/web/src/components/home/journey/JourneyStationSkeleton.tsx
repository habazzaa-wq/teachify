import { cn } from "@/lib/cn";
import { anchorPercent } from "./geometry";
import type { JourneyFlow, JourneyStationAnchor } from "./types";

interface JourneyStationSkeletonProps {
  flow: JourneyFlow;
  anchor: JourneyStationAnchor;
  size: { width: number; height: number };
}

/** Shimmer block reused for the label lines. */
function ShimmerLine({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-brand-shimmer rounded-full bg-[length:200%_100%]", className)}
      style={{
        backgroundImage:
          "linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--brand-primary-100) 40%, transparent) 50%, transparent 70%)",
      }}
    />
  );
}

/**
 * Loading placeholder that mirrors the exact journey-station geometry (same
 * anchor %, same above/below label slot, same node size) so swapping in the
 * real stations later causes zero layout shift.
 */
export function JourneyStationSkeleton({ flow, anchor, size }: JourneyStationSkeletonProps) {
  const vertical = flow === "vertical";
  const labelAbove = !vertical && anchor.row === -1;
  const pct = anchorPercent(anchor, size);

  return (
    <li
      aria-hidden="true"
      className="absolute z-0"
      style={{ left: pct.left, top: pct.top }}
    >
      <div className="relative h-0 w-0">
        {/* label slot */}
        <div
          className={cn(
            "absolute w-40 md:w-44",
            labelAbove ? "bottom-[54px] md:bottom-[62px]" : "top-[54px] md:top-[62px]",
          )}
          style={{ left: 0, transform: "translateX(-50%)" }}
        >
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card/70 px-3 py-2.5">
            <ShimmerLine className="h-3.5 w-2/3" />
            <ShimmerLine className="h-2.5 w-1/2 opacity-70" />
            <ShimmerLine className="h-2.5 w-5/6 opacity-50" />
          </div>
        </div>

        {/* node */}
        <div className="absolute left-0 top-0 h-20 w-20 -translate-x-1/2 -translate-y-1/2 md:h-24 md:w-24">
          <div className="absolute -inset-1.5 rounded-full border-2 border-border/70" />
          <div className="relative h-full w-full overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-0 animate-brand-shimmer bg-[length:200%_100%]"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--brand-secondary-100) 35%, transparent) 50%, transparent 70%)",
              }}
            />
            {/* badge */}
            <div className="absolute -start-3 -top-3 h-9 w-9 animate-brand-shimmer rounded-xl bg-[length:200%_100%] md:h-10 md:w-10" />
          </div>
        </div>
      </div>
    </li>
  );
}