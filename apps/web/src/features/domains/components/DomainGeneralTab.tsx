"use client";

import {
  AppInput,
  Label,
  AppTextarea,
  AppSwitch,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
} from "@/components/ui";
import type { DomainType, CreateDomainPayload } from "../types";

interface DomainGeneralTabProps {
  data: Partial<CreateDomainPayload>;
  onChange: (data: Partial<CreateDomainPayload>) => void;
  readOnly?: boolean;
  tenants?: { id: string; name: string }[];
}

function DomainGeneralTab({ data, onChange, readOnly, tenants }: DomainGeneralTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">معلومات النطاق</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="domain-tenant">العميل</Label>
            {readOnly ? (
              <div className="h-9 rounded-md border bg-muted/50 px-3 text-sm flex items-center">
                {data.tenantId || "—"}
              </div>
            ) : (
              <AppSelect
                value={data.tenantId ?? ""}
                onValueChange={(val) => onChange({ ...data, tenantId: val })}
                disabled={readOnly}
              >
                <AppSelectTrigger id="domain-tenant" className="h-9">
                  <AppSelectValue placeholder="اختر العميل" />
                </AppSelectTrigger>
                <AppSelectContent>
                  {(tenants ?? []).map((t) => (
                    <AppSelectItem key={t.id} value={t.id}>
                      {t.name}
                    </AppSelectItem>
                  ))}
                </AppSelectContent>
              </AppSelect>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain-name">النطاق</Label>
            <AppInput
              id="domain-name"
              value={data.domain ?? ""}
              onChange={(e) => onChange({ ...data, domain: e.target.value })}
              placeholder="example.com"
              readOnly={readOnly}
              className={readOnly ? "bg-muted/50" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain-subdomain">النطاق الفرعي</Label>
            <AppInput
              id="domain-subdomain"
              value={data.subdomain ?? ""}
              onChange={(e) => onChange({ ...data, subdomain: e.target.value })}
              placeholder="www"
              readOnly={readOnly}
              className={readOnly ? "bg-muted/50" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain-type">النوع</Label>
            {readOnly ? (
              <div className="h-9 rounded-md border bg-muted/50 px-3 text-sm flex items-center">
                {data.type ?? "—"}
              </div>
            ) : (
              <AppSelect
                value={data.type ?? ""}
                onValueChange={(val) => onChange({ ...data, type: val as DomainType })}
                disabled={readOnly}
              >
                <AppSelectTrigger id="domain-type" className="h-9">
                  <AppSelectValue placeholder="اختر النوع" />
                </AppSelectTrigger>
                <AppSelectContent>
                  <AppSelectItem value="platform">النظام الأساسي</AppSelectItem>
                  <AppSelectItem value="custom">مخصص</AppSelectItem>
                  <AppSelectItem value="wildcard">شامل</AppSelectItem>
                  <AppSelectItem value="temporary">مؤقت</AppSelectItem>
                </AppSelectContent>
              </AppSelect>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">الإعدادات</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="domain-primary" className="text-sm font-medium">نطاق أساسي</Label>
              <p className="text-xs text-muted-foreground">تعيين هذا النطاق كأساسي للعميل</p>
            </div>
            <AppSwitch
              id="domain-primary"
              checked={data.isPrimary ?? false}
              onCheckedChange={(val) => onChange({ ...data, isPrimary: val })}
              disabled={readOnly}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="domain-active" className="text-sm font-medium">نشط</Label>
              <p className="text-xs text-muted-foreground">تفعيل النطاق فور الإنشاء</p>
            </div>
            <AppSwitch
              id="domain-active"
              checked={data.active ?? true}
              onCheckedChange={(val) => onChange({ ...data, active: val })}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain-notes">ملاحظات</Label>
        <AppTextarea
          id="domain-notes"
          value={data.notes ?? ""}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="ملاحظات إضافية حول النطاق..."
          readOnly={readOnly}
          className={readOnly ? "bg-muted/50" : ""}
          rows={3}
        />
      </div>
    </div>
  );
}

export { DomainGeneralTab };
