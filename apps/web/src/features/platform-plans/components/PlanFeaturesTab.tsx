"use client";

import { GraduationCap, BarChart3, Video, Palette, Shield, Puzzle, Sparkles, type LucideIcon } from "lucide-react";
import { AppCard, AppCardContent, AppCardHeader, AppCardTitle, AppSwitch } from "@/components/ui";
import { FEATURE_GROUPS } from "../constants";
import type { PlanFeatures } from "../types";

const groupIcons: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "bar-chart": BarChart3,
  "video": Video,
  "palette": Palette,
  "shield": Shield,
  "puzzle": Puzzle,
  "sparkles": Sparkles,
};

interface PlanFeaturesTabProps {
  features: PlanFeatures;
  onChange: (features: PlanFeatures) => void;
}

function PlanFeaturesTab({ features, onChange }: PlanFeaturesTabProps) {
  const toggle = (key: keyof PlanFeatures) => {
    onChange({ ...features, [key]: !features[key] });
  };

  return (
    <div className="space-y-6">
      {FEATURE_GROUPS.map((group) => {
        const Icon = groupIcons[group.icon];
        return (
          <AppCard key={group.title} className="overflow-hidden rounded-2xl border shadow-sm">
            <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
              <AppCardTitle className="flex items-center gap-2.5 text-sm font-semibold">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  {Icon && <Icon className="h-4 w-4 text-primary" />}
                </div>
                {group.title}
              </AppCardTitle>
            </AppCardHeader>
            <AppCardContent className="p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.features.map((feat) => (
                  <div
                    key={feat.key}
                    className="flex items-center justify-between rounded-xl border bg-card p-3.5 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="text-sm font-medium text-foreground/90">{feat.label}</span>
                    <AppSwitch
                      checked={(features as unknown as Record<string, boolean>)[feat.key] ?? false}
                      onCheckedChange={() => toggle(feat.key as keyof PlanFeatures)}
                      aria-label={`تفعيل ${feat.label}`}
                    />
                  </div>
                ))}
              </div>
            </AppCardContent>
          </AppCard>
        );
      })}
    </div>
  );
}

export { PlanFeaturesTab };
