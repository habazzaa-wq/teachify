"use client";

import { useCallback, useMemo } from "react";
import {
  AppInput,
  AppTextarea,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
} from "@/components/ui";
import { STATUS_OPTIONS, LANGUAGE_OPTIONS, TIMEZONE_OPTIONS, CURRENCY_OPTIONS } from "../../constants";
import type { TenantStatus, TenantLanguage, TenantCurrency } from "../../types";

interface CreateGeneralTabProps {
  data: {
    name: string;
    slug: string;
    description: string;
    status: TenantStatus;
    language: TenantLanguage;
    timezone: string;
    currency: TenantCurrency;
  };
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function CreateGeneralTab({ data, errors, onChange }: CreateGeneralTabProps) {
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange("name", val);
    if (!data.slug || !data.slug.startsWith(data.name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""))) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/[\u0600-\u06FF]/g, "");
      onChange("slug", slug);
    }
  }, [data.name, data.slug, onChange]);

  const languageOptions = useMemo(
    () => LANGUAGE_OPTIONS.filter((o) => o.value !== "all"),
    [],
  );

  const statusOptions = useMemo(
    () => STATUS_OPTIONS.filter((o) => o.value !== "all"),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            اسم المؤسسة <span className="text-destructive">*</span>
          </label>
          <AppInput
            value={data.name}
            onChange={handleNameChange}
            placeholder="مثال: أكاديمية البرمجة"
          />
          {errors.name && (
            <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            الرابط المختصر (Slug) <span className="text-destructive">*</span>
          </label>
          <AppInput
            value={data.slug}
            onChange={(e) => onChange("slug", e.target.value)}
            placeholder="مثال: programming-academy"
            dir="ltr"
            className="text-start"
          />
          {errors.slug && (
            <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.slug}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">الوصف</label>
        <AppTextarea
          value={data.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="وصف مختصر للمؤسسة (اختياري)"
          rows={3}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">الحالة</label>
          <AppSelect value={data.status} onValueChange={(val) => onChange("status", val)}>
            <AppSelectTrigger>
              <AppSelectValue />
            </AppSelectTrigger>
            <AppSelectContent>
              {statusOptions.map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>{opt.label}</AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">اللغة</label>
          <AppSelect value={data.language} onValueChange={(val) => onChange("language", val)}>
            <AppSelectTrigger>
              <AppSelectValue />
            </AppSelectTrigger>
            <AppSelectContent>
              {languageOptions.map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>{opt.label}</AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">المنطقة الزمنية</label>
          <AppSelect value={data.timezone} onValueChange={(val) => onChange("timezone", val)}>
            <AppSelectTrigger>
              <AppSelectValue />
            </AppSelectTrigger>
            <AppSelectContent>
              {TIMEZONE_OPTIONS.map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>{opt.label}</AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">العملة</label>
          <AppSelect value={data.currency} onValueChange={(val) => onChange("currency", val)}>
            <AppSelectTrigger>
              <AppSelectValue />
            </AppSelectTrigger>
            <AppSelectContent>
              {CURRENCY_OPTIONS.map((opt) => (
                <AppSelectItem key={opt.value} value={opt.value}>{opt.label}</AppSelectItem>
              ))}
            </AppSelectContent>
          </AppSelect>
        </div>
      </div>
    </div>
  );
}

export { CreateGeneralTab };
