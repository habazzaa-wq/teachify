"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ElementType, MouseEvent } from "react";
import { BookOpen, Home, Layers, Moon, Newspaper, Search, Sun, Users } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";

type NavLink = {
  label: string;
  href: string;
  icon: ElementType;
  scrollTarget?: string;
};

const navLinks: NavLink[] = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "المراحل", href: "/#educational-stages", icon: Layers, scrollTarget: "educational-stages" },
  { label: "الكورسات", href: "/courses", icon: BookOpen },
  { label: "المدربون", href: "/instructors", icon: Users },
  { label: "المدونة", href: "/blog", icon: Newspaper },
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MobileSecondaryNav() {
  const pathname = usePathname();
  const reduced = prefersReducedMotion();
  const theme = useUiStore((state) => state.theme);

  const handleNavClick = (link: NavLink) => (event: MouseEvent<HTMLAnchorElement>) => {
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
    <div className="px-4 pb-1.5 pt-0.5 md:hidden">
      <div className="rounded-2xl border border-border/70 bg-background/85 p-1 shadow-lg">
        <nav
          aria-label="التصفح"
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${navLinks.length}, minmax(0, 1fr))` }}
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
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold leading-none transition-colors",
                  isActive
                    ? "bg-[var(--brand-primary)] text-[var(--brand-primary-contrast)] shadow-sm"
                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-1 flex items-center justify-start gap-1 border-t border-border/60 px-1 pt-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("public-search-request"))}
            aria-label="بحث عن كورس"
            title="بحث عن كورس"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-foreground/5 text-[var(--brand-primary)] transition-colors hover:bg-foreground/10"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => useUiStore.getState().toggleTheme()}
            aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            title={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-foreground/5 text-[var(--brand-secondary)] transition-colors hover:bg-foreground/10"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
