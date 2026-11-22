"use client";

import { BookOpen, CalendarDays } from "lucide-react";
import {
  AppDialog,
  AppDialogContent,
  AppDialogHeader,
  AppDialogTitle,
  AppDialogDescription,
} from "@/components/ui";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectLecture: () => void;
  onSelectSession: () => void;
}

export function CourseStudioAddItemChoiceDialog({ open, onClose, onSelectLecture, onSelectSession }: Props) {
  const options = [
    {
      key: "lecture",
      title: "محاضرة",
      description: "أضف محاضرة لتنظيم أقسام ومحتوى الكورس",
      icon: BookOpen,
      onClick: onSelectLecture,
    },
    {
      key: "session",
      title: "جلسة",
      description: "أضف جلسة مباشرة أو ميدانية أو حضورية تظهر للطلاب في المنهج",
      icon: CalendarDays,
      onClick: onSelectSession,
    },
  ] as const;

  return (
    <AppDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AppDialogContent className="sm:max-w-xl">
        <AppDialogHeader>
          <AppDialogTitle>ماذا تريد أن تضيف؟</AppDialogTitle>
          <AppDialogDescription>اختر نوع العنصر الذي تريد إضافته إلى منهج الكورس.</AppDialogDescription>
        </AppDialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 pt-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => { onClose(); opt.onClick(); }}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border border-studio-border bg-studio-surface p-4 text-start",
                  "transition-all duration-200 hover:border-studio-accent-border hover:bg-studio-accent-soft/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring"
                )}
              >
                <span className="rounded-xl p-2.5 bg-studio-accent-soft text-studio-accent"><Icon className="h-5 w-5" /></span>
                <div>
                  <div className="font-semibold text-studio-fg">{opt.title}</div>
                  <div className="text-xs text-studio-fg-muted mt-1">{opt.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </AppDialogContent>
    </AppDialog>
  );
}
