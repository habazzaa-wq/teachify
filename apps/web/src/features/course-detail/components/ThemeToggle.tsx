"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { cn } from "@/lib/cn";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl",
          size === "sm" ? "h-8 w-8" : "h-10 w-10",
          className,
        )}
      />
    );
  }

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center rounded-xl transition-all duration-300",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        "text-[var(--course-text-secondary)] hover:text-[var(--course-accent)]",
        "hover:bg-[var(--course-icon-bg)]",
        className,
      )}
      aria-label={theme === "light" ? "الوضع الليلي" : "الوضع النهاري"}
    >
      {theme === "dark" ? (
        <Sun className={iconSize} />
      ) : (
        <Moon className={iconSize} />
      )}
    </button>
  );
}
