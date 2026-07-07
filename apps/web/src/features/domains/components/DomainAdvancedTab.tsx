"use client";

import { AppSwitch, Label } from "@/components/ui";
import type { DomainAdvanced } from "../types";

interface DomainAdvancedTabProps {
  data: DomainAdvanced;
  readOnly?: boolean;
  onChange?: (data: DomainAdvanced) => void;
}

function DomainAdvancedTab({ data, readOnly, onChange }: DomainAdvancedTabProps) {
  const updateHeaders = (key: string, value: boolean) => {
    if (!onChange) return;
    onChange({
      ...data,
      headers: { ...data.headers, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">رؤوس HTTP</h4>
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="adv-hsts" className="text-sm font-medium">HSTS</Label>
              <p className="text-xs text-muted-foreground">HTTP Strict Transport Security</p>
            </div>
            <AppSwitch
              id="adv-hsts"
              checked={data.headers.hsts}
              disabled={readOnly}
              onCheckedChange={(val) => updateHeaders("hsts", val)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="adv-csp" className="text-sm font-medium">CSP</Label>
              <p className="text-xs text-muted-foreground">Content Security Policy</p>
            </div>
            <AppSwitch
              id="adv-csp"
              checked={data.headers.csp}
              disabled={readOnly}
              onCheckedChange={(val) => updateHeaders("csp", val)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="adv-xframe" className="text-sm font-medium">X-Frame-Options</Label>
              <p className="text-xs text-muted-foreground">منع التضمين في iframes</p>
            </div>
            <AppSwitch
              id="adv-xframe"
              checked={data.headers.xFrame}
              disabled={readOnly}
              onCheckedChange={(val) => updateHeaders("xFrame", val)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="adv-xss" className="text-sm font-medium">XSS Protection</Label>
              <p className="text-xs text-muted-foreground">حماية من هجمات XSS</p>
            </div>
            <AppSwitch
              id="adv-xss"
              checked={data.headers.xssProtection}
              disabled={readOnly}
              onCheckedChange={(val) => updateHeaders("xssProtection", val)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">الأداء</h4>
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="adv-cache" className="text-sm font-medium">التخزين المؤقت</Label>
              <p className="text-xs text-muted-foreground">تفعيل التخزين المؤقت للمحتوى الثابت</p>
            </div>
            <AppSwitch
              id="adv-cache"
              checked={data.cache}
              disabled={readOnly}
              onCheckedChange={(val) => onChange?.({ ...data, cache: val })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="adv-compression" className="text-sm font-medium">الضغط</Label>
              <p className="text-xs text-muted-foreground">تفعيل ضغط Gzip/Brotli</p>
            </div>
            <AppSwitch
              id="adv-compression"
              checked={data.compression}
              disabled={readOnly}
              onCheckedChange={(val) => onChange?.({ ...data, compression: val })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">الأمان</h4>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="adv-security" className="text-sm font-medium">الحماية المتقدمة</Label>
            <p className="text-xs text-muted-foreground">تفعيل جميع إجراءات الحماية المتقدمة</p>
          </div>
          <AppSwitch
            id="adv-security"
            checked={data.security}
            disabled={readOnly}
            onCheckedChange={(val) => onChange?.({ ...data, security: val })}
          />
        </div>
      </div>
    </div>
  );
}

export { DomainAdvancedTab };
