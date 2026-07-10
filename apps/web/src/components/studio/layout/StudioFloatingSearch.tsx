"use client";

import { forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StudioFloatingSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const StudioFloatingSearch = forwardRef<HTMLInputElement, StudioFloatingSearchProps>(
  ({ className, placeholder = "بحث سريع...", ...props }, ref) => {
    return (
      <div
        className={cn(
          "studio-glass-floating flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg",
          "focus-within:ring-2 focus-within:ring-studio-ring/30",
          className,
        )}
      >
        <Search className="h-5 w-5 text-studio-fg-muted shrink-0" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-studio-fg placeholder:text-studio-fg-subtle focus:outline-none"
          {...props}
        />
      </div>
    );
  },
);
StudioFloatingSearch.displayName = "StudioFloatingSearch";

export { StudioFloatingSearch };
