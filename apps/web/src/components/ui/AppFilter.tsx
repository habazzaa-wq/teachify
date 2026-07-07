"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppButton } from "./AppButton";
import { AppBadge } from "./AppBadge";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroup {
  label: string;
  options: FilterOption[];
}

interface AppFilterProps {
  groups: FilterGroup[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (group: string, values: string[]) => void;
  onClearAll?: () => void;
  className?: string;
}

function AppFilter({
  groups,
  activeFilters = {},
  onFilterChange,
  onClearAll,
  className,
}: AppFilterProps) {
  const [open, setOpen] = React.useState(false);

  const totalActive = Object.values(activeFilters).reduce(
    (sum, v) => sum + v.length,
    0,
  );

  return (
    <div className={cn("relative", className)}>
      <AppButton
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <SlidersHorizontal className="h-4 w-4" />
        فلترة
        {totalActive > 0 && (
          <AppBadge variant="default" className="h-5 min-w-5 px-1 text-[10px]">
            {totalActive}
          </AppBadge>
        )}
      </AppButton>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute start-0 top-full z-50 mt-2 w-80 rounded-xl border bg-popover p-4 shadow-lg animate-expand-in">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">خيارات الفلترة</span>
              {totalActive > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  إعادة تعيين
                </button>
              )}
            </div>
            {groups.map((group) => (
              <div key={group.label} className="mb-3 last:mb-0">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map((option) => {
                    const isActive = activeFilters[group.label]?.includes(
                      option.value,
                    );
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          const current = activeFilters[group.label] ?? [];
                          const next = isActive
                            ? current.filter((v) => v !== option.value)
                            : [...current, option.value];
                          onFilterChange?.(group.label, next);
                        }}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { AppFilter, type AppFilterProps, type FilterGroup, type FilterOption };
