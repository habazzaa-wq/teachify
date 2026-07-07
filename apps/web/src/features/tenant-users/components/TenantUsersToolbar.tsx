"use client";

import { Search, RefreshCw, ArrowUpDown } from "lucide-react";
import { AppButton, AppInput, AppSelect, AppSelectTrigger, AppSelectValue, AppSelectContent, AppSelectItem } from "@/components/ui";
import { STATUS_OPTIONS, DEPARTMENT_OPTIONS, ROLE_OPTIONS, TWO_FACTOR_OPTIONS, LAST_LOGIN_OPTIONS, DATE_CREATED_OPTIONS, SORT_OPTIONS } from "../constants";
import type { UserStatus, UserRoleSlug, DepartmentSlug } from "../types";

interface TenantUsersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: UserStatus | "all";
  onStatusChange: (value: UserStatus | "all") => void;
  departmentFilter: DepartmentSlug | "all";
  onDepartmentChange: (value: DepartmentSlug | "all") => void;
  roleFilter: UserRoleSlug | "all";
  onRoleChange: (value: UserRoleSlug | "all") => void;
  twoFactorFilter: string;
  onTwoFactorChange: (value: string) => void;
  lastLoginFilter: string;
  onLastLoginChange: (value: string) => void;
  dateCreatedFilter: string;
  onDateCreatedChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

function TenantUsersToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
  roleFilter,
  onRoleChange,
  twoFactorFilter,
  onTwoFactorChange,
  lastLoginFilter,
  onLastLoginChange,
  dateCreatedFilter,
  onDateCreatedChange,
  sort,
  onSortChange,
  onRefresh,
  refreshing,
}: TenantUsersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث بالاسم أو البريد أو الهاتف..."
          className="ps-9 h-9"
        />
      </div>

      <AppSelect
        value={statusFilter}
        onValueChange={(val) => onStatusChange(val as UserStatus | "all")}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="الحالة" />
        </AppSelectTrigger>
        <AppSelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={departmentFilter}
        onValueChange={(val) => onDepartmentChange(val as DepartmentSlug | "all")}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="القسم" />
        </AppSelectTrigger>
        <AppSelectContent>
          {DEPARTMENT_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={roleFilter}
        onValueChange={(val) => onRoleChange(val as UserRoleSlug | "all")}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="الدور" />
        </AppSelectTrigger>
        <AppSelectContent>
          {ROLE_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={twoFactorFilter}
        onValueChange={onTwoFactorChange}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="2FA" />
        </AppSelectTrigger>
        <AppSelectContent>
          {TWO_FACTOR_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={lastLoginFilter}
        onValueChange={onLastLoginChange}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="آخر دخول" />
        </AppSelectTrigger>
        <AppSelectContent>
          {LAST_LOGIN_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={dateCreatedFilter}
        onValueChange={onDateCreatedChange}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="تاريخ الإنشاء" />
        </AppSelectTrigger>
        <AppSelectContent>
          {DATE_CREATED_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect value={sort} onValueChange={onSortChange}>
        <AppSelectTrigger className="h-9 w-[130px]">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <AppSelectValue placeholder="ترتيب" />
        </AppSelectTrigger>
        <AppSelectContent>
          {SORT_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppButton variant="outline" size="sm" className="h-9" onClick={onRefresh} loading={refreshing}>
        <RefreshCw className="h-4 w-4" />
        تحديث
      </AppButton>
    </div>
  );
}

export { TenantUsersToolbar };
