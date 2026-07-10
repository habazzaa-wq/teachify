"use client";

import { forwardRef, useState, useRef, useEffect } from "react";
import { Search, X, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StudioAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onInputChange?: (input: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

const StudioAutocomplete = forwardRef<HTMLInputElement, StudioAutocompleteProps>(
  ({ value, onChange, onInputChange, options, label, placeholder = "بحث...", error, disabled, className, loading }, ref) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);

    useEffect(() => {
      if (selected && !inputValue) {
        setInputValue(selected.label);
      }
    }, [selected, inputValue]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      onInputChange?.(val);
      if (val !== selected?.label) {
        onChange?.("");
      }
      setOpen(true);
    };

    return (
      <div ref={containerRef} className={cn("relative flex flex-col gap-1.5", className)}>
        {label && (
          <span className="text-sm font-medium text-studio-fg">{label}</span>
        )}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-studio-fg-muted pointer-events-none" />
          <input
            ref={ref}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-studio-surface pr-10 pl-10 py-2 text-sm text-studio-fg",
              "placeholder:text-studio-fg-subtle",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 px-10",
              error ? "border-studio-danger" : "border-studio-border hover:border-studio-accent-border",
              disabled && "cursor-not-allowed opacity-40",
            )}
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue("");
                onChange?.("");
                setOpen(false);
              }}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-studio-fg-muted hover:text-studio-fg"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <AnimatePresence>
          {open && (options.length > 0 || loading) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full mt-1 w-full rounded-lg border border-studio-border bg-studio-surface shadow-lg"
            >
              <div className="max-h-48 overflow-y-auto p-1">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-studio-accent border-t-transparent" />
                  </div>
                ) : (
                  options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setInputValue(opt.label);
                        onChange?.(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                        "hover:bg-studio-soft",
                        value === opt.value && "bg-studio-accent-soft text-studio-accent",
                      )}
                    >
                      {opt.label}
                      {value === opt.value && <Check className="h-4 w-4" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && (
          <p role="alert" className="text-xs text-studio-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
StudioAutocomplete.displayName = "StudioAutocomplete";

export { StudioAutocomplete };
