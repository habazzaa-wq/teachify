"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores/ui.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((state) => state.theme);
  const hasHydrated = useUiStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.classList.remove("theme-initializing");
  }, [hasHydrated, theme]);

  return <>{children}</>;
}
