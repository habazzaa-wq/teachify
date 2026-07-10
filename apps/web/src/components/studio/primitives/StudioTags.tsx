"use client";

import { forwardRef, useState, useId } from "react";
import { X, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StudioTagsProps {
  value?: string[];
  onChange?: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const StudioTags = forwardRef<HTMLInputElement, StudioTagsProps>(
  ({ value = [], onChange, label, placeholder = "اضف علامة...", error, disabled, className }, ref) => {
    const [inputValue, setInputValue] = useState("");
    const generatedId = useId();

    const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange?.([...value, trimmed]);
        onChange?.([...value, trimmed]);
      }
      setInputValue("");
    };

    const removeTag = (tag: string) => {
      onChange?.(value.filter((t) => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag();
      }
      if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1]!);
      }
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={generatedId} className="text-sm font-medium text-studio-fg">
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-lg border bg-studio-surface px-3 py-1.5",
            "transition-all duration-150",
            "focus-within:ring-2 focus-within:ring-studio-ring focus-within:ring-offset-2 focus-within:ring-offset-studio-bg",
            error ? "border-studio-danger" : "border-studio-border",
            disabled && "cursor-not-allowed opacity-40",
            className,
          )}
        >
          <AnimatePresence mode="popLayout">
            {value.map((tag) => (
              <motion.span
                key={tag}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 rounded-md bg-studio-accent-soft px-2 py-0.5 text-xs font-medium text-studio-accent"
              >
                {tag}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-studio-accent/80 transition-colors"
                    aria-label={`حذف ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.span>
            ))}
          </AnimatePresence>
          <input
            ref={ref}
            id={generatedId}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputValue.trim() && addTag()}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="min-w-[80px] flex-1 border-0 bg-transparent p-0 text-sm text-studio-fg placeholder:text-studio-fg-subtle focus:outline-none focus:ring-0"
            aria-label={label || "اضف علامة"}
          />
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
StudioTags.displayName = "StudioTags";

export { StudioTags };
