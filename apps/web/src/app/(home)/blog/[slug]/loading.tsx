import { BookOpen } from "lucide-react";

export default function BlogArticleLoading() {
  return (
    <div className="min-h-screen bg-background pb-12 text-foreground sm:pb-16" dir="rtl" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 pt-5 sm:pt-7">
          <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-3 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-14 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.75rem] bg-[#0a1120] sm:mt-6 sm:rounded-[2.25rem]">
          <div className="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[1.06fr_.94fr] lg:p-12">
            <div className="order-2 space-y-4 lg:order-1">
              <div className="flex gap-2">
                <div className="h-6 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="space-y-3">
                <div className="h-9 w-full animate-pulse rounded bg-white/10" />
                <div className="h-9 w-4/5 animate-pulse rounded bg-white/10" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3.5 w-full animate-pulse rounded bg-white/[.07]" />
                <div className="h-3.5 w-11/12 animate-pulse rounded bg-white/[.07]" />
              </div>
              <div className="flex items-center gap-3 pt-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-2.5 w-16 animate-pulse rounded bg-white/[.07]" />
                </div>
              </div>
            </div>
            <div className="order-1 flex justify-center lg:order-2">
              <div className="h-[220px] w-[70%] max-w-[320px] animate-pulse rounded-[1.5rem] bg-white/10 sm:h-[280px]" />
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 px-5 py-3.5 sm:px-8 lg:px-12">
            <div className="h-2.5 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-white/10" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/60 sm:mt-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-2.5 bg-card px-3.5 py-3">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-14 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card sm:rounded-[2rem]">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/25 px-5 py-3.5 sm:px-8">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-40 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="space-y-4 px-5 py-7 sm:px-9 sm:py-9 lg:px-11 lg:py-11">
                <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <BookOpen className="h-4 w-4 animate-pulse text-[var(--brand-primary)]" />
                  جارٍ تحميل المقال
                </p>
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="space-y-3">
                    {item % 2 === 0 && <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />}
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-2xl border border-border/70 bg-muted/50" />
            <div className="h-40 animate-pulse rounded-2xl border border-border/70 bg-muted/50" />
            <div className="h-28 animate-pulse rounded-2xl border border-border/70 bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
