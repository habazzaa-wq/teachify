"use client";

import * as React from "react";
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { AppButton } from "./AppButton";

type BannerVariant = "info" | "success" | "warning" | "destructive";

interface AppBannerProps {
  variant?: BannerVariant;
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<BannerVariant, { container: string; icon: string; iconComponent: React.ComponentType<{ className?: string }> }> = {
  info: {
    container: "border-blue-200/50 bg-blue-50/80 dark:border-blue-900/30 dark:bg-blue-950/30",
    icon: "text-blue-600 dark:text-blue-400",
    iconComponent: Info,
  },
  success: {
    container: "border-success/20 bg-success/5",
    icon: "text-success",
    iconComponent: CheckCircle2,
  },
  warning: {
    container: "border-warning/20 bg-warning/5",
    icon: "text-warning",
    iconComponent: AlertTriangle,
  },
  destructive: {
    container: "border-destructive/20 bg-destructive/5",
    icon: "text-destructive",
    iconComponent: AlertCircle,
  },
};

function AppBanner({
  variant = "info",
  title,
  description,
  icon: CustomIcon,
  action,
  dismissible,
  onDismiss,
  className,
}: AppBannerProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon ?? config.iconComponent;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-4",
        config.container,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.icon)} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-medium">{title}</p>}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {dismissible && (
        <AppButton
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground/60 hover:text-foreground"
          onClick={onDismiss}
          aria-label="إغلاق"
        >
          <X className="h-3.5 w-3.5" />
        </AppButton>
      )}
    </div>
  );
}

export { AppBanner, type AppBannerProps, type BannerVariant };
