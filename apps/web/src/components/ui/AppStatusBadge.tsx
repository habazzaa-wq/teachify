import { cn } from "@/lib/cn";
import { AppBadge, type BadgeProps } from "./AppBadge";

type StatusType = "active" | "inactive" | "pending" | "suspended" | "archived" | "draft" | "published";

interface AppStatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<StatusType, { variant: BadgeProps["variant"]; defaultLabel: string }> = {
  active: { variant: "success", defaultLabel: "نشط" },
  inactive: { variant: "secondary", defaultLabel: "غير نشط" },
  pending: { variant: "warning", defaultLabel: "قيد الانتظار" },
  suspended: { variant: "destructive", defaultLabel: "موقوف" },
  archived: { variant: "outline", defaultLabel: "مؤرشف" },
  draft: { variant: "secondary", defaultLabel: "مسودة" },
  published: { variant: "success", defaultLabel: "منشور" },
};

function AppStatusBadge({ status, label, className, ...props }: AppStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <AppBadge
      variant={config.variant}
      className={cn("gap-1", className)}
      {...props}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" && "bg-studio-success-foreground",
          status === "inactive" && "bg-studio-fg-muted",
          status === "pending" && "bg-studio-warning-foreground",
          status === "suspended" && "bg-studio-danger-foreground",
          status === "archived" && "bg-studio-fg-muted/50",
          status === "draft" && "bg-studio-fg-muted/50",
          status === "published" && "bg-studio-success-foreground",
        )}
      />
      {label ?? config.defaultLabel}
    </AppBadge>
  );
}

export { AppStatusBadge, type AppStatusBadgeProps, type StatusType };
