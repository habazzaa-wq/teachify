"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Global notification mount. Kept in its own client component so it can be
 * dynamically imported (client-only) from the root providers — the Sonner UI
 * (~69 KB) is then loaded lazily instead of being part of the shared base
 * bundle. The lightweight `toast()` API is unaffected and can be imported
 * anywhere else in the app.
 */
export function Toaster() {
  return <SonnerToaster position="top-center" dir="rtl" richColors closeButton />;
}
