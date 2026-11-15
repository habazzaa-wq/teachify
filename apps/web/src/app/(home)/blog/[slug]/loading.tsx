import { BookOpen } from "lucide-react";

export default function BlogArticleLoading() {
  return (
    <div className="min-h-screen bg-background pb-12 text-foreground" dir="rtl" aria-busy="true">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-muted pt-6" />
        <header className="mx-auto max-w-4xl pb-7 pt-8 sm:pt-10">
          <div className="h-7 w-32 animate-pulse rounded-full bg-muted" />
          <div className="mt-5 h-10 w-full animate-pulse rounded bg-muted sm:h-12" />
          <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-6 flex items-center gap-3 border-y border-border/70 py-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </header>
        <div className="mx-auto aspect-[16/8] max-h-[440px] max-w-4xl animate-pulse rounded-xl bg-muted sm:rounded-2xl" />
        <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="h-32 animate-pulse rounded-2xl border border-border/70 bg-muted/50" />
            <div className="h-40 animate-pulse rounded-2xl border border-border/70 bg-muted/50" />
          </aside>
          <div className="space-y-5">
            <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <BookOpen className="h-4 w-4 animate-pulse text-[var(--brand-primary)]" />
              جارٍ تحميل المقال
            </p>
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="space-y-3">
                <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
