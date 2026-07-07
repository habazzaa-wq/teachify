"use client";

import { useState, useCallback } from "react";
import {
  AppInput,
  AppButton,
  AppCheckbox,
  Label,
} from "@/components/ui";
import { Eye, EyeOff, Copy, Sparkles, Check } from "lucide-react";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

interface CreateOwnerAccountTabProps {
  data: {
    ownerName: string;
    ownerEmail: string;
    phone: string;
    password: string;
    confirmPassword: string;
    requirePasswordChange: boolean;
    sendWelcomeEmail: boolean;
    enable2FA: boolean;
  };
  errors: Record<string, string>;
  onChange: (key: string, value: string | boolean) => void;
  onPasswordGenerated: (password: string) => void;
  isEdit?: boolean;
}

function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

function CreateOwnerAccountTab({ data, errors, onChange, onPasswordGenerated, isEdit }: CreateOwnerAccountTabProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    const pwd = generateStrongPassword();
    onPasswordGenerated(pwd);
  }, [onPasswordGenerated]);

  const handleCopy = useCallback(async () => {
    if (!data.password) return;
    try {
      await navigator.clipboard.writeText(data.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = data.password;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [data.password]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ownerName">
            اسم المالك <span className="text-destructive">*</span>
          </label>
          <AppInput
            id="ownerName"
            value={data.ownerName}
            onChange={(e) => onChange("ownerName", e.target.value)}
            placeholder="مثال: أحمد محمد"
            className={errors.ownerName ? "border-destructive ring-destructive/30" : ""}
          />
          {errors.ownerName && (
            <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.ownerName}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ownerEmail">
            البريد الإلكتروني <span className="text-destructive">*</span>
          </label>
          <AppInput
            id="ownerEmail"
            type="email"
            value={data.ownerEmail}
            onChange={(e) => onChange("ownerEmail", e.target.value)}
            placeholder="email@example.com"
            dir="ltr"
            className={errors.ownerEmail ? "border-destructive ring-destructive/30" : ""}
          />
          {errors.ownerEmail && (
            <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.ownerEmail}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="phone">
          رقم الهاتف <span className="text-destructive">*</span>
        </label>
        <AppInput
          id="phone"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+966501234567"
          dir="ltr"
          className={errors.phone ? "border-destructive ring-destructive/30" : ""}
        />
        {errors.phone && (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.phone}</p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">كلمة المرور</h4>
          <div className="flex gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isEdit ? "توليد كلمة مرور جديدة" : "توليد كلمة مرور"}
            </AppButton>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!data.password}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "تم النسخ" : "نسخ"}
            </AppButton>
          </div>
        </div>

        {isEdit && !data.password && (
          <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm text-muted-foreground">
            كلمة المرور مضبوطة مسبقاً. اترك الحقول فارغة للاحتفاظ بها.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              {isEdit ? "كلمة المرور الجديدة" : "كلمة المرور"}
              {!isEdit && <span className="text-destructive"> *</span>}
            </label>
            <div className="relative">
              <AppInput
                id="password"
                type={showPassword ? "text" : "password"}
                value={data.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder={isEdit ? "اتركه فارغاً" : "••••••••"}
                dir="ltr"
                className={`font-mono ${errors.password ? "border-destructive ring-destructive/30" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.password}</p>
            )}
            <PasswordStrengthMeter password={data.password} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">
              {isEdit ? "تأكيد كلمة المرور الجديدة" : "تأكيد كلمة المرور"}
              {!isEdit && <span className="text-destructive"> *</span>}
            </label>
            <div className="relative">
              <AppInput
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={data.confirmPassword}
                onChange={(e) => onChange("confirmPassword", e.target.value)}
                placeholder={isEdit ? "اتركه فارغاً" : "••••••••"}
                dir="ltr"
                className={`font-mono ${errors.confirmPassword ? "border-destructive ring-destructive/30" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h4 className="text-sm font-semibold">الإعدادات</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AppCheckbox
              id="requirePasswordChange"
              checked={data.requirePasswordChange}
              onCheckedChange={(v) => onChange("requirePasswordChange", !!v)}
            />
            <Label htmlFor="requirePasswordChange" className="text-sm font-medium cursor-pointer">
              طلب تغيير كلمة المرور عند أول تسجيل دخول
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <AppCheckbox
              id="sendWelcomeEmail"
              checked={data.sendWelcomeEmail}
              onCheckedChange={(v) => onChange("sendWelcomeEmail", !!v)}
            />
            <Label htmlFor="sendWelcomeEmail" className="text-sm font-medium cursor-pointer">
              إرسال بريد ترحيبي للمالك
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <AppCheckbox
              id="enable2FA"
              checked={data.enable2FA}
              onCheckedChange={(v) => onChange("enable2FA", !!v)}
            />
            <Label htmlFor="enable2FA" className="text-sm font-medium cursor-pointer">
              تفعيل المصادقة الثنائية (2FA)
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CreateOwnerAccountTab };
