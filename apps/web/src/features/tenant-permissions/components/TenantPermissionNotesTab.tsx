"use client";

import { FileText } from "lucide-react";
import type { TenantPermission } from "../types";

interface TenantPermissionNotesTabProps {
  permission: TenantPermission;
}

function TenantPermissionNotesTab({ permission }: TenantPermissionNotesTabProps) {
  if (!permission.notes) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">لا توجد ملاحظات لهذه الصلاحية</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      <h4 className="text-sm font-semibold text-foreground mb-3">ملاحظات داخلية</h4>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{permission.notes}</p>
    </div>
  );
}

export { TenantPermissionNotesTab };
