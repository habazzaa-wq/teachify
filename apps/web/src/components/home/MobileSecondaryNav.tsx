"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { cn } from "@/lib/cn";
import { useMobileNavLinks, type PublicNavLink } from "@/components/home/usePublicNavLinks";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Compact navigation strip for phones and tablets (< lg).
 *
 * Every desktop entry — including the optional feature-flagged ones — stays in
 * this strip. It replaces the old oversized wrapped tiles with a single
 * scrollable row so the storefront chrome takes a fraction of the vertical
 * space. Search and theme toggling live in the top bar on every breakpoint.
 */
export function MobileSecondaryNav() {
  const pathname = usePathname();
  const reduced = prefersReducedMotion();
  const navLinks = useMobileNavLinks();

  const handleNavClick = (link: PublicNavLink) => (event: MouseEvent<HTMLAnchorElement>) => {
    const targetId = link.scrollTarget;
    if (!targetId || pathname !== "/") return;

    event.preventDefault();
    const scrollToSection = () => {
      const element = document.getElementById(targetId);
      if (!element) return false;
      element.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
      return true;
    };

    if (!scrollToSection()) {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (scrollToSection() || attempts >= 5) window.clearInterval(timer);
      }, 120);
    }
  };

  return (
    <div className="px-2 pb-2 pt-1 lg:hidden">
      <nav
        aria-label="التصفح"
        className="flex items-stretch gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-background/90 p-1 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {navLinks.map((link) => {
          const isActive = link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleNavClick(link)}
              aria-label={link.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex min-w-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition-colors duration-200 active:scale-[0.97]",
                isActive
                  ? "bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)] shadow-sm"
                  : "text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-[var(--brand-secondary)]"
                />
              )}
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-105",
                  isActive ? "bg-white/15" : "bg-foreground/[0.04]",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="w-full truncate text-[10px] font-medium leading-tight sm:text-[11px]">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
