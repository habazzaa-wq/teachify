"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { JourneyFlow } from "./types";
import { computeJourneyGeometry } from "./geometry";

/**
 * Horizontal path on desktop/tablet, vertical scroll-driven map on mobile.
 * The breakpoint is owned by this hook (SSR-safe) so geometry and layout can
 * react to it without importing `useMediaQuery` into every component.
 */
const HORIZONTAL_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const mq = window.matchMedia(HORIZONTAL_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot(): JourneyFlow {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "horizontal";
  }
  return window.matchMedia(HORIZONTAL_QUERY).matches ? "horizontal" : "vertical";
}

/** Read the current layout flow, subscribing to breakpoint changes. */
export function useJourneyFlow(): JourneyFlow {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Geometry for `count` stages in the currently active flow (memoized). */
export function useJourneyGeometry(count: number, rtl: boolean) {
  const flow = useJourneyFlow();
  return useMemo(() => computeJourneyGeometry(count, { flow, rtl }), [count, flow, rtl]);
}