"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns true only after the component has mounted on the client.
 *
 * Uses an external flag pattern (read in an effect subscription) rather than a
 * synchronous setState-in-effect to avoid cascading renders.
 */
export function useIsMounted(): boolean {
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const id = requestAnimationFrame(() => setMounted(true));

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(id);
    };
  }, []);

  return mounted;
}
