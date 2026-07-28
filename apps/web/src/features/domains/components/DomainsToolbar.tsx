"use client";

import { Search, RefreshCw, ArrowUpDown } from "lucide-react";
import { AppButton, AppInput, AppSelect, AppSelectTrigger, AppSelectValue, AppSelectContent, AppSelectItem } from "@/components/ui";
import { STATUS_OPTIONS, TYPE_OPTIONS, SSL_OPTIONS, VERIFICATION_OPTIONS, SORT_OPTIONS } from "../constants";
import type { DomainStatus, DomainType, SslStatus, VerificationStatus } from "../types";

interface DomainsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: DomainStatus | "all";
  onStatusChange: (value: DomainStatus | "all") => void;
  typeFilter: DomainType | "all";
  onTypeChange: (value: DomainType | "all") => void;
  sslFilter: SslStatus | "all";
  onSslChange: (value: SslStatus | "all") => void;
  verificationFilter: VerificationStatus | "all";
  onVerificationChange: (value: VerificationStatus | "all") => void;
  sort: string;
  onSortChange: (value: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

function DomainsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  sslFilter,
  onSslChange,
  verificationFilter,
  onVerificationChange,
  sort,
  onSortChange,
  onRefresh,
  refreshing,
}: DomainsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <AppInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث عن نطاق..."
          className="ps-9 h-9"
        />
      </div>

      <AppSelect
        value={statusFilter}
        onValueChange={(val) => onStatusChange(val as DomainStatus | "all")}
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
        value={typeFilter}
        onValueChange={(val) => onTypeChange(val as DomainType | "all")}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="النوع" />
        </AppSelectTrigger>
        <AppSelectContent>
          {TYPE_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={sslFilter}
        onValueChange={(val) => onSslChange(val as SslStatus | "all")}
      >
        <AppSelectTrigger className="h-9 w-[130px]">
          <AppSelectValue placeholder="SSL" />
        </AppSelectTrigger>
        <AppSelectContent>
          {SSL_OPTIONS.map((opt) => (
            <AppSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </AppSelectItem>
          ))}
        </AppSelectContent>
      </AppSelect>

      <AppSelect
        value={verificationFilter}
        onValueChange={(val) => onVerificationChange(val as VerificationStatus | "all")}
      >
        <AppSelectTrigger className="h-9 w-[150px]">
          <AppSelectValue placeholder="التحقق" />
        </AppSelectTrigger>
        <AppSelectContent>
          {VERIFICATION_OPTIONS.map((opt) => (
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

export { DomainsToolbar };
