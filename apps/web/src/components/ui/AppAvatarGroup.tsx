"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { AppAvatar, AppAvatarFallback, AppAvatarImage } from "./AppAvatar";
import { AppTooltip, AppTooltipContent, AppTooltipTrigger } from "./AppTooltip";

interface AvatarItem {
  src?: string;
  alt: string;
  fallback: string;
}

interface AppAvatarGroupProps {
  avatars: AvatarItem[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

const overlapClasses = {
  sm: "-me-2",
  md: "-me-2.5",
  lg: "-me-3",
};

function AppAvatarGroup({ avatars, max = 4, size = "md", className }: AppAvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex flex-row-reverse items-center", className)}>
      {remaining > 0 && (
        <AppTooltip>
          <AppTooltipTrigger asChild>
            <div
              className={cn(
                "relative z-10 flex items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground",
                sizeClasses[size],
                overlapClasses[size],
              )}
            >
              +{remaining}
            </div>
          </AppTooltipTrigger>
          <AppTooltipContent side="top">
            <p>{avatars.slice(max).map((a) => a.alt).join("، ")}</p>
          </AppTooltipContent>
        </AppTooltip>
      )}
      {visible.map((avatar, i) => (
        <AppTooltip key={i}>
          <AppTooltipTrigger asChild>
            <AppAvatar
              className={cn(
                "relative z-20 border-2 border-background",
                sizeClasses[size],
                i < visible.length - 1 && overlapClasses[size],
              )}
            >
              {avatar.src && <AppAvatarImage src={avatar.src} alt={avatar.alt} />}
              <AppAvatarFallback className="text-[10px] font-medium">
                {avatar.fallback}
              </AppAvatarFallback>
            </AppAvatar>
          </AppTooltipTrigger>
          <AppTooltipContent side="top">
            <p>{avatar.alt}</p>
          </AppTooltipContent>
        </AppTooltip>
      ))}
    </div>
  );
}

export { AppAvatarGroup, type AppAvatarGroupProps };
