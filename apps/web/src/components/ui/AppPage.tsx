"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface AppPageProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  centered?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[1600px]",
  full: "max-w-full",
};

function AppPage({ children, className, maxWidth = "lg", centered = true }: AppPageProps) {
  return (
    <div
      className={cn(
        "animate-fade-in",
        centered && "mx-auto",
        maxWidthClasses[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}

export { AppPage, type AppPageProps };
