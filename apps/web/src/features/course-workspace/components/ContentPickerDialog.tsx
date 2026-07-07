"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
} from "@/components/ui";
import { CONTENT_PICKER_OPTIONS } from "@/features/course-content/constants";
import type { ContentItemType } from "@/features/course-content/types";
import { cn } from "@/lib/cn";

interface ContentPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: ContentItemType) => void;
}

const typeDescriptions: Record<string, string> = {
  video: "أضف فيديو تعليمي من المكتبة",
  pdf: "ارفع ملف PDF للطلاب",
  exam: "تصميم اختبار تفاعلي",
  assignment: "إضافة واجب للتقييم",
  resource: "مرفقات وملفات إضافية",
  audio: "ملفات صوتية وبودكاست",
  live: "جلسة تفاعلية مباشرة",
  scorm: "محتوى SCORM تفاعلي",
  external_link: "رابط خارجي لمحتوى إضافي",
  certificate: "أضف شهادة إتمام للدورة",
};

const typeGradients: Record<string, string> = {
  video: "from-blue-500/20 via-blue-500/5 to-transparent",
  pdf: "from-rose-500/20 via-rose-500/5 to-transparent",
  exam: "from-purple-500/20 via-purple-500/5 to-transparent",
  assignment: "from-amber-500/20 via-amber-500/5 to-transparent",
  audio: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  resource: "from-cyan-500/20 via-cyan-500/5 to-transparent",
  live: "from-red-500/20 via-red-500/5 to-transparent",
  scorm: "from-indigo-500/20 via-indigo-500/5 to-transparent",
  external_link: "from-sky-500/20 via-sky-500/5 to-transparent",
  certificate: "from-yellow-500/20 via-yellow-500/5 to-transparent",
};

function ContentPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: ContentPickerDialogProps) {
  const handleSelect = useCallback(
    (type: ContentItemType) => {
      onSelect(type);
      onOpenChange(false);
    },
    [onSelect, onOpenChange],
  );

  return (
    <AppDialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <AppDialogHeader className="pb-4">
          <AppDialogTitle className="text-2xl text-center">إضافة محتوى جديد</AppDialogTitle>
          <AppDialogDescription className="text-center">
            اختر نوع المحتوى الذي تريد إضافته إلى القسم
          </AppDialogDescription>
        </AppDialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 pt-2">
          {CONTENT_PICKER_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const gradient = typeGradients[option.type] ?? "from-primary/20 via-primary/5 to-transparent";
            return (
              <motion.button
                key={option.type}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handleSelect(option.type)}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-5 sm:p-6 text-center",
                  "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
                  "transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 group",
                  "relative overflow-hidden",
                )}
                role="button"
                tabIndex={0}
                aria-label={`إضافة ${option.label}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(option.type);
                  }
                }}
              >
                {/* GRADIENT BACKGROUND */}
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />

                {/* ICON */}
                <span className={cn(
                  option.bg,
                  option.color,
                  "p-4 rounded-2xl ring-1 ring-inset ring-black/5 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 relative z-10",
                )}>
                  <Icon className="h-7 w-7" />
                </span>

                {/* LABEL & DESCRIPTION */}
                <div className="space-y-1 relative z-10">
                  <span className="font-bold text-sm">{option.label}</span>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed text-balance">
                    {typeDescriptions[option.type] ?? "أضف محتوى تعليمي"}
                  </p>
                </div>

                {/* HOVER SHINE */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out pointer-events-none" />
              </motion.button>
            );
          })}
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}

export { ContentPickerDialog };
