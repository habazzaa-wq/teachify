import { cn } from "@/lib/cn";

/** Loading placeholder that mirrors the StageCard shape with a brand-tinted
 *  shimmer sweep (no flat grey bars). */
export function StageCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft-md",
        className,
      )}
      aria-hidden="true"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <div
          className="absolute inset-0 animate-brand-shimmer bg-[length:200%_100%]"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--brand-primary-200) 35%, transparent) 50%, transparent 70%)",
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div
          className="h-6 w-2/3 animate-brand-shimmer rounded-full bg-[length:200%_100%]"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--brand-primary-100) 40%, transparent) 50%, transparent 70%)",
          }}
        />
        <div
          className="h-3 w-full animate-brand-shimmer rounded-full bg-[length:200%_100%]"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--brand-secondary-100) 40%, transparent) 50%, transparent 70%)",
          }}
        />
        <div
          className="h-3 w-5/6 animate-brand-shimmer rounded-full bg-[length:200%_100%]"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--brand-secondary-100) 40%, transparent) 50%, transparent 70%)",
          }}
        />
        <div className="mt-auto pt-3">
          <div
            className="inline-flex h-9 w-36 animate-brand-shimmer rounded-full bg-[length:200%_100%]"
            style={{
              backgroundImage:
                "linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--brand-primary-100) 40%, transparent) 50%, transparent 70%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
