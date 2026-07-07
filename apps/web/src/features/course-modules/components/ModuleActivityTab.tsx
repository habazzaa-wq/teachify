"use client";

import { Clock } from "lucide-react";

export function ModuleActivityTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Clock className="h-10 w-10 text-muted-foreground/20 mb-3" />
      <p className="text-sm text-muted-foreground/60">سجل النشاط غير متاح حالياً</p>
    </div>
  );
}
