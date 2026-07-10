"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StudioSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
  value?: string;
}

const StudioSearch = forwardRef<HTMLInputElement, StudioSearchProps>(
  ({ className, onClear, value, placeholder = "بحث...", ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-studio-fg-muted pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded-lg border border-studio-border bg-studio-surface px-10 py-2 text-sm text-studio-fg",
            "placeholder:text-studio-fg-subtle",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg",
            "hover:border-studio-accent-border",
            className,
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-studio-fg-muted hover:text-studio-fg transition-colors"
            aria-label="مسح البحث"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
StudioSearch.displayName = "StudioSearch";

export { StudioSearch };
