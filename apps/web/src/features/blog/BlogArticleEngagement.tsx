"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BookOpen,
  Check,
  Clock3,
  Copy,
  Facebook,
  Link2,
  Linkedin,
  MessageCircle,
  Printer,
  Share2,
  UserRound,
} from "lucide-react";
import type { ArticleHeading } from "./article-headings";
import styles from "./blog-article.module.css";

type Props = {
  headings: ArticleHeading[];
  title: string;
  author: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  readingMinutes: number;
  category: string | null;
  siteName: string;
};

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getLocationSnapshot(): string {
  return window.location.href;
}

function getServerLocationSnapshot(): string {
  return "";
}

function initials(name: string | null): string {
  const words = (name ?? "كاتب المقال").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("");
}

function formatDate(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
}

export function BlogArticleEngagement({
  headings,
  title,
  author,
  publishedAt,
  updatedAt,
  readingMinutes,
  category,
  siteName,
}: Props) {
  const [activeHeading, setActiveHeading] = useState(headings[0]?.id ?? "");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const shareUrl = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getServerLocationSnapshot,
  );

  useEffect(() => {
    if (!headings.length || !("IntersectionObserver" in window)) return;
    const elements = headings
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
        if (visible) setActiveHeading(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const article = document.getElementById("article-content");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = rect.height - viewport * 0.35;
      const scrolled = Math.min(Math.max(-rect.top + viewport * 0.25, 0), Math.max(total, 1));
      setProgress(Math.min(100, Math.max(0, Math.round((scrolled / Math.max(total, 1)) * 100))));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2200);
    } catch {
      setCopyState("failed");
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <>
      {/* Reading progress rail */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] bg-transparent"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-l-full transition-[width] duration-150 ease-out"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
            boxShadow: "0 0 14px color-mix(in srgb, var(--brand-secondary) 60%, transparent)",
          }}
        />
      </div>

      <aside className="space-y-4">
        {/* Reading progress card */}
        <section
          className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm lg:block"
          aria-label="تقدم القراءة"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold">تقدم القراءة</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                {progress >= 100 ? "أتممت المقال — أحسنت!" : "أنت في رحلة عبر الأفكار"}
              </p>
            </div>
            <div
              className="relative h-14 w-14 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(var(--brand-primary) ${progress * 3.6}deg, hsl(var(--muted)) 0deg)`,
              }}
            >
              <div className="absolute inset-[3px] grid place-items-center rounded-full bg-card text-[11px] font-black tabular-nums">
                {progress}%
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-200 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-3 text-center">
            <div>
              <p className="text-sm font-black tabular-nums">{readingMinutes}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">دقائق قراءة</p>
            </div>
            <div className="border-r border-border/70">
              <p className="text-sm font-black tabular-nums">{headings.length.toLocaleString("ar-EG")}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">محاور</p>
            </div>
          </div>
        </section>

        {/* Table of contents */}
        {headings.length > 0 && (
          <nav
            className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
            aria-label="محتويات المقال"
          >
            <details className="group lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[var(--brand-primary)]" />
                  في هذا المقال
                </span>
                <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">
                  ⌄
                </span>
              </summary>
              <div className="mt-3 border-t border-border/70 pt-2">
                {renderHeadingLinks(headings, activeHeading)}
              </div>
            </details>
            <div className="hidden lg:block">
              <div className="flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-sm font-extrabold">
                  <BookOpen className="h-4 w-4 text-[var(--brand-primary)]" />
                  في هذا المقال
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {headings.length.toLocaleString("ar-EG")} محاور
                </span>
              </div>
              <div className="mt-3 border-t border-border/70 pt-2">
                {renderHeadingLinks(headings, activeHeading)}
              </div>
            </div>
          </nav>
        )}

        {/* Author */}
        <section
          className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          aria-labelledby="author-card-heading"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 18%, transparent), transparent 70%)",
            }}
          />
          <p id="author-card-heading" className="text-[11px] font-extrabold text-muted-foreground">
            عن الكاتب
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ring-2 ring-[var(--brand-primary)]/15"
              style={{
                background:
                  "linear-gradient(145deg, color-mix(in srgb, var(--brand-primary) 92%, black), color-mix(in srgb, var(--brand-secondary) 62%, black))",
              }}
            >
              {author ? initials(author) : <UserRound className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{author ?? "فريق التحرير"}</p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                كاتب في مدونة {siteName}
              </p>
            </div>
          </div>
          {publishedAt && (
            <div className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              نُشر في {formatDate(publishedAt)}
            </div>
          )}
          {updatedAt && publishedAt && updatedAt !== publishedAt && (
            <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
              آخر تحديث: {formatDate(updatedAt)}
            </p>
          )}
          {category && (
            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-primary)]/25 bg-[var(--brand-primary)]/[.07] px-2.5 py-1 text-[10px] font-bold ${styles.brandText}`}>
              <span className="h-1 w-1 rounded-full bg-current" />
              {category}
            </span>
          )}
        </section>

        {/* Share */}
        <section
          className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          aria-labelledby="share-heading"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="share-heading" className="text-sm font-extrabold">
              شارك المقال
            </h2>
            <Share2 className="h-4 w-4 text-[var(--brand-primary)]" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-2.5 py-2.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              <Facebook className="h-3.5 w-3.5" />
              فيسبوك
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-2.5 py-2.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              <Linkedin className="h-3.5 w-3.5" />
              لينكدإن
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-2.5 py-2.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              واتساب
            </a>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-2.5 py-2.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              {copyState === "copied" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copyState === "copied" ? "تم النسخ" : "نسخ الرابط"}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p aria-live="polite" className="min-h-4 text-[10px] text-muted-foreground">
              {copyState === "failed" ? "تعذر النسخ؛ انسخه من شريط العنوان." : ""}
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground transition-colors hover:text-[var(--brand-primary)]"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة
            </button>
          </div>
        </section>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden items-center justify-between gap-3 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/[.06] px-4 py-3 text-[11px] font-extrabold transition-colors hover:bg-[var(--brand-primary)]/10 lg:flex ${styles.brandText}`}
        >
          <span className="inline-flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5" />
            أرسل المقال لصديق
          </span>
          <span aria-hidden="true">↖</span>
        </a>
      </aside>
    </>
  );
}

function renderHeadingLinks(headings: ArticleHeading[], activeHeading: string) {
  return (
    <ol className="space-y-0.5">
      {headings.map((heading, index) => {
        const active = activeHeading === heading.id;
        return (
          <li key={heading.id} className={heading.level === 3 ? "pr-3" : ""}>
            <a
              href={`#${encodeURIComponent(heading.id)}`}
              aria-current={active ? "location" : undefined}
              className={`group flex items-start gap-2 rounded-lg px-2 py-1.5 text-[11px] leading-5 transition-colors ${
                active
                  ? `bg-[var(--brand-primary)]/[.08] font-bold ${styles.brandText}`
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 text-[9px] font-black tabular-nums ${
                  active ? styles.brandText : "text-muted-foreground"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">{heading.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
