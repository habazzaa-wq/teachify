"use client";

import { Database, Video, Mail, CreditCard, Landmark, Users, MessageSquare, type LucideIcon } from "lucide-react";
import { AppSwitch, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PlanIntegrations } from "../types";

interface PlanIntegrationsTabProps {
  integrations: PlanIntegrations;
  onChange: (integrations: PlanIntegrations) => void;
}

interface IntegrationItem {
  key: keyof PlanIntegrations;
  label: string;
  icon: LucideIcon;
  desc: string;
}

const integrationItems: IntegrationItem[] = [
  { key: "allowBunnyStorage", label: "تخزين Bunny", icon: Database, desc: "السماح باستخدام تخزين Bunny" },
  { key: "allowBunnyStream", label: "بث Bunny", icon: Video, desc: "السماح باستخدام بث Bunny" },
  { key: "allowSmtp", label: "SMTP", icon: Mail, desc: "السماح بإعدادات SMTP المخصصة" },
  { key: "allowStripe", label: "Stripe", icon: CreditCard, desc: "السماح بتكامل Stripe" },
  { key: "allowPaypal", label: "PayPal", icon: Landmark, desc: "السماح بتكامل PayPal" },
  { key: "allowZoom", label: "Zoom", icon: Users, desc: "السماح بتكامل Zoom" },
  { key: "allowMicrosoftTeams", label: "Microsoft Teams", icon: Users, desc: "السماح بتكامل Teams" },
  { key: "allowGoogleMeet", label: "Google Meet", icon: MessageSquare, desc: "السماح بتكامل Google Meet" },
];

function PlanIntegrationsTab({ integrations, onChange }: PlanIntegrationsTabProps) {
  const toggle = (key: keyof PlanIntegrations) => {
    onChange({ ...integrations, [key]: !integrations[key] });
  };

  return (
    <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
      <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
        <AppCardTitle className="text-sm font-semibold">التكاملات المتاحة</AppCardTitle>
      </AppCardHeader>
      <AppCardContent className="p-6 space-y-6">
        <div className="rounded-xl bg-muted/30 border p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            هذه الإعدادات تحدد فقط صلاحيات التكامل المسموحة للباقة. لا يتم تخزين أي مفاتيح API أو بيانات اعتماد هنا.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {integrationItems.map((item) => {
            const Icon = item.icon;
            const isEnabled = integrations[item.key];
            return (
              <div
                key={item.key}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 transition-all duration-200",
                  "hover:border-primary/30 hover:shadow-sm",
                  isEnabled ? "border-primary/20 bg-primary/[0.02]" : "bg-card",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                      isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground/90">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </div>
                <AppSwitch
                  checked={isEnabled}
                  onCheckedChange={() => toggle(item.key)}
                  aria-label={`تفعيل ${item.label}`}
                  className="shrink-0"
                />
              </div>
            );
          })}
        </div>
      </AppCardContent>
    </AppCard>
  );
}

export { PlanIntegrationsTab };
