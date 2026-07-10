"use client";

import { motion } from "framer-motion";
import { Eye, Send, Pencil, Share2, BarChart3, ArrowLeft } from "lucide-react";
import { AppButton, AppBreadcrumb } from "@/components/ui";
import { PermissionGuard } from "@/components/ui/PermissionGuard";
import type { Course } from "@/features/courses/types";

interface WorkspaceHeaderProps {
  course?: Course | null;
  loading?: boolean;
  onPublish?: () => void;
  publishPending?: boolean;
  onEdit?: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  onAnalytics?: () => void;
}

function WorkspaceHeader({ course, loading, onPublish, publishPending, onEdit, onPreview, onShare, onAnalytics }: WorkspaceHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl -mx-8 px-8 py-4 border-b border-border/50"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <AppBreadcrumb
          items={[
            { label: "الدورات", href: "/teacher/courses" },
            { label: loading ? "..." : (course?.title ?? "غير معروف"), href: "#" },
          ]}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <PermissionGuard permission="courses.update">
            {onEdit && (
              <AppButton variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                تعديل
              </AppButton>
            )}
          </PermissionGuard>
          <AppButton variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={onPreview}>
            <Eye className="h-4 w-4" />
            معاينة
          </AppButton>
          <AppButton variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            مشاركة
          </AppButton>
          {onAnalytics && (
            <AppButton variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={onAnalytics}>
              <BarChart3 className="h-4 w-4" />
              تحليلات
            </AppButton>
          )}
          <PermissionGuard permission="courses.update">
            {onPublish && course?.status !== "published" && (
              <AppButton
                variant="default"
                size="sm"
                className="rounded-xl gap-2 h-9 shadow-sm"
                onClick={onPublish}
                loading={publishPending}
              >
                <Send className="h-4 w-4" />
                نشر
              </AppButton>
            )}
          </PermissionGuard>
        </div>
      </div>
    </motion.div>
  );
}

export { WorkspaceHeader };
