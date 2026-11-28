export const HERO_UPDATED_CHANNEL = "teachify:hero-updated";
export const HERO_UPDATED_STORAGE_KEY = "teachify:hero-updated-at";

/**
 * Tell every other tab in this browser that the saved hero copy changed.
 *
 * TanStack Query caches are per tab, so invalidating the admin tab alone left
 * an already-open public homepage showing the old text until its 60s stale
 * window expired. BroadcastChannel is instant; localStorage is the fallback
 * for browsers that do not expose it.
 */
export function announceHeroUpdate(): void {
  if (typeof window === "undefined") return;

  const stamp = String(Date.now());

  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(HERO_UPDATED_CHANNEL);
      channel.postMessage(stamp);
      channel.close();
      return;
    }
  } catch {
    // Fall through to the storage event below.
  }

  try {
    window.localStorage.setItem(HERO_UPDATED_STORAGE_KEY, stamp);
  } catch {
    // Storage can be disabled; the saving tab still invalidates its own cache.
  }
}

/** Subscribe to hero saves made in other tabs. Returns an unsubscribe fn. */
export function subscribeToHeroUpdates(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let channel: BroadcastChannel | null = null;

  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(HERO_UPDATED_CHANNEL);
      channel.onmessage = () => handler();
    }
  } catch {
    channel = null;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === HERO_UPDATED_STORAGE_KEY) handler();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    if (channel) {
      channel.onmessage = null;
      channel.close();
    }
    window.removeEventListener("storage", onStorage);
  };
}
