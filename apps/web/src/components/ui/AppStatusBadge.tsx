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
          status === "active" && "bg-success",
          status === "inactive" && "bg-muted-foreground",
          status === "pending" && "bg-warning",
          status === "suspended" && "bg-destructive",
          status === "archived" && "bg-muted-foreground/50",
          status === "draft" && "bg-muted-foreground/50",
          status === "published" && "bg-success",
        )}
      />
      {label ?? config.defaultLabel}
    </AppBadge>
  );
}

export { AppStatusBadge, type AppStatusBadgeProps, type StatusType };
