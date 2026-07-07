"use client";

import * as React from "react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogDescription,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogTitle,
} from "./AppDialog";

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Simple alert-style modal built on AppDialog. For richer flows (triggers,
 * custom overlays) use AppDialog primitives directly.
 */
function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: AppModalProps) {
  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        {(title || description) && (
          <AppDialogHeader>
            {title ? <AppDialogTitle>{title}</AppDialogTitle> : null}
            {description ? (
              <AppDialogDescription>{description}</AppDialogDescription>
            ) : null}
          </AppDialogHeader>
        )}
        {children}
        {footer ? <AppDialogFooter>{footer}</AppDialogFooter> : null}
      </AppDialogContent>
    </AppDialog>
  );
}

export { AppModal };
