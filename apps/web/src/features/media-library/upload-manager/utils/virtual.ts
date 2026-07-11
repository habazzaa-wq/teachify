import { useCallback, useLayoutEffect, useRef, useState } from "react";

export interface VirtualRange {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

/**
 * Lightweight fixed-height list windowing. Avoids adding a virtualization
 * dependency while keeping the upload queue render cost constant regardless
 * of queue size.
 */
export function useVirtualQueue(
  itemCount: number,
  rowHeight: number,
  overscan: number,
  scrollRef: React.RefObject<HTMLElement | null>,
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const rafRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (el) setViewportHeight(el.clientHeight);
  }, [scrollRef]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, scrollRef]);

  const onScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) setScrollTop(el.scrollTop);
    });
  }, [scrollRef]);

  const totalHeight = itemCount * rowHeight;
  const visibleCount = viewportHeight > 0 ? Math.ceil(viewportHeight / rowHeight) : Math.min(itemCount, 12);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * rowHeight;

  return { startIndex, endIndex, offsetY, totalHeight, onScroll } as VirtualRange & {
    onScroll: () => void;
  };
}
