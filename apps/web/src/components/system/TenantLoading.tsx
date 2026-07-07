"use client";

export function TenantLoading() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6"
    >
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
        <div className="absolute h-20 w-20 animate-spin rounded-full border-2 border-t-transparent border-muted-foreground/20" />
      </div>
      <div className="space-y-2 text-center">
        <div className="mx-auto h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
