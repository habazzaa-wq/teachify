"use client";

import { FileText } from "lucide-react";
import type { TenantUser } from "../types";

interface TenantUserNotesTabProps {
  user: TenantUser;
}

function TenantUserNotesTab({ user }: TenantUserNotesTabProps) {
  if (!user.notes) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-8 w-8 mb-2" />
        <p className="text-sm">لا توجد ملاحظات</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3">ملاحظات عن المستخدم</h4>
      <p className="text-sm whitespace-pre-wrap">{user.notes}</p>
    </div>
  );
}

export { TenantUserNotesTab };
