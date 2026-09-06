"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StudioContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  onSelect?: () => void;
}

export interface StudioContextMenuProps {
  items: StudioContextMenuItem[];
  children: React.ReactNode;
  className?: string;
}

export function StudioContextMenu({ items, children, className }: StudioContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
      setOpen(true);
    },
    [],
  );

  useEffect(() => {
    const handleClick = () => setOpen(false);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("click", handleClick);
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("click", handleClick);
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [open]);

  return (
    <div ref={containerRef} onContextMenu={handleContextMenu} className={className}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-[180px] overflow-hidden rounded-xl border border-studio-border bg-studio-surface shadow-xl py-1"
            style={{ left: position.x, top: position.y }}
          >
            {items.map((item, index) => {
              if (item.separator) {
                return <div key={index} className="my-1 border-t border-studio-border" />;
              }
              return (
                <button
                  key={index}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
                    item.danger
                      ? "text-studio-danger hover:bg-studio-danger/5"
                      : "text-studio-fg hover:bg-studio-soft",
                    item.disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
