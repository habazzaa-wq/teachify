"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface AppSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  containerClassName?: string;
}

function AppSearch(
  {
    className,
    containerClassName,
    onClear,
    value,
    onChange,
    placeholder = "بحث...",
    ...props
  }: AppSearchProps,
  ref: React.Ref<HTMLInputElement>,
) {
  const [localValue, setLocalValue] = React.useState("");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setLocalValue(e.target.value);
    onChange?.(e);
  };

  const handleClear = () => {
    if (!isControlled) setLocalValue("");
    onClear?.();
    const nativeEvent = new Event("input", { bubbles: true });
    const fakeTarget = { target: { value: "" } as HTMLInputElement };
    onChange?.(fakeTarget as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className={cn("relative", containerClassName)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        type="text"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 pe-8 ps-9 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {currentValue && (
        <button
          onClick={handleClear}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
          aria-label="مسح البحث"
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

const AppSearchInput = React.forwardRef(AppSearch);
AppSearchInput.displayName = "AppSearchInput";

export { AppSearchInput, type AppSearchProps };
