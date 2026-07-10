"use client";

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
} from "@/components/ui";
import { StudioSearch } from "@/components/studio/primitives/StudioSearch";
import { CONTENT_TYPE_CONFIG } from "@/features/course-content/constants";
import type { ContentItemType } from "@/features/course-content/types";
import { cn } from "@/lib/cn";

interface CourseStudioContentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: ContentItemType) => void;
}

const DESCRIPTIONS: Record<ContentItemType, string> = {
  video: "اختيار وسائط موجودة من المكتبة",
  pdf: "اختيار مستند PDF موجود",
  audio: "اختيار ملف صوتي موجود",
  resource: "اختيار ملف مرفق موجود",
  exam: "اختيار اختبار موجود",
  assignment: "اختيار واجب موجود",
  live: "إعداد جلسة مباشرة",
  external_link: "إضافة رابط خارجي",
  scorm: "رفع حزمة SCORM",
  certificate: "ربط شهادة إتمام",
};

const GROUPS: Array<{ label: string; types: ContentItemType[] }> = [
  { label: "المحتوى الأساسي", types: ["video", "pdf", "audio", "resource"] },
  { label: "التقييم", types: ["exam", "assignment"] },
  { label: "متقدم", types: ["live", "external_link", "scorm", "certificate"] },
];

function CourseStudioContentPicker({
  open,
  onOpenChange,
  onSelect,
}: CourseStudioContentPickerProps) {
  const handleSelect = useCallback(
    (type: ContentItemType) => {
      onSelect(type);
      onOpenChange(false);
    },
    [onSelect, onOpenChange],
  );

  const groups = useMemo(() => GROUPS, []);

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <AppDialogHeader>
          <AppDialogTitle className="text-xl">إضافة محتوى</AppDialogTitle>
          <AppDialogDescription>اختر نوع المحتوى لإضافته إلى القسم</AppDialogDescription>
        </AppDialogHeader>

        <div className="space-y-6 p-4 pt-1">
          {groups.map((group, groupIndex) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-studio-fg-muted">
                {group.label}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {group.types.map((type, index) => {
                  const config = CONTENT_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={type}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: groupIndex * 0.08 + index * 0.03,
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelect(type)}
                      className={cn(
                        "group flex flex-col items-start gap-3 rounded-xl border border-studio-border bg-studio-surface p-4 text-start",
                        "transition-all duration-200 hover:border-studio-accent-border hover:bg-studio-accent-soft/40",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-1",
                      )}
                      aria-label={`إضافة ${config.label}`}
                    >
                      <span
                        className={cn(
                          "rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-110",
                          config.bg,
                          config.color,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="space-y-1">
                        <span className="block text-sm font-bold text-studio-fg">
                          {config.label}
                        </span>
                        <span className="block text-[11px] leading-relaxed text-studio-fg-muted">
                          {DESCRIPTIONS[type]}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

export { CourseStudioContentPicker };
