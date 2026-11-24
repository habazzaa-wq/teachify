import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-studio-ring focus:ring-offset-2 focus:ring-offset-studio-panel",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-studio-accent text-studio-accent-fg",
        secondary:
          "border-transparent bg-studio-secondary text-studio-fg",
        destructive:
          "border-transparent bg-studio-danger text-studio-danger-foreground",
        success:
          "border-transparent bg-studio-success text-studio-success-foreground",
        warning:
          "border-transparent bg-studio-warning text-studio-warning-foreground",
        outline: "border-studio-border text-studio-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function AppBadge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { AppBadge, badgeVariants };
