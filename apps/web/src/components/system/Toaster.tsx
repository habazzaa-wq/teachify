"use client";

import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

// Sonner's `richColors` palette is hard-coded per light/dark theme. Point its
// internal variables at the tenant's brand-derived studio tokens instead, so
// every toast type follows the saved colors in both modes. These are inherited
// by all toasts from the toaster element, including the close/action buttons.
const themedToastVars = {
  "--normal-bg": "hsl(var(--studio-panel))",
  "--normal-bg-hover": "hsl(var(--studio-hover))",
  "--normal-border": "hsl(var(--studio-border))",
  "--normal-border-hover": "hsl(var(--studio-border) / 0.8)",
  "--normal-text": "hsl(var(--studio-fg))",
  "--success-bg": "hsl(var(--studio-success) / 0.1)",
  "--success-border": "hsl(var(--studio-success) / 0.3)",
  "--success-text": "hsl(var(--studio-success))",
  "--info-bg": "hsl(var(--studio-info) / 0.1)",
  "--info-border": "hsl(var(--studio-info) / 0.3)",
  "--info-text": "hsl(var(--studio-info))",
  "--warning-bg": "hsl(var(--studio-warning) / 0.1)",
  "--warning-border": "hsl(var(--studio-warning) / 0.3)",
  "--warning-text": "hsl(var(--studio-warning))",
  "--error-bg": "hsl(var(--studio-danger) / 0.1)",
  "--error-border": "hsl(var(--studio-danger) / 0.3)",
  "--error-text": "hsl(var(--studio-danger))",
} as CSSProperties;

/**
 * Global notification mount. Kept in its own client component so it can be
 * dynamically imported (client-only) from the root providers — the Sonner UI
 * (~69 KB) is then loaded lazily instead of being part of the shared base
 * bundle. The lightweight `toast()` API is unaffected and can be imported
 * anywhere else in the app.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      dir="rtl"
      richColors
      closeButton
      style={themedToastVars}
    />
  );
}
