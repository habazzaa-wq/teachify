"use client";

import type { CommunityDesignId } from "../types";

/** Compact, non-interactive visual thumbnail for each design in the picker. */
function Dot({ c }: { c: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />;
}

export function DesignMiniPreview({ id }: { id: CommunityDesignId }) {
  const base =
    "relative h-28 w-full overflow-hidden rounded-xl border border-border bg-muted/40";

  if (id === "classic") {
    return (
      <div className={base}>
        <div className="absolute inset-0 bg-gradient-to-br from-white to-amber-50 dark:from-zinc-800 dark:to-zinc-900" />
        <div className="relative p-3">
          <span className="inline-block rounded-full bg-[var(--brand-secondary)] px-2 py-0.5 text-[8px] font-bold text-[var(--brand-secondary-contrast)]">
            المنتدى
          </span>
          <div className="mt-2 h-2 w-24 rounded bg-[var(--brand-primary)]" />
          <div className="mt-1 h-2 w-16 rounded bg-[var(--brand-secondary)]" />
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <div className="h-6 rounded bg-white/70 dark:bg-white/10" />
            <div className="h-6 rounded bg-white/70 dark:bg-white/10" />
            <div className="h-6 rounded bg-white/70 dark:bg-white/10" />
            <div className="h-6 rounded bg-white/70 dark:bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (id === "gradient") {
    return (
      <div className={base}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
          }}
        />
        <div className="relative flex h-full flex-col justify-center gap-2 p-3">
          <div className="h-2.5 w-20 rounded bg-white/90" />
          <div className="h-2.5 w-14 rounded bg-white/70" />
          <div className="mt-1 flex gap-1.5">
            <div className="h-6 w-6 rounded-lg bg-white/25" />
            <div className="h-6 w-6 rounded-lg bg-white/25" />
            <div className="h-6 w-6 rounded-lg bg-white/25" />
            <div className="h-6 w-6 rounded-lg bg-white/25" />
          </div>
        </div>
      </div>
    );
  }

  if (id === "spotlight") {
    return (
      <div className={base}>
        <div className="absolute inset-0 flex">
          <div
            className="w-2/5"
            style={{
              background:
                "linear-gradient(160deg, var(--brand-primary), var(--brand-secondary))",
            }}
          />
          <div className="flex flex-1 flex-col justify-center gap-1.5 bg-zinc-900 p-3">
            <div className="h-2 w-16 rounded bg-white/80" />
            <div className="h-2 w-10 rounded bg-white/50" />
            <div className="mt-1 flex flex-col gap-1">
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="h-3 w-5/6 rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === "bento") {
    return (
      <div className={base}>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900" />
        <div className="relative grid h-full grid-cols-3 grid-rows-2 gap-1.5 p-2">
          <div className="col-span-2 row-span-1 rounded-lg bg-white/80 shadow dark:bg-white/10" />
          <div className="rounded-lg bg-white/80 shadow dark:bg-white/10" />
          <div className="rounded-lg bg-white/80 shadow dark:bg-white/10" />
          <div className="col-span-2 row-span-1 rounded-lg bg-white/80 shadow dark:bg-white/10" />
        </div>
      </div>
    );
  }

  // minimal
  return (
    <div className={base}>
      <div className="absolute inset-0 bg-white dark:bg-zinc-900" />
      <div className="relative flex h-full flex-col items-center justify-center gap-2">
        <span className="rounded-full border border-[var(--brand-secondary)] px-2 py-0.5 text-[8px] font-bold text-[var(--brand-secondary)]">
          المنتدى
        </span>
        <div className="h-2 w-20 rounded bg-[var(--brand-primary)]" />
        <div className="flex gap-1.5">
          <Dot c="var(--brand-primary)" />
          <Dot c="var(--brand-secondary)" />
          <Dot c="var(--brand-primary)" />
          <Dot c="var(--brand-secondary)" />
        </div>
        <div className="absolute bottom-1.5 left-0 right-0 h-3 border-y border-border/50 bg-black/5 dark:bg-white/5" />
      </div>
    </div>
  );
}
