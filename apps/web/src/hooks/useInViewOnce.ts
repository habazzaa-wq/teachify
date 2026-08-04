"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight replacement for framer-motion's `useInView`.
 * Fires once when the element enters the viewport (with an optional
 * rootMargin) and reports whether it has become visible. No animation
 * loops, no continuous observation after the first hit.
 */
export function useInViewOnce<T extends HTMLElement = HTMLElement>(
  options?: { rootMargin?: string; threshold?: number },
): { ref: React.RefObject<T | null>; inView: boolean } {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setInView(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options?.rootMargin ?? "0px 0px -40px 0px",
        threshold: options?.threshold ?? 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.rootMargin, options?.threshold]);

  return { ref, inView };
}
