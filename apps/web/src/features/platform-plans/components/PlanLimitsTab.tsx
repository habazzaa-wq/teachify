"use client";

import { useCallback, memo } from "react";
import { Infinity } from "lucide-react";
import { AppInput, AppSwitch, Label, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PlanLimits } from "../types";

interface LimitRowProps {
  label: string;
  value: number | null;
  suffix?: string;
  onChange: (value: number | null) => void;
}

const LimitRow = memo(function LimitRow({ label, value, suffix, onChange }: LimitRowProps) {
  const isUnlimited = value === null;

  return (
    <div className="rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-medium text-foreground/90">{label}</Label>
        <div className="flex items-center gap-2">
          <Infinity
            className={cn(
              "h-3.5 w-3.5 transition-colors duration-200",
              isUnlimited ? "text-primary" : "text-muted-foreground/20",
            )}
          />
          <AppSwitch
            checked={isUnlimited}
            onCheckedChange={(checked) => onChange(checked ? null : 0)}
            aria-label={`تفعيل غير محدود لـ ${label}`}
          />
        </div>
      </div>
      <div className={cn("flex items-center gap-2", isUnlimited && "opacity-40 pointer-events-none")}>
        <AppInput
          type="number"
          min={0}
          value={isUnlimited ? "" : value ?? 0}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : parseInt(v) || 0);
          }}
          disabled={isUnlimited}
          placeholder="غير محدود"
          className="h-9 text-sm"
        />
        {suffix && (
          <span className="text-xs text-muted-foreground shrink-0 font-medium">{suffix}</span>
        )}
      </div>
    </div>
  );
});

interface PlanLimitsTabProps {
  limits: PlanLimits;
  onChange: (limits: PlanLimits) => void;
}

function PlanLimitsTab({ limits, onChange }: PlanLimitsTabProps) {
  const updateLimit = useCallback(
    (field: keyof PlanLimits, value: number | null) => {
      onChange({ ...limits, [field]: value });
    },
    [limits, onChange],
  );

  return (
    <div className="space-y-6">
      {/* Users */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">حدود المستخدمين</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LimitRow label="المشرفون" value={limits.admins} onChange={(v) => updateLimit("admins", v)} />
            <LimitRow label="المدرّبون" value={limits.instructors} onChange={(v) => updateLimit("instructors", v)} />
            <LimitRow label="الطلاب" value={limits.students} onChange={(v) => updateLimit("students", v)} />
          </div>
        </AppCardContent>
      </AppCard>

      {/* Content */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">حدود المحتوى</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LimitRow label="الدورات" value={limits.courses} onChange={(v) => updateLimit("courses", v)} />
            <LimitRow label="الأقسام" value={limits.sections} onChange={(v) => updateLimit("sections", v)} />
            <LimitRow label="الدروس" value={limits.lessons} onChange={(v) => updateLimit("lessons", v)} />
            <LimitRow label="الفيديوهات" value={limits.videos} onChange={(v) => updateLimit("videos", v)} />
            <LimitRow label="الشهادات" value={limits.certificates} onChange={(v) => updateLimit("certificates", v)} />
            <LimitRow label="الاختبارات" value={limits.quizzes} onChange={(v) => updateLimit("quizzes", v)} />
            <LimitRow label="الواجبات" value={limits.assignments} onChange={(v) => updateLimit("assignments", v)} />
            <LimitRow label="مواضيع النقاش" value={limits.discussionThreads} onChange={(v) => updateLimit("discussionThreads", v)} />
            <LimitRow label="المراجع" value={limits.bookmarks} onChange={(v) => updateLimit("bookmarks", v)} />
            <LimitRow label="الملاحظات" value={limits.notes} onChange={(v) => updateLimit("notes", v)} />
          </div>
        </AppCardContent>
      </AppCard>

      {/* Usage */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">حدود الاستخدام</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LimitRow label="الإشعارات (شهرياً)" value={limits.notificationsPerMonth} onChange={(v) => updateLimit("notificationsPerMonth", v)} />
            <LimitRow label="طلبات API" value={limits.apiRequests} onChange={(v) => updateLimit("apiRequests", v)} />
            <LimitRow label="التخزين" value={limits.storage} onChange={(v) => updateLimit("storage", v)} suffix="GB" />
            <LimitRow label="النطاق" value={limits.bandwidth} onChange={(v) => updateLimit("bandwidth", v)} suffix="GB" />
            <LimitRow label="الحد الأقصى للرفع" value={limits.maximumUploadSize} onChange={(v) => updateLimit("maximumUploadSize", v)} suffix="GB" />
            <LimitRow label="الحد الأقصى لمدة الفيديو" value={limits.maximumVideoDuration} onChange={(v) => updateLimit("maximumVideoDuration", v)} suffix="دقيقة" />
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

export { PlanLimitsTab };
