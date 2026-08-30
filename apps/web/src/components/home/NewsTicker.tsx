"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Megaphone, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { useBrandColors } from "@/hooks/useBrandColors";
import { usePublicNews } from "@/features/homepage/news/hooks";
import { resolveTicker, contrastText, darkenHex } from "@/features/homepage/news/utils";
import type { NewsItem } from "@/features/homepage/news/types";
import { cn } from "@/lib/cn";

function NewsChip({
  item,
  accent,
}: {
  item: NewsItem;
  accent: string;
}) {
  const inner = (
    <span className="flex items-center gap-2.5 whitespace-nowrap">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: accent, boxShadow: `0 0 8px 1px ${accent}` }}
        aria-hidden="true"
      />
      <span className="text-[13px] font-semibold leading-none tracking-wide">
        {item.title}
      </span>
      {item.url && (
        <ArrowLeft className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      )}
    </span>
  );

  const cls =
    "group/chip mx-1.5 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md group-hover/marquee:opacity-50 hover:!opacity-100";

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }

  return <span className={cls}>{inner}</span>;
}

export function NewsTicker({
  className,
  collapsible = true,
}: {
  className?: string;
  collapsible?: boolean;
}) {
  const { tenant } = useActiveTenant();
  const { data, isLoading } = usePublicNews();
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [copies, setCopies] = useState(2);
  const [shift, setShift] = useState(0);
  const [inView, setInView] = useState(true);

  const branding = tenant?.branding;
  const resolved = resolveTicker(data?.ticker, branding);
  const { config } = resolved;
  const items = useMemo(() => data?.items ?? [], [data]);

  const { primary, secondary } = useBrandColors();
  const bg = config.bgColor || primary;
  const accent = config.accentColor || secondary;
  const text = config.textColor || contrastText(bg);
  const accentText = contrastText(accent);

  const enabled = config.enabled;
  const isBottom = config.position === "bottom";

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    // On phones the ticker must be open on arrival so the news is visible
    // right away, regardless of any previously saved "collapsed" state.
    if (window.matchMedia("(max-width: 768px)").matches) return false;
    try {
      return localStorage.getItem("news-ticker-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [pulling, setPulling] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragMoved = useRef(false);

  const persistCollapsed = (value: boolean) => {
    setCollapsed(value);
    try {
      localStorage.setItem("news-ticker-collapsed", value ? "true" : "false");
    } catch {
      /* ignore */
    }
  };

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    dragStartY.current = e.clientY;
    dragMoved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPulling(true);
  };
  const onHandlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragStartY.current === null) return;
    const dy = e.clientY - dragStartY.current;
    if (dy > 6) dragMoved.current = true;
    if (dy > 40) {
      dragStartY.current = null;
      setPulling(false);
      persistCollapsed(false);
    }
  };
  const onHandlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const moved = dragMoved.current;
    dragStartY.current = null;
    setPulling(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!moved) persistCollapsed(false);
  };

  const gradient = `linear-gradient(110deg, ${bg} 0%, ${darkenHex(bg, 0.18)} 100%)`;

  // Compute repetitions so the track always overflows the viewport by at
  // least one full set, then animate by exactly one set width (seamless,
  // never an empty gap). The shift distance is passed via a CSS variable.
  useLayoutEffect(() => {
    const measure = () => {
      const setWidth = measureRef.current?.offsetWidth ?? 0;
      const viewWidth = viewportRef.current?.offsetWidth ?? 0;
      if (setWidth <= 0 || viewWidth <= 0) return;
      const needed = Math.max(2, Math.ceil(viewWidth / setWidth) + 1);
      setCopies(needed);
      setShift(setWidth);
      setDuration(setWidth / Math.max(1, config.speed));
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [items, config.speed]);

  // Reserve space when pinned to the bottom.
  useEffect(() => {
    if (!enabled || config.position !== "bottom" || collapsed) return;
    const root = rootRef.current;
    if (!root) return;
    const height = root.offsetHeight;
    document.body.style.paddingBottom = `${height}px`;
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [enabled, config.position, collapsed, items]);

  const mounted = !isLoading && enabled;
  useEffect(() => {
    if (!mounted) return;
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? true),
      { rootMargin: "200px 0px" },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [mounted]);

  if (isLoading || !enabled) {
    return null;
  }

  const isEmpty = items.length === 0;

  const renderTrack = () =>
    Array.from({ length: copies }).flatMap((_, c) =>
      items.map((item) => (
        <NewsChip key={`n-${c}-${item.id}`} item={item} accent={accent} />
      )),
    );

  return (
    <>
      <div
        ref={rootRef}
        className={cn(
          "news-marquee group/marquee relative flex w-full items-stretch overflow-hidden shadow-[0_8px_24px_-10px_rgba(0,0,0,0.4)] transition-[max-height,opacity] duration-300 ease-in-out",
          isBottom &&
            "fixed inset-x-0 bottom-0 z-40 shadow-[0_-8px_24px_-10px_rgba(0,0,0,0.4)]",
          collapsed && "pointer-events-none opacity-0",
          !inView && "news-marquee-paused",
          className,
        )}
        dir="rtl"
        style={{ background: gradient, color: text, maxHeight: collapsed ? 0 : 120 }}
        role="marquee"
        aria-label={config.label || "شريط الأخبار"}
        aria-hidden={collapsed}
      >
        {/* Lit top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" />

        {/* Leading "live" badge with a mask so chips emerge from under it */}
        <div
          className="absolute inset-y-0 start-0 z-20 flex items-center ps-4 pe-10"
          style={{ background: `linear-gradient(to left, ${bg}, transparent)` }}
        >
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-1.5 shadow-sm"
            style={{ backgroundColor: accent, color: accentText }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            <span className="text-[13px] font-extrabold tracking-wide">
              {config.label}
            </span>
          </div>
        </div>

        {/* Scrolling chips OR empty state */}
        <div ref={viewportRef} className="relative flex-1 overflow-hidden">
          {/* Hidden single-set measurer */}
          <div ref={measureRef} className="pointer-events-none invisible absolute flex w-max" aria-hidden="true">
            {items.map((item) => (
              <NewsChip key={`m-${item.id}`} item={item} accent={accent} />
            ))}
          </div>

          {isEmpty ? (
            <div className="flex h-11 items-center justify-center px-5">
              <span className="text-[13px] font-medium opacity-90">
                لا توجد أخبار حالياً
              </span>
            </div>
          ) : (
            <div
              ref={trackRef}
              className="news-marquee-track flex w-max items-center py-2"
              style={{
                "--marquee-shift": `${shift}px`,
                animationDuration: `${duration}s`,
                animationName:
                  config.direction === "rtl"
                    ? "news-marquee-scroll-rtl"
                    : "news-marquee-scroll",
              } as CSSProperties}
            >
              {renderTrack()}
            </div>
          )}
        </div>

        {/* Exit edge fade */}
        <div
          className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16"
          style={{ background: `linear-gradient(to right, ${darkenHex(bg, 0.04)}, transparent)` }}
        />

        {/* Collapse control */}
        {collapsible && !collapsed && (
          <button
            type="button"
            onClick={() => persistCollapsed(true)}
            aria-label="إخفاء شريط الأخبار"
            className="absolute end-3 top-1/2 z-30 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white/90 shadow-sm backdrop-blur transition-colors duration-200 hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        )}
      </div>

      {/* Collapsed re-open handle: slim pull-down chevron tab */}
      {collapsible && collapsed && (
        <button
          type="button"
          onClick={() => persistCollapsed(false)}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          aria-label="إظهار شريط الأخبار"
          className={cn(
            "fixed inset-x-0 top-0 z-[60] mx-auto flex h-6 w-12 cursor-pointer items-center justify-center rounded-b-xl border border-t-0 border-white/25 text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.25)] outline-none transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing active:scale-95",
            pulling && "translate-y-0.5",
          )}
          style={{ background: gradient, color: text }}
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 drop-shadow-sm transition-transform duration-200",
              pulling && "translate-y-0.5",
            )}
          />
        </button>
      )}
    </>
  );
}
