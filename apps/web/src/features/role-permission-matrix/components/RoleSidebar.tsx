"use client";

import { useMemo, useState } from "react";
import { Search, Shield, Users, Key } from "lucide-react";
import { AppInput, AppBadge, Skeleton } from "@/components/ui";
import * as Icons from "lucide-react";
import type { MatrixRole } from "../types";

interface RoleSidebarProps {
  roles: MatrixRole[];
  selectedRoleId: string | null;
  onSelectRole: (role: MatrixRole) => void;
  loading?: boolean;
}

function getIconComponent(iconName: string) {
  const icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return icon ?? Icons.Shield;
}

function RoleSidebar({ roles, selectedRoleId, onSelectRole, loading }: RoleSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) => r.name.toLowerCase().includes(q) || r.nameAr.includes(q),
    );
  }, [roles, search]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن دور..."
          className="ps-9 h-9 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-0.5">
        {filtered.map((role) => {
          const isSelected = role.id === selectedRoleId;
          const IconComponent = getIconComponent(role.icon);

          return (
            <button
              key={role.id}
              onClick={() => onSelectRole(role)}
              className={`w-full text-start flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                isSelected
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                  : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
              }`}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${role.color}1a`, color: role.color }}
              >
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{role.nameAr}</p>
                <p className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {role.usersCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    {role.permissionsCount}
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {role.isDefault && (
                  <AppBadge variant="secondary" className="h-4 px-1 text-[8px]">
                    افتراضي
                  </AppBadge>
                )}
                {role.isSystem && (
                  <AppBadge variant="outline" className="h-4 px-1 text-[8px]">
                    نظام
                  </AppBadge>
                )}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Shield className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">لا توجد نتائج</p>
          </div>
        )}
      </div>
    </div>
  );
}

export { RoleSidebar };
