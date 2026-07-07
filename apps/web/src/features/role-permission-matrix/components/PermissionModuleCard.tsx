"use client";

import { memo, useCallback } from "react";
import { ChevronDown, ChevronLeft, CheckSquare, Square } from "lucide-react";
import { AppCheckbox, AppBadge, AppButton } from "@/components/ui";
import { MODULE_CONFIG, RISK_LEVEL_CONFIG } from "../constants";
import * as Icons from "lucide-react";
import type { MatrixPermission, ExpandedModules, RiskLevel } from "../types";

interface PermissionModuleCardProps {
  module: string;
  permissions: MatrixPermission[];
  rolePermissions: Record<string, boolean>;
  expanded: boolean;
  onToggleExpand: () => void;
  onTogglePermission: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  search?: string;
  riskFilter?: RiskLevel | "all";
  readOnly?: boolean;
}

function getIconComponent(iconName: string) {
  const icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return icon ?? Icons.Shield;
}

const PermissionModuleCard = memo(function PermissionModuleCard({
  module,
  permissions,
  rolePermissions,
  expanded,
  onToggleExpand,
  onTogglePermission,
  onSelectAll,
  onClearAll,
  search,
  riskFilter,
  readOnly,
}: PermissionModuleCardProps) {
  const config = MODULE_CONFIG[module as keyof typeof MODULE_CONFIG];
  if (!config) return null;

  const IconComponent = getIconComponent(config.icon);

  const filtered = permissions.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch =
        p.key.toLowerCase().includes(q) ||
        p.nameAr.includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.description.includes(q);
      if (!matchesSearch) return false;
    }
    if (riskFilter && riskFilter !== "all" && p.riskLevel !== riskFilter) return false;
    return true;
  });

  const enabledCount = filtered.filter((p) => rolePermissions[p.key]).length;

  const allEnabled = filtered.length > 0 && filtered.every((p) => rolePermissions[p.key]);
  const noneEnabled = filtered.every((p) => !rolePermissions[p.key]);

  const handleModuleToggle = useCallback(() => {
    if (allEnabled) {
      onClearAll();
    } else {
      onSelectAll();
    }
  }, [allEnabled, onClearAll, onSelectAll]);

  if (filtered.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="flex-1 text-start min-w-0">
          <p className="text-sm font-semibold">{config.label}</p>
          <p className="text-[10px] text-muted-foreground">
            {enabledCount}/{filtered.length} صلاحية مفعلة
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <AppButton
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuleToggle();
                }}
              >
                {allEnabled ? (
                  <>
                    <Square className="h-3 w-3" />
                    مسح الكل
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3 w-3" />
                    تحديد الكل
                  </>
                )}
              </AppButton>
            </>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "" : "-rotate-90"}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-border/50">
          {filtered.map((permission) => {
            const riskConfig = RISK_LEVEL_CONFIG[permission.riskLevel];
            const isEnabled = rolePermissions[permission.key] ?? false;

            return (
              <div
                key={permission.id}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isEnabled ? "bg-primary/5" : "hover:bg-muted/30"
                }`}
              >
                {readOnly ? (
                  <div
                    className={`h-4 w-4 rounded border ${
                      isEnabled ? "bg-primary border-primary" : "border-input"
                    }`}
                  >
                    {isEnabled && (
                      <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <AppCheckbox
                    checked={isEnabled}
                    onCheckedChange={() => onTogglePermission(permission.key)}
                    className="transition-all duration-200 data-[state=checked]:scale-110"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono font-medium text-foreground">
                      {permission.key}
                    </code>
                    <AppBadge
                      variant={riskConfig.color as "success" | "warning" | "destructive"}
                      className="h-4 px-1 text-[8px]"
                    >
                      {riskConfig.label}
                    </AppBadge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {permission.nameAr}
                  </p>
                  {permission.description && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-1">
                      {permission.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export { PermissionModuleCard };
