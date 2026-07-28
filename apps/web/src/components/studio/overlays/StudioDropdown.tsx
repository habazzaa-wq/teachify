"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StudioDropdownItem {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-studio-border bg-studio-surface shadow-lg py-1",
              align === "end" ? "end-0" : "start-0",
              className,
            )}
          >
            {items.map((item, index) => {
              if ("separator" in item && item.separator) {
                return <div key={index} className="my-1 border-t border-studio-border" />;
              }
              const menuItem = item as StudioDropdownItem;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={menuItem.disabled}
                  onClick={() => {
                    onSelect?.(menuItem);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:bg-studio-soft",
                    menuItem.danger
                      ? "text-studio-danger hover:bg-studio-danger/5"
                      : "text-studio-fg hover:bg-studio-soft",
                    menuItem.disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {menuItem.icon && (
                    <span className="shrink-0">{menuItem.icon}</span>
                  )}
                  <span>{menuItem.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
