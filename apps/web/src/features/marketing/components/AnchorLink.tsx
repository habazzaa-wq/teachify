"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Smooth-scroll anchor link for the marketing site. Client-only so the
 * scroll handler can live here instead of being passed from a Server
 * Component (which React forbids). Falls back to native hash navigation
 * when the target element isn't on the page yet.
 */
export function AnchorLink({
  href,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const id = href.replace(/^\/?#/, "");
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <a href={href} className={cn(className)} onClick={handleClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
