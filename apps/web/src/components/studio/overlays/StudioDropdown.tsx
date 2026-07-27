"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StudioDropdownItem {
  label: string;
  description?: string;
  value?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  header?: boolean;
}

export interface StudioDropdownProps {
  trigger: React.ReactNode;
  items: (StudioDropdownItem | { separator: true })[];
  onSelect?: (item: StudioDropdownItem) => void;
  align?: "start" | "end";
  className?: string;
}

export function StudioDropdown({
  trigger,
  items,
  onSelect,
  align = "end",
  className,
}: StudioDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    if (triggerRef.current && panelRef.current) {
      const tRect = triggerRef.current.getBoundingClientRect();
      const pWidth = panelRef.current.offsetWidth;
      const top = tRect.bottom + 8;
      const left = align === "end" ? tRect.right - pWidth : tRect.left;
      setPos({ top, left: Math.max(8, left) });
    }
  }, [open, align]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2",
          open && "ring-2 ring-studio-ring ring-offset-2",
        )}
      >
        {trigger}
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
              role="menu"
              style={
                pos
                  ? { position: "fixed" as const, top: pos.top, left: pos.left }
                  : { position: "fixed" as const, top: -9999, left: -9999 }
              }
              className={cn(
                "z-[9999] min-w-[200px] overflow-hidden rounded-xl border border-studio-border bg-studio-surface shadow-xl",
                className,
              )}
            >
              <div className="py-1">
                {items.map((item, index) => {
                  if ("separator" in item && item.separator) {
                    return (
                      <div
                        key={`sep-${index}`}
                        className="my-1 border-t border-studio-border/60"
                        role="separator"
                      />
                    );
                  }
                  const menuItem = item as StudioDropdownItem;
                  if (menuItem.header) {
                    return (
                      <div
                        key={`hdr-${index}`}
                        className="flex items-center gap-3 px-3 py-2.5"
                        role="presentation"
                      >
                        {menuItem.icon && (
                          <span className="shrink-0">{menuItem.icon}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-studio-fg truncate">
                            {menuItem.label}
                          </p>
                          {menuItem.description && (
                            <p className="text-xs text-studio-fg-muted truncate">
                              {menuItem.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={`item-${index}`}
                      type="button"
                      role="menuitem"
                      disabled={menuItem.disabled}
                      onClick={() => {
                        onSelect?.(menuItem);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:bg-studio-soft",
                        "active:bg-studio-soft",
                        menuItem.danger
                          ? "text-red-500 hover:bg-red-500/10 focus-visible:bg-red-500/10"
                          : "text-studio-fg hover:bg-studio-soft",
                        menuItem.disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {menuItem.icon && (
                        <span className="shrink-0 text-studio-fg-muted">
                          {menuItem.icon}
                        </span>
                      )}
                      <span>{menuItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
