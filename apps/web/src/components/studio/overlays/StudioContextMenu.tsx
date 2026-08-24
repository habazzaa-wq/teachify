"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
      setOpen(true);
    },
    [],
  );

  // Keep the menu within the viewport, otherwise it gets clipped on small
  // screens (especially when triggered near an edge by a long-press).
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;
    let { x, y } = position;
    if (x + rect.width > innerWidth) x = Math.max(8, innerWidth - rect.width - 8);
    if (y + rect.height > innerHeight) y = Math.max(8, innerHeight - rect.height - 8);
    menuRef.current.style.left = `${x}px`;
    menuRef.current.style.top = `${y}px`;
  }, [open, position]);

  useEffect(() => {
    const handleClose = () => setOpen(false);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("click", handleClose);
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("click", handleClose);
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [open]);

  return (
    <div onContextMenu={handleContextMenu} className={className}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="fixed z-[60] min-w-[180px] overflow-hidden rounded-xl border border-studio-border bg-studio-surface shadow-xl py-1"
                style={{ left: position.x, top: position.y, transformOrigin: "top start" }}
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
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
