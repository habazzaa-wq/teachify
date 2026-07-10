"use client";

import { forwardRef, useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StudioComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const StudioCombobox = forwardRef<HTMLDivElement, StudioComboboxProps>(
  ({ value, onChange, options, label, placeholder = "اختر...", error, disabled, className }, ref) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);
    const filtered = options.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase()),
    );

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={containerRef} className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <span className="text-sm font-medium text-studio-fg">{label}</span>
        )}
        <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border bg-studio-surface px-3 py-2 text-sm",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2",
            error ? "border-studio-danger" : "border-studio-border hover:border-studio-accent-border",
            disabled && "cursor-not-allowed opacity-40",
          )}
        >
          <span className={selected ? "text-studio-fg" : "text-studio-fg-subtle"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-studio-fg-muted transition-transform duration-200", open && "rotate-180")} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1 w-full rounded-lg border border-studio-border bg-studio-surface shadow-lg"
            >
              <div className="p-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث..."
                  className="w-full rounded-md border border-studio-border bg-studio-soft px-3 py-1.5 text-sm text-studio-fg placeholder:text-studio-fg-subtle focus:outline-none focus:ring-1 focus:ring-studio-ring mb-1"
                />
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-studio-fg-muted">
                    لا توجد نتائج
                  </p>
                ) : (
                  filtered.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange?.(opt.value);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                        "hover:bg-studio-soft",
                        value === opt.value && "bg-studio-accent-soft text-studio-accent",
                      )}
                    >
                      {opt.label}
                      {value === opt.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        {error && (
          <p role="alert" className="text-xs text-studio-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
StudioCombobox.displayName = "StudioCombobox";

export { StudioCombobox };
