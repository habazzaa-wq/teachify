"use client";

import { useMemo, useCallback } from "react";
import { AppInput, AppSwitch } from "@/components/ui";
import { cn } from "@/lib/cn";
import { env } from "@/config/env";

interface CreateDomainTabProps {
  data: {
    slug: string;
    subdomain: string;
    customDomain: string;
    ssl: boolean;
  };
  errors: Record<string, string>;
  onChange: (key: string, value: string | boolean) => void;
}

function CreateDomainTab({ data, errors, onChange }: CreateDomainTabProps) {
  const domainPreview = useMemo(() => {
    const sub = data.subdomain || data.slug || "{slug}";
    const clean = sub.toLowerCase().replace(/[^a-z0-9-]/g, "");
    return `https://${clean}.${env.appBaseDomain}`;
  }, [data.subdomain, data.slug]);

  const handleSubdomainChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    onChange("subdomain", val);
  }, [onChange]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-primary/5 p-4 space-y-2">
        <label className="text-sm font-medium">معاينة النطاق</label>
        <p className="text-lg font-mono font-semibold text-primary dir-ltr text-start break-all">
          {domainPreview}
        </p>
        <p className="text-xs text-muted-foreground">
          سيتم إنشاء النطاق تلقائياً بناءً على الرابط المختصر أو النطاق الفرعي
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          النطاق الفرعي الأساسي <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-2">
          <AppInput
            value={data.subdomain}
            onChange={handleSubdomainChange}
            placeholder={data.slug || "academy"}
            className="font-mono flex-1"
            dir="ltr"
          />
          <span className="text-sm text-muted-foreground font-mono whitespace-nowrap shrink-0">.{env.appBaseDomain}</span>
        </div>
        {errors.subdomain && (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{errors.subdomain}</p>
        )}
        {data.subdomain && !errors.subdomain && (
          <p className="text-xs text-success animate-in fade-in slide-in-from-top-1 duration-200">
            النطاق <span className="font-mono font-semibold">{data.subdomain}.{env.appBaseDomain}</span> متاح
          </p>
        )}
        <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
          <li className={cn("transition-colors", data.subdomain && /[A-Z]/.test(data.subdomain) ? "text-destructive" : "")}>
            • أحرف صغيرة فقط
          </li>
          <li className={cn("transition-colors", data.subdomain && /\s/.test(data.subdomain) ? "text-destructive" : "")}>
            • بدون مسافات
          </li>
          <li className={cn("transition-colors", data.subdomain && /\//.test(data.subdomain) ? "text-destructive" : "")}>
            • بدون شرطة مائلة
          </li>
          <li className={cn("transition-colors", data.subdomain && /^https?:\/\//.test(data.subdomain) ? "text-destructive" : "")}>
            • بدون بروتوكول
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">النطاق المخصص</label>
        <AppInput
          value={data.customDomain}
          onChange={(e) => onChange("customDomain", e.target.value)}
          placeholder="academy.com (اختياري)"
          className="font-mono"
          dir="ltr"
        />
        <p className="text-xs text-muted-foreground">يمكنك إضافة نطاق مخصص لاحقاً من الإعدادات</p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-3">
        <AppSwitch
          checked={data.ssl}
          onCheckedChange={(v) => onChange("ssl", v)}
          id="ssl"
        />
        <label htmlFor="ssl" className="text-sm font-medium cursor-pointer">
          تفعيل SSL تلقائياً
        </label>
      </div>
    </div>
  );
}

export { CreateDomainTab };
