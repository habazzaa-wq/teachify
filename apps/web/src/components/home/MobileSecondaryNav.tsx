"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { Moon, Search, Sun } from "lucide-react";

import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";
import { useMobileNavLinks, type PublicNavLink } from "@/components/home/usePublicNavLinks";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MobileSecondaryNav() {
  const pathname = usePathname();
  const reduced = prefersReducedMotion();
  const theme = useUiStore((state) => state.theme);
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
    <div className="px-3 pb-2 pt-1 md:hidden">
      <div className="overflow-hidden rounded-[22px] border border-border/70 bg-background/90 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        {/*
          Instead of squeezing every label into one tiny column, the dock wraps
          into roomy tiles. Flex + min-width means a narrow phone gets 2–3 per
          row while a larger one gets more — every entry stays visible,
          full-width and tappable, with no truncation or hidden overflow.
        */}
        <nav
          aria-label="التصفح"
          className="flex flex-wrap gap-1.5 p-1.5"
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
                  "group relative flex min-h-[60px] min-w-[100px] flex-1 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl px-1.5 py-2 text-center transition-all duration-200 active:scale-[0.97]",
                  isActive
                    ? "bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)] shadow-md"
                    : "bg-foreground/5 text-foreground/75 hover:bg-foreground/10 hover:text-foreground",
                )}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-[var(--brand-secondary)]"
                  />
                )}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                    isActive
                      ? "bg-white/15"
                      : "bg-background/80 text-[var(--brand-primary)] shadow-sm ring-1 ring-border/60",
                  )}
                >
                  <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-semibold leading-tight">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="grid grid-cols-2 gap-1.5 border-t border-border/60 bg-foreground/[0.02] p-1.5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("public-search-request"))}
            aria-label="بحث عن كورس"
            title="بحث عن كورس"
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/70 text-xs font-semibold text-foreground/70 transition-colors hover:border-foreground/20 hover:bg-foreground/5 hover:text-foreground"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>بحث عن كورس</span>
          </button>
          <button
            type="button"
            onClick={() => useUiStore.getState().toggleTheme()}
            aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            title={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/70 text-xs font-semibold text-foreground/70 transition-colors hover:border-foreground/20 hover:bg-foreground/5 hover:text-foreground"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
