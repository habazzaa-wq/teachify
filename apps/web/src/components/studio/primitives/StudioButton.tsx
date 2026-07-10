"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const studioButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-all duration-150 select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-studio-accent text-studio-accent-fg hover:bg-studio-accent/90 active:bg-studio-accent/80 shadow-sm hover:shadow-md",
        secondary:
          "bg-studio-soft text-studio-fg hover:bg-studio-soft/80 active:bg-studio-soft/60 border border-studio-border",
        ghost:
          "text-studio-fg hover:bg-studio-soft active:bg-studio-soft/60",
        soft: "bg-studio-accent-soft text-studio-accent hover:bg-studio-accent-soft/80 active:bg-studio-accent-soft/60",
        danger:
          "bg-studio-danger text-white hover:bg-studio-danger/90 active:bg-studio-danger/80 shadow-sm",
        success:
          "bg-studio-success text-white hover:bg-studio-success/90 active:bg-studio-success/80 shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md gap-1.5 [&_svg]:size-3.5",
        md: "h-10 px-4 text-sm rounded-lg gap-2 [&_svg]:size-4",
        lg: "h-12 px-6 text-base rounded-lg gap-2.5 [&_svg]:size-5",
        icon: "h-10 w-10 rounded-lg [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface StudioButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof studioButtonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

const StudioButton = forwardRef<HTMLButtonElement, StudioButtonProps>(
  ({ className, variant, size, loading, icon, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        className={cn(studioButtonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children && <span>{children}</span>}
      </motion.button>
    );
  },
);
StudioButton.displayName = "StudioButton";

export { StudioButton, studioButtonVariants };
