"use client";

import { Table2 } from "lucide-react";
import { AppEmptyState } from "@/components/ui";

function MatrixEmptyState() {
  return (
    <AppEmptyState
      icon={Table2}
      title="اختر دوراً لعرض الصلاحيات"
      description="اختر دوراً من القائمة الجانبية لعرض مصفوفة الصلاحيات الخاصة به."
    />
  );
}

export { MatrixEmptyState };
