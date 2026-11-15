"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BookOpen, Check, Copy, Facebook, Link2, Linkedin, Share2, UserRound } from "lucide-react";
import type { ArticleHeading } from "./article-headings";

type Props = {
  headings: ArticleHeading[];
  title: string;
  author: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
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

export function BlogArticleEngagement({ headings, title, author, publishedAt, updatedAt }: Props) {
  const [activeHeading, setActiveHeading] = useState(headings[0]?.id ?? "");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const shareUrl = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, getServerLocationSnapshot);

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
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm" aria-labelledby="author-card-heading">
        <p id="author-card-heading" className="text-xs font-extrabold text-muted-foreground">عن الكاتب</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-sm font-black text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/15">
            {author ? initials(author) : <UserRound className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{author ?? "فريق التحرير"}</p>
            <p className="mt-1 text-xs text-muted-foreground">كاتب في مدونة المنصة</p>
          </div>
        </div>
        {updatedAt && publishedAt && updatedAt !== publishedAt && (
          <p className="mt-4 border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
            آخر تحديث: {new Date(updatedAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm" aria-labelledby="share-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="share-heading" className="text-sm font-extrabold">شارك المقال</h2>
          <Share2 className="h-4 w-4 text-[var(--brand-primary)]" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="مشاركة على فيسبوك"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="مشاركة على لينكدإن"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="مشاركة عبر واتساب"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
          >
            <Link2 className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => void copyLink()}
            aria-label="نسخ رابط المقال"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
          >
            {copyState === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p aria-live="polite" className="mt-2 min-h-4 text-xs text-muted-foreground">
          {copyState === "copied" ? "تم نسخ الرابط." : copyState === "failed" ? "تعذر نسخ الرابط؛ انسخه من شريط العنوان." : ""}
        </p>
      </section>

      {headings.length > 0 && (
        <nav className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm" aria-label="محتويات المقال">
          <details className="group lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold">
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-[var(--brand-primary)]" />في هذا المقال</span>
              <span className="text-xs text-muted-foreground group-open:rotate-180">⌄</span>
            </summary>
            <div className="mt-4 border-t border-border/70 pt-2">{renderHeadingLinks(headings, activeHeading)}</div>
          </details>
          <div className="hidden lg:block">
            <h2 className="flex items-center gap-2 text-sm font-extrabold"><BookOpen className="h-4 w-4 text-[var(--brand-primary)]" />في هذا المقال</h2>
            <div className="mt-3 border-t border-border/70 pt-2">{renderHeadingLinks(headings, activeHeading)}</div>
          </div>
        </nav>
      )}
    </aside>
  );
}

function renderHeadingLinks(headings: ArticleHeading[], activeHeading: string) {
  return (
    <ol className="space-y-1">
      {headings.map((heading) => (
        <li key={heading.id} className={heading.level === 3 ? "pr-3" : ""}>
          <a
            href={`#${encodeURIComponent(heading.id)}`}
            aria-current={activeHeading === heading.id ? "location" : undefined}
            className={`block rounded-lg px-2.5 py-2 text-xs leading-5 transition-colors ${
              activeHeading === heading.id
                ? "bg-[var(--brand-primary)]/10 font-bold text-[var(--brand-primary)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
