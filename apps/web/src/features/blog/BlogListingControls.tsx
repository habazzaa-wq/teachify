"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

type Props = {
  categories: string[];
  activeCategory: string;
  search: string;
  currentPage: number;
  lastPage: number;
  total: number;
};

function buildBlogUrl(page: number, search: string, category: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

export function BlogListingControls({
  categories,
  activeCategory,
  search,
  currentPage,
  lastPage,
  total,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const [isPending, startTransition] = useTransition();

  const navigate = (nextSearch: string, nextCategory: string) => {
    startTransition(() => {
      router.push(buildBlogUrl(1, nextSearch, nextCategory), { scroll: false });
    });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(searchValue.trim(), activeCategory);
  };

  return (
    <div aria-busy={isPending} className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2" aria-label="تصفية المقالات حسب التصنيف">
          <button
            type="button"
            aria-pressed={!activeCategory}
            onClick={() => navigate(search, "")}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
              !activeCategory
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)] shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)]"
            }`}
          >
            كل المقالات
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              onClick={() => navigate(search, activeCategory === category ? "" : category)}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                activeCategory === category
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)] shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <form onSubmit={submitSearch} role="search" className="flex w-full shrink-0 items-center gap-2 rounded-xl border border-border/80 bg-card p-1.5 shadow-sm sm:w-[min(100%,19rem)]">
          <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
          <input
            type="search"
            name="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="ابحث في المقالات..."
            aria-label="ابحث في المقالات"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                navigate("", activeCategory);
              }}
              aria-label="مسح البحث"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-bold text-[var(--brand-primary-contrast)] transition-opacity hover:opacity-90 disabled:opacity-60">
            بحث
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p aria-live="polite">
          {isPending ? "جارٍ تحديث النتائج..." : `عرض ${total} مقال${activeCategory ? ` في «${activeCategory}»` : ""}`}
          {search && !isPending ? ` عن «${search}»` : ""}
        </p>
        {lastPage > 1 && (
          <nav aria-label="صفحات المقالات" className="flex items-center gap-1">
            {currentPage > 1 ? (
              <Link
                href={buildBlogUrl(currentPage - 1, search, activeCategory)}
                scroll={false}
                aria-label="الصفحة السابقة"
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-2.5 font-bold transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="hidden sm:inline">السابق</span>
              </Link>
            ) : (
              <span aria-disabled="true" className="inline-flex h-9 items-center gap-1 rounded-lg border border-border/60 px-2.5 opacity-40">
                <ChevronRight className="h-4 w-4" />
                <span className="hidden sm:inline">السابق</span>
              </span>
            )}
            <span className="px-2 font-bold text-foreground" aria-current="page">{currentPage} / {lastPage}</span>
            {currentPage < lastPage ? (
              <Link
                href={buildBlogUrl(currentPage + 1, search, activeCategory)}
                scroll={false}
                aria-label="الصفحة التالية"
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-2.5 font-bold transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              >
                <span className="hidden sm:inline">التالي</span>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span aria-disabled="true" className="inline-flex h-9 items-center gap-1 rounded-lg border border-border/60 px-2.5 opacity-40">
                <span className="hidden sm:inline">التالي</span>
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
          </nav>
        )}
      </div>

      {(search || activeCategory) && (
        <Link href={pathname} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-primary)] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          إزالة كل عوامل التصفية
        </Link>
      )}
    </div>
  );
}
