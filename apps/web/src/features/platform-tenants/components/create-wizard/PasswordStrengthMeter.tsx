"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

interface PasswordStrengthMeterProps {
  password: string;
}

function evaluateStrength(password: string): {
  score: number;
  label: string;
  color: string;
  variant: "destructive" | "warning" | "default" | "secondary" | "success";
} {
  if (!password) return { score: 0, label: "", color: "bg-muted", variant: "secondary" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: "ضعيفة", color: "bg-destructive", variant: "destructive" };
  if (score <= 2) return { score: 2, label: "متوسطة", color: "bg-warning", variant: "warning" };
  if (score <= 3) return { score: 3, label: "جيدة", color: "bg-primary", variant: "default" };
  if (score <= 4) return { score: 4, label: "قوية", color: "bg-secondary", variant: "secondary" };
  return { score: 5, label: "ممتازة", color: "bg-success", variant: "success" };
}

function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => evaluateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5" role="meter" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={5} aria-label="قوة كلمة المرور">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < strength.score ? strength.color : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium transition-colors duration-300", {
        "text-destructive": strength.variant === "destructive",
        "text-warning": strength.variant === "warning",
        "text-primary": strength.variant === "default",
        "text-secondary-foreground": strength.variant === "secondary",
        "text-success": strength.variant === "success",
      })}>
        {strength.label}
      </p>
    </div>
  );
}

export { PasswordStrengthMeter, evaluateStrength };
