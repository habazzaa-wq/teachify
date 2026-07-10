"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category?: string;
  onSelect?: () => void;
}

export interface StudioCommandPaletteProps {
  open?: boolean;
  onClose?: () => void;
  items: CommandItem[];
  placeholder?: string;
  className?: string;
}

export function StudioCommandPalette({
  open,
  onClose,
  items,
  placeholder = "ابحث عن أمر...",
  className,
}: StudioCommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevOpen = useRef(open);

  const filtered = items.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (open && !prevOpen.current) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    prevOpen.current = open;
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      }
      if (e.key === "Enter" && filtered[selectedIndex]) {
        filtered[selectedIndex].onSelect?.();
        onClose?.();
      }
    },
    [filtered, selectedIndex, onClose],
  );

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose?.();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  const categories = [...new Set(filtered.filter((f) => f.category).map((f) => f.category))];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-studio-overlay"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-50 w-full max-w-lg rounded-2xl border border-studio-border bg-studio-surface shadow-2xl overflow-hidden",
              className,
            )}
          >
            <div className="flex items-center gap-3 border-b border-studio-border px-4 py-3">
              <Search className="h-5 w-5 text-studio-fg-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-studio-fg placeholder:text-studio-fg-subtle focus:outline-none"
                aria-label="بحث"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Search className="h-8 w-8 text-studio-fg-subtle mb-2" />
                  <p className="text-sm text-studio-fg-muted">لا توجد نتائج</p>
                </div>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <div key={cat}>
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-studio-fg-subtle">
                      {cat}
                    </div>
                    {filtered
                      .filter((f) => f.category === cat)
                      .map((item, idx) => {
                        const globalIdx = filtered.indexOf(item);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              item.onSelect?.();
                              onClose?.();
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              globalIdx === selectedIndex
                                ? "bg-studio-accent-soft text-studio-accent"
                                : "text-studio-fg hover:bg-studio-soft",
                            )}
                          >
                            {item.icon && <span className="shrink-0">{item.icon}</span>}
                            <div className="flex-1 text-right">
                              <div className="font-medium">{item.label}</div>
                              {item.description && (
                                <div className="text-xs text-studio-fg-muted">{item.description}</div>
                              )}
                            </div>
                            {item.shortcut && (
                              <kbd className="shrink-0 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">
                                {item.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                  </div>
                ))
              ) : (
                filtered.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.onSelect?.();
                      onClose?.();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      idx === selectedIndex
                        ? "bg-studio-accent-soft text-studio-accent"
                        : "text-studio-fg hover:bg-studio-soft",
                    )}
                  >
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <div className="flex-1 text-right">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-studio-fg-muted">{item.description}</div>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="shrink-0 rounded-md border border-studio-border bg-studio-soft px-1.5 py-0.5 text-[10px] text-studio-fg-muted">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
