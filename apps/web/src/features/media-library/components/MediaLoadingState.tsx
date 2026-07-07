"use client";

function MediaLoadingState() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border bg-card p-0"
        >
          <div className="aspect-video rounded-t-xl bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2 w-1/2 rounded bg-muted" />
            <div className="h-2 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { MediaLoadingState };
