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
    <div aria-busy={isPending} className="space-y-3">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="تصفية المقالات حسب التصنيف">
          <button
            type="button"
            aria-pressed={!activeCategory}
            onClick={() => navigate(search, "")}
            className={`rounded-md border px-2.5 py-1.5 text-[10px] font-extrabold transition-colors ${
              !activeCategory
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)]"
                : "border-border bg-background text-muted-foreground hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={activeCategory === cat}
              onClick={() => navigate(search, activeCategory === cat ? "" : cat)}
              className={`rounded-md border px-2.5 py-1.5 text-[10px] font-extrabold transition-colors ${
                activeCategory === cat
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)]"
                  : "border-border bg-background text-muted-foreground hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={submitSearch} role="search" className="flex w-full shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-background p-1 lg:w-[min(100%,18rem)]">
          <Search className="mr-1.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
          <input
            type="search"
            name="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="ابحث في المقالات..."
            aria-label="ابحث في المقالات"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[12px] outline-none placeholder:text-muted-foreground/70"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                navigate("", activeCategory);
              }}
              aria-label="مسح البحث"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[var(--brand-primary)] px-2.5 py-1.5 text-[10px] font-extrabold text-[var(--brand-primary-contrast)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            بحث
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <p aria-live="polite">
          {isPending ? "جارٍ تحديث النتائج..." : `${total.toLocaleString("ar-EG")} مقال${activeCategory ? ` · «${activeCategory}»` : ""}`}
          {search && !isPending ? ` · بحث: «${search}»` : ""}
        </p>
        {lastPage > 1 && (
          <nav aria-label="صفحات المقالات" className="flex items-center gap-1">
            {currentPage > 1 ? (
              <Link
                href={buildBlogUrl(currentPage - 1, search, activeCategory)}
                scroll={false}
                aria-label="الصفحة السابقة"
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 font-bold transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">السابق</span>
              </Link>
            ) : (
              <span aria-disabled="true" className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 px-2 opacity-40">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">السابق</span>
              </span>
            )}
            <span
              className="inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 font-extrabold text-[var(--brand-primary-contrast)]"
              style={{ background: "var(--brand-primary)" }}
              aria-current="page"
            >
              {currentPage}
            </span>
            <span className="px-0.5 font-bold text-muted-foreground">/ {lastPage}</span>
            {currentPage < lastPage ? (
              <Link
                href={buildBlogUrl(currentPage + 1, search, activeCategory)}
                scroll={false}
                aria-label="الصفحة التالية"
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 font-bold transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              >
                <span className="hidden sm:inline">التالي</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span aria-disabled="true" className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 px-2 opacity-40">
                <span className="hidden sm:inline">التالي</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </span>
            )}
          </nav>
        )}
      </div>

      {(search || activeCategory) && (
        <Link href={pathname} className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand-primary)] hover:underline">
          <ArrowLeft className="h-3 w-3" />
          إزالة كل عوامل التصفية
        </Link>
      )}
    </div>
  );
}
