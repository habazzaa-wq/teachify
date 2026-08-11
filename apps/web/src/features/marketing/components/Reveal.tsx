"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type RevealVariant = "up" | "fade" | "scale";

/**
 * Scroll-triggered reveal. Renders fully visible on the server and for
 * above-the-fold content (no layout flash), then animates below-the-fold
 * content into view once. Purely CSS-transition based and honours
 * `prefers-reduced-motion` via the marketing stylesheet.
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    if (rect.top > vh) {
      el.dataset.mkState = "hidden";
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.dataset.mkState = "visible";
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-mk-state="visible"
      className={cn("mk-reveal", `mk-reveal-${variant}`, className)}
      style={{ "--mk-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
