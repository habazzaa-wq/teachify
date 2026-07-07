"use client";

import { Upload, FolderOpen, type LucideIcon } from "lucide-react";
import { AppButton, AppEmptyState } from "@/components/ui";

interface MediaEmptyStateProps {
  hasFilters?: boolean;
  onCreateFolder?: () => void;
  onUpload?: () => void;
}

function MediaEmptyState({ hasFilters, onCreateFolder, onUpload }: MediaEmptyStateProps) {
  if (hasFilters) {
    return (
      <AppEmptyState
        icon={FolderOpen as LucideIcon}
        title="لا توجد نتائج"
        description="لم يتم العثور على ملفات تطابق معايير البحث. جرب تغيير الفلاتر."
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-inner">
        <Upload className="h-10 w-10 text-primary/60" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">مكتبة الوسائط فارغة</h3>
      <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
        ابدأ برفع الملفات أو إنشاء مجلد لتنظيم محتوى الوسائط الخاص بك.
      </p>
      <div className="flex gap-3">
        {onUpload && (
          <AppButton onClick={onUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            رفع ملف
          </AppButton>
        )}
        {onCreateFolder && (
          <AppButton variant="outline" onClick={onCreateFolder} className="gap-2">
            <FolderOpen className="h-4 w-4" />
            إنشاء مجلد
          </AppButton>
        )}
      </div>
    </div>
  );
}

export { MediaEmptyState };
