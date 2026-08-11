"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Menu, X, Moon, Sun, ArrowLeft, GraduationCap } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { NAV_LINKS, SITE_NAME } from "@/features/marketing/data/content";
import { cn } from "@/lib/cn";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToHash(hash: string) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-xl"
      style={{
        width: size,
        height: size,
        background: "hsl(var(--mk-primary))",
        boxShadow: "0 8px 22px -8px hsl(var(--mk-primary) / 0.6)",
      }}
      aria-hidden="true"
    >
      <GraduationCap className="h-[52%] w-[52%] text-white" strokeWidth={2.4} />
      <span
        className="absolute bottom-0 end-0 h-[38%] w-[38%] rounded-tl-lg"
        style={{ background: "hsl(var(--mk-gold))" }}
      />
    </span>
  );
}

function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
      className="grid h-9 w-9 place-items-center rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] text-[hsl(var(--mk-ink-soft))] transition-colors hover:border-[hsl(var(--mk-primary)/0.5)] hover:text-[hsl(var(--mk-primary-deep))]"
    >
      {theme === "light" ? <Moon className="h-[17px] w-[17px]" /> : <Sun className="h-[17px] w-[17px]" />}
    </button>
  );
}

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
      const target = hash.replace("#", "");
      if (document.getElementById(target)) {
        e.preventDefault();
        setMenuOpen(false);
        scrollToHash(hash);
      }
    },
    [],
  );

  return (
    <header className={cn("mk-nav", scrolled && "mk-nav-scrolled")}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5" aria-label={SITE_NAME}>
            <LogoMark />
            <span className="text-lg font-extrabold tracking-tight" style={{ color: "hsl(var(--mk-ink))" }}>
              {SITE_NAME}
            </span>
            <span className="hidden text-[0.65rem] font-bold uppercase tracking-widest text-[hsl(var(--mk-muted))] sm:inline">
              Platform
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="القائمة الرئيسية">
          {NAV_LINKS.map((link) => (
            <a
              key={link.hash}
              href={`/${link.hash}`}
              onClick={(e) => handleNavClick(e, link.hash)}
              className="mk-nav-link"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/#cta"
            onClick={(e) => handleNavClick(e, "#cta")}
            className="mk-btn mk-btn-primary !px-4 !py-2 text-sm"
          >
            احجز منصتك
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-surface))] text-[hsl(var(--mk-ink-soft))] lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-[hsl(var(--mk-line))] bg-[hsl(var(--mk-bg))] lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4" aria-label="قائمة الجوال">
            {NAV_LINKS.map((link) => (
              <a
                key={link.hash}
                href={`/${link.hash}`}
                onClick={(e) => handleNavClick(e, link.hash)}
                className="mk-nav-link justify-between text-base"
              >
                {link.label}
                <ArrowLeft className="h-4 w-4 text-[hsl(var(--mk-muted))]" />
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
