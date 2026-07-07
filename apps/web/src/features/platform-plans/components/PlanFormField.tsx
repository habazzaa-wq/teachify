"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface PlanFormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
  required?: boolean;
}

function PlanFormField({ label, error, children, className, hint, required }: PlanFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-foreground/90 flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground/70">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive flex items-center gap-1" role="alert">
          <span className="h-1 w-1 rounded-full bg-destructive shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export { PlanFormField };
