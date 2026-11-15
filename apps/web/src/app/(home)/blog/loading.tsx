import { BookOpen } from "lucide-react";

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-background pb-12 text-foreground" dir="rtl" aria-busy="true">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border/70 py-8 sm:py-10">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-9 w-3/4 max-w-xl animate-pulse rounded bg-muted sm:h-11" />
          <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-2/3 max-w-lg animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-col gap-4 border-b border-border/70 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {[1, 2, 3].map((item) => <div key={item} className="h-9 w-24 animate-pulse rounded-full bg-muted" />)}
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-muted sm:w-72" />
        </div>
        <div className="py-7">
          <div className="grid overflow-hidden rounded-2xl border border-border/70 bg-card md:grid-cols-2">
            <div className="aspect-[16/9] animate-pulse bg-muted" />
            <div className="space-y-4 p-6 sm:p-8">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-7 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="flex items-center gap-3 pt-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
          <div className="mb-5 mt-8 flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <BookOpen className="h-4 w-4 animate-pulse text-[var(--brand-primary)]" />
            جارٍ تحميل المقالات
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                <div className="aspect-[16/9] animate-pulse bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
