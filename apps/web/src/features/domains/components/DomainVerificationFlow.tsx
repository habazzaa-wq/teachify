"use client";

import { cn } from "@/lib/cn";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { VerificationStatus } from "../types";

interface DomainVerificationFlowProps {
  status: VerificationStatus;
}

const STEPS: { key: VerificationStatus; label: string }[] = [
  { key: "pending", label: "قيد الانتظار" },
  { key: "dns_found", label: "تم العثور على DNS" },
  { key: "ssl_requested", label: "تم طلب SSL" },
  { key: "ssl_issued", label: "تم إصدار SSL" },
  { key: "active", label: "نشط" },
];

function DomainVerificationFlow({ status }: DomainVerificationFlowProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">حالة التحقق</h4>
      <div className="relative">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                  isCompleted && "bg-success text-success-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  isPending && "bg-muted text-muted-foreground",
                )}>
                  {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                  {isCurrent && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending && <Circle className="h-4 w-4" />}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    "mt-1 h-full w-0.5",
                    isCompleted ? "bg-success" : "bg-border",
                  )} />
                )}
              </div>
              <div className="min-w-0 pt-1">
                <p className={cn(
                  "text-sm",
                  isCompleted && "text-success font-medium",
                  isCurrent && "text-foreground font-medium",
                  isPending && "text-muted-foreground",
                )}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { DomainVerificationFlow };
