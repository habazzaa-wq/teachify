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
import { CONTENT_TYPE_CONFIG } from "@/features/course-content/constants";
import type { ContentItemType } from "@/features/course-content/types";
import { cn } from "@/lib/cn";

interface ContentPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Extension point: the studio maps the picked type onto the existing lesson creation hook. */
  onSelect: (type: ContentItemType) => void;
}

const DESCRIPTIONS: Record<ContentItemType, string> = {
  video: "درس فيديو عبر مسار الوسائط الحالي",
  pdf: "مستند PDF للقراءة والتحميل",
  audio: "درس صوتي أو بودكاست",
  resource: "ملف مرفق أو مادة داعمة",
  exam: "اختبار يُبنى عبر وحدة الاختبارات",
  assignment: "واجب يُدار عبر وحدة الواجبات",
  live: "جلسة تفاعلية مباشرة",
  external_link: "رابط لمحتوى خارجي",
  scorm: "حزمة SCORM تفاعلية",
  certificate: "شهادة إتمام مرتبطة بالدورة",
};

const GROUPS: Array<{ label: string; types: ContentItemType[] }> = [
  { label: "المحتوى الأساسي", types: ["video", "pdf", "audio", "resource"] },
  { label: "التقييم", types: ["exam", "assignment"] },
  { label: "متقدم", types: ["live", "external_link", "scorm", "certificate"] },
];

/**
 * Professional content picker. Selecting a type only calls the extension
 * point (`onSelect`) — no uploads and no assessment builders live here.
 */
function ContentPickerDialog({ open, onOpenChange, onSelect }: ContentPickerDialogProps) {
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
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </h3>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelect(type)}
                      className={cn(
                        "group flex flex-col items-start gap-2.5 rounded-xl border border-border/60 bg-card p-3.5 text-start",
                        "transition-colors duration-200 hover:border-primary/40 hover:bg-accent/40",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      )}
                      aria-label={`إضافة ${config.label}`}
                    >
                      <span
                        className={cn(
                          config.bg,
                          config.color,
                          "rounded-lg p-2 transition-transform duration-200 group-hover:scale-110",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                      </span>
                      <span className="space-y-0.5">
                        <span className="block text-xs font-bold text-foreground">{config.label}</span>
                        <span className="block text-[10px] leading-relaxed text-muted-foreground/70">
                          {DESCRIPTIONS[type]}
                        </span>
                      </span>
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

export { ContentPickerDialog };
