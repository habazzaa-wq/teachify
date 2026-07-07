"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  AppSwitch,
  Label,
  AppInput,
  AppButton,
  AppBadge,
  AppSelect,
  AppSelectTrigger,
  AppSelectValue,
  AppSelectContent,
  AppSelectItem,
} from "@/components/ui";
import type { RedirectRule } from "../types";

interface DomainRedirectTabProps {
  enabled: boolean;
  httpToHttps: boolean;
  wwwToNonWww: boolean;
  rules: RedirectRule[];
  readOnly?: boolean;
  onToggle?: (key: string, value: boolean) => void;
  onAddRule?: () => void;
  onRemoveRule?: (id: string) => void;
}

function DomainRedirectTab({
  enabled,
  httpToHttps,
  wwwToNonWww,
  rules,
  readOnly,
  onToggle,
  onAddRule,
  onRemoveRule,
}: DomainRedirectTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="redirect-enabled" className="text-sm font-medium">تفعيل التحويلات</Label>
          <p className="text-xs text-muted-foreground">إدارة تحويلات النطاق والمسارات</p>
        </div>
        <AppSwitch
          id="redirect-enabled"
          checked={enabled}
          disabled={readOnly}
          onCheckedChange={(val) => onToggle?.("enabled", val)}
        />
      </div>

      {enabled && (
        <>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">التحويلات التلقائية</h4>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="redirect-http" className="text-sm font-medium">HTTP → HTTPS</Label>
                <p className="text-xs text-muted-foreground">تحويل زوار HTTP إلى HTTPS تلقائياً</p>
              </div>
              <AppSwitch
                id="redirect-http"
                checked={httpToHttps}
                disabled={readOnly}
                onCheckedChange={(val) => onToggle?.("httpToHttps", val)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="redirect-www" className="text-sm font-medium">WWW → Non-WWW</Label>
                <p className="text-xs text-muted-foreground">تحويل زوار WWW إلى النطاق الرئيسي</p>
              </div>
              <AppSwitch
                id="redirect-www"
                checked={wwwToNonWww}
                disabled={readOnly}
                onCheckedChange={(val) => onToggle?.("wwwToNonWww", val)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">تحويلات مخصصة</h4>
              {!readOnly && (
                <AppButton variant="outline" size="sm" onClick={onAddRule}>
                  <Plus className="h-3.5 w-3.5" />
                  إضافة تحويل
                </AppButton>
              )}
            </div>

            {rules.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">لا توجد تحويلات مخصصة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-2 rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs truncate">{rule.source}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono text-xs truncate">{rule.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <AppBadge variant={rule.type === "permanent" ? "success" : "secondary"} className="text-[10px]">
                          {rule.type === "permanent" ? "دائم (301)" : "مؤقت (302)"}
                        </AppBadge>
                        <AppBadge variant={rule.status === "active" ? "success" : "outline"} className="text-[10px]">
                          {rule.status === "active" ? "نشط" : "غير نشط"}
                        </AppBadge>
                      </div>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => onRemoveRule?.(rule.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { DomainRedirectTab };
