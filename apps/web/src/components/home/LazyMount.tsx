"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers mounting (and thus hydration + JS bundle download) of below-the-fold
 * sections until the placeholder approaches the viewport. Renders a
 * lightweight spacer in the meantime so page layout is stable.
 */
export function LazyMount({
  children,
  rootMargin = "700px 0px",
  minHeight = "280px",
  className,
}: {
  children: ReactNode;
  rootMargin?: string;
  minHeight?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setMounted(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className} style={mounted ? undefined : { minHeight }}>
      {mounted ? children : null}
    </div>
  );
}
