"use client";

import { memo, useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";

const ThemeSwitcher = memo(function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground shadow-sm backdrop-blur-xl"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <div className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        console.log("[ThemeSwitcher] button clicked, current theme:", theme);
        toggleTheme();
      }}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-accent hover:text-foreground hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
      title={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
    >
      <span className="relative flex items-center justify-center">
        <Sun
          className={`h-4 w-4 absolute transition-all duration-300 ${
            theme === "dark"
              ? "opacity-100 scale-100 rotate-0"
              : "opacity-0 scale-50 rotate-90"
          }`}
        />
        <Moon
          className={`h-4 w-4 transition-all duration-300 ${
            theme === "light"
              ? "opacity-100 scale-100 rotate-0"
              : "opacity-0 scale-50 -rotate-90"
          }`}
        />
      </span>
    </button>
  );
});

export { ThemeSwitcher };
