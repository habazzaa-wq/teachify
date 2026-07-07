"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { AppDialog, AppDialogContent } from "./AppDialog";

interface AppDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "start" | "end";
  className?: string;
}

function AppDrawer({
  open,
  onOpenChange,
  children,
  side = "end",
  className,
}: AppDrawerProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        className={cn(
          "fixed top-0 h-full max-w-[80vw] translate-x-0 translate-y-0 rounded-none border-l p-0 sm:max-w-sm",
          side === "end"
            ? "end-0 start-auto rounded-s-lg"
            : "start-0 end-auto rounded-e-lg",
          className,
        )}
      >
        {children}
      </AppDialogContent>
    </AppDialog>
  );
}

export { AppDrawer, type AppDrawerProps };
