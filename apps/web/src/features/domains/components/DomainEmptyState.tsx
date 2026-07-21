"use client";

import { Globe, Plus, ArrowRight, BookOpen, Settings } from "lucide-react";
import { AppButton } from "@/components/ui";

interface DomainEmptyStateProps {
  onCreate: () => void;
}

function DomainEmptyState({ onCreate }: DomainEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
          <Globe className="h-10 w-10 text-primary/60" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background border shadow-sm">
          <Plus className="h-4 w-4 text-primary" />
        </div>
      </div>

      <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
        لا توجد نطاقات مخصصة بعد
      </h3>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-muted-foreground">
        ابدأ بإضافة نطاقك المخصص لربطه بمنصتك. يمكنك إعداد سجلات DNS وشهادات SSL بشكل تلقائي.
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <AppButton size="default" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          إضافة نطاق
          <ArrowRight className="h-4 w-4" />
        </AppButton>
        <AppButton variant="outline" size="default">
          <BookOpen className="h-4 w-4" />
          دليل البدء السريع
        </AppButton>
      </div>

      <div className="mt-10 grid max-w-lg grid-cols-3 gap-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs font-medium text-foreground">أضف نطاقك</p>
          <p className="text-[11px] text-muted-foreground">أدخل اسم النطاق المخصص</p>
        </div>
        <div className="space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs font-medium text-foreground">عرّف DNS</p>
          <p className="text-[11px] text-muted-foreground">أضف السجلات المطلوبة</p>
        </div>
        <div className="space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-foreground">فعّل SSL</p>
          <p className="text-[11px] text-muted-foreground">شهادة تلقائية مجانية</p>
        </div>
      </div>
    </div>
  );
}

export { DomainEmptyState };
