"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Command, Flame, Loader2, Search, X } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { catalogService } from "../services";
import type { CatalogCourse } from "../types";
import { ACCENT, PRIMARY } from "../constants";

const SEARCH_DEBOUNCE_MS = 350;
const RESULT_LIMIT = 8;

interface CourseSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseSearchDialog({ open, onOpenChange }: CourseSearchDialogProps) {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === "dark";

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const viewAllRef = useRef<HTMLAnchorElement>(null);

  // Reset the dialog state whenever it opens (render-time state adjustment).
  const [wasOpen, setWasOpen] = useState(open);
  if (open && !wasOpen) {
    setWasOpen(true);
    setQuery("");
    setDebounced("");
    setSelectedIndex(0);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  // Focus the input shortly after the dialog opens.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Debounce the typed query before it hits the API, and reset the selection.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(query.trim());
      setSelectedIndex(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  const searching = debounced.length >= 2;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["course-search", searching ? debounced : "popular"],
    queryFn: () =>
      catalogService.getCourses(
        searching ? { search: debounced } : { sort: "popular" },
        1,
      ),
    placeholderData: keepPreviousData,
    enabled: open,
  });

  const results = useMemo(() => (data?.data ?? []).slice(0, RESULT_LIMIT), [data]);
  const total = data?.total ?? 0;

  const close = () => onOpenChange(false);

  // Keep the highlighted row in view while navigating with the arrow keys.
  useEffect(() => {
    const el = rowRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Lock body scroll while the dialog is open + Esc fallback.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[selectedIndex];
      if (target) {
        rowRefs.current[selectedIndex]?.click();
      } else {
        viewAllRef.current?.click();
      }
    }
  };

  const renderPrice = (course: CatalogCourse) => {
    const isFree = course.pricingType === "free";
    const currency = course.currency ?? "ر.س";
    if (isFree) {
      return (
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #22C55E, #16A34A)",
            boxShadow: "0 2px 10px rgba(34,197,94,0.35)",
          }}
        >
          مجاني
        </span>
      );
    }
    const price =
      course.discountPrice && course.discountPrice > 0 ? course.discountPrice : course.price;
    if (price) {
      return (
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}cc)`,
            boxShadow: `0 2px 10px ${PRIMARY}35`,
          }}
        >
          {formatNumber(price)} {currency}
        </span>
      );
    }
    return null;
  };

  if (!open) return null;

  const borderColor = isDark ? "rgba(255,255,255,0.08)" : `${PRIMARY}20`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[12vh]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="البحث في الكورسات"
        className="relative z-10 w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-3xl border bg-background shadow-2xl animate-scale-up"
        style={{
          borderColor,
          boxShadow: `0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px ${PRIMARY}12`,
        }}
      >
        {/* ── Search input ── */}
        <div
          className="flex items-center gap-3 border-b px-4"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `${PRIMARY}14`, color: PRIMARY }}
          >
            <Search className="h-[18px] w-[18px]" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="ابحث عن كورس أو مادة أو مدرّس…"
            aria-label="البحث في الكورسات"
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="مسح البحث"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd
              className="hidden shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] text-muted-foreground/60 sm:flex"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
            >
              <Command className="h-3 w-3" />
              K
            </kbd>
          )}
        </div>

        {/* ── Results header ── */}
        <div className="flex items-center justify-between px-3 pb-1 pt-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            {searching ? (
              <>
                <Search className="h-3.5 w-3.5" style={{ color: PRIMARY }} />
                نتائج «{debounced}» · {formatNumber(total)}
              </>
            ) : (
              <>
                <Flame className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                الأكثر رواجًا
              </>
            )}
          </p>
          {isFetching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />
          )}
        </div>

        {/* ── Results body ── */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-3 rounded-2xl px-3 py-2.5"
                >
                  <div
                    className="h-12 w-12 shrink-0 rounded-xl"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-3 w-2/3 rounded"
                      style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                    />
                    <div
                      className="h-2.5 w-1/3 rounded"
                      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${PRIMARY}12` }}
              >
                <Search className="h-5 w-5" style={{ color: `${PRIMARY}60` }} />
              </div>
              <p className="text-sm font-bold" style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}>
                لا توجد نتائج مطابقة
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                جرّب كلمة أخرى أو تصفح جميع الكورسات
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((course, index) => {
                const selected = index === selectedIndex;
                const meta = [
                  course.instructor?.name,
                  course.subject?.name,
                  course.educationalStage?.name,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <Link
                    key={course.id}
                    ref={(el) => {
                      rowRefs.current[index] = el;
                    }}
                    href={`/courses/${course.slug}`}
                    onClick={close}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                      !selected && "hover:bg-accent/60",
                    )}
                    style={selected ? { background: isDark ? `${PRIMARY}26` : `${PRIMARY}10` } : undefined}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      {course.thumbnail || course.coverImage ? (
                        <Image
                          src={course.thumbnail || course.coverImage!}
                          alt={course.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${PRIMARY}22, ${ACCENT}0f)`,
                          }}
                        >
                          <BookOpen className="h-5 w-5" style={{ color: `${PRIMARY}55` }} />
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-sm font-bold"
                        style={{ color: isDark ? "#F0ECE6" : "#1a1510" }}
                      >
                        {course.title}
                      </span>
                      {meta && (
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {meta}
                        </span>
                      )}
                    </span>
                    {renderPrice(course)}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between gap-3 border-t px-4 py-3"
          style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }}
        >
          <div className="hidden items-center gap-3 text-[10px] text-muted-foreground/60 sm:flex">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted/50 px-1 py-0.5 text-[9px]">↑↓</kbd>
              تنقّل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted/50 px-1 py-0.5 text-[9px]">↵</kbd>
              فتح
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted/50 px-1 py-0.5 text-[9px]">esc</kbd>
              إغلاق
            </span>
          </div>

          <Link
            ref={viewAllRef}
            href={searching ? `/courses?search=${encodeURIComponent(debounced)}` : "/courses"}
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}cc)`,
              boxShadow: `0 4px 16px ${PRIMARY}40`,
            }}
          >
            {searching ? "عرض جميع النتائج" : "تصفح جميع الكورسات"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
