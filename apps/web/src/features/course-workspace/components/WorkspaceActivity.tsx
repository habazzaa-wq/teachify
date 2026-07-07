"use client";

import { motion } from "framer-motion";
import { Plus, CheckCircle, Archive, Pencil, RotateCcw } from "lucide-react";
import type { Course } from "@/features/courses/types";

interface WorkspaceActivityProps {
  course?: Course | null;
}

const activityIconMap = {
  created: { icon: Plus, color: "text-primary bg-primary/10" },
  published: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" },
  archived: { icon: Archive, color: "text-amber-500 bg-amber-500/10" },
  updated: { icon: Pencil, color: "text-blue-500 bg-blue-500/10" },
  restored: { icon: RotateCcw, color: "text-purple-500 bg-purple-500/10" },
} as const;

type ActionKey = keyof typeof activityIconMap;

function WorkspaceActivity({ course }: WorkspaceActivityProps) {
  if (!course) return null;

  const activities: Array<{ action: ActionKey; label: string; date: string }> = [
    { action: "created", label: "تم إنشاء الدورة", date: course.createdAt },
  ];

  if (course.publishedAt) {
    activities.push({ action: "published", label: "تم نشر الدورة", date: course.publishedAt });
  }
  if (course.archivedAt) {
    activities.push({ action: "archived", label: "تم أرشفة الدورة", date: course.archivedAt });
  }
  activities.push({ action: "updated", label: "آخر تحديث", date: course.updatedAt });

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
        {activities.map((act, i) => {
          const resolved = activityIconMap[act.action];
          const Icon = resolved.icon;
        return (
          <div key={i} className="flex items-start gap-4">
            <div className="relative flex flex-col items-center">
              <div className={`h-9 w-9 rounded-xl ${resolved.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              {i < activities.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>
            <div className="pt-1.5 min-w-0">
              <p className="text-sm font-medium">{act.label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {new Date(act.date).toLocaleDateString("ar", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

export { WorkspaceActivity };
