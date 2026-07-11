"use client";

import { useEffect, useState } from "react";

/** Returns the current epoch ms, refreshed on an interval (no Date.now in render). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
