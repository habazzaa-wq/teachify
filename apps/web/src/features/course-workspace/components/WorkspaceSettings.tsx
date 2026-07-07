"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Lock, ShieldAlert, Tag, Languages, BarChart3, FileText, Calendar, Eye, Trash2, RotateCcw, Archive, Star } from "lucide-react";
import { AppCard, AppBadge, AppButton, AppSwitch, AppDivider, Skeleton, AppConfirmDialog } from "@/components/ui";
import { PermissionGuard } from "@/components/ui/PermissionGuard";
import { COURSE_STATUS_CONFIG, COURSE_VISIBILITY_CONFIG, COURSE_DIFFICULTY_CONFIG, PRICING_TYPE_CONFIG } from "@/features/courses/constants";
import { useArchiveCourse, useRestoreCourse, useDeleteCourse, useUpdateCourse, useToggleFeatureCourse } from "@/features/courses/hooks";
import type { Course } from "@/features/courses/types";
import { formatDate } from "@/lib/format";

interface WorkspaceSettingsProps {
  course?: Course | null;
  courseId: string;
}

function WorkspaceSettings({ course, courseId }: WorkspaceSettingsProps) {
  const archiveCourse = useArchiveCourse();
  const restoreCourse = useRestoreCourse();
  const deleteCourse = useDeleteCourse();
  const updateCourse = useUpdateCourse();
  const toggleFeature = useToggleFeatureCourse();

  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!course) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const statusConfig = COURSE_STATUS_CONFIG[course.status];
  const visibilityConfig = COURSE_VISIBILITY_CONFIG[course.visibility];
  const difficultyConfig = COURSE_DIFFICULTY_CONFIG[course.difficulty];
  const pricingConfig = PRICING_TYPE_CONFIG[course.pricingType];

  const handleToggleFeature = () => {
    toggleFeature.mutate(courseId);
  };

  const handleArchive = () => {
    archiveCourse.mutate(courseId);
    setArchiveConfirmOpen(false);
  };

  const handleRestore = () => {
    restoreCourse.mutate(courseId);
  };

  const handleDelete = () => {
    deleteCourse.mutate(courseId);
    setDeleteConfirmOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AppCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">الرؤية والحالة</h4>
            <p className="text-xs text-muted-foreground/70">إعدادات ظهور وحالة الدورة</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">الحالة</p>
            <AppBadge variant={statusConfig.color as any}>{statusConfig.label}</AppBadge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">الرؤية</p>
            <AppBadge variant={visibilityConfig.color as any}>{visibilityConfig.label}</AppBadge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">مميزة</p>
            <PermissionGuard permission="courses.update">
              <div className="flex items-center gap-2">
                <AppSwitch checked={course.featured} onCheckedChange={handleToggleFeature} />
                <span className="text-xs text-muted-foreground/60">{course.featured ? "مميزة" : "غير مميزة"}</span>
              </div>
            </PermissionGuard>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">الشهادة</p>
            <span className="text-sm">{course.certificateEnabled ? "مفعلة" : "غير مفعلة"}</span>
          </div>
        </div>
      </AppCard>

      <AppCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
            <Tag className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">المعلومات الأساسية</h4>
            <p className="text-xs text-muted-foreground/70">اللغة، المستوى، السعر</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">اللغة</p>
            <span className="text-sm">{course.language === "ar" ? "العربية" : course.language === "en" ? "English" : course.language}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">المستوى</p>
            <span className="text-sm">{difficultyConfig.label}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">نوع السعر</p>
            <span className="text-sm">{pricingConfig.label}{course.price ? ` - ${course.price} ${course.currency ?? "SAR"}` : ""}</span>
          </div>
        </div>
      </AppCard>

      <AppCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary/60" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">SEO</h4>
            <p className="text-xs text-muted-foreground/70">عنوان URL والمعاينة</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">الرابط</p>
            <span className="text-sm font-mono">{course.slug}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-1">تاريخ النشر</p>
            <span className="text-sm">{course.publishedAt ? formatDate(course.publishedAt) : "—"}</span>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground/70 mb-1">عنوان SEO</p>
            <span className="text-sm">{course.seo?.title || "—"}</span>
          </div>
        </div>
      </AppCard>

      <PermissionGuard permission="courses.update">
        <AppCard className="p-6 border-destructive/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-destructive/70" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-destructive">المنطقة الخطرة</h4>
              <p className="text-xs text-muted-foreground/70">إجراءات لا يمكن التراجع عنها بسهولة</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {course.status !== "archived" ? (
              <AppButton
                variant="outline"
                size="sm"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setArchiveConfirmOpen(true)}
                loading={archiveCourse.isPending}
              >
                <Archive className="h-4 w-4" />
                أرشفة
              </AppButton>
            ) : (
              <AppButton
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleRestore}
                loading={restoreCourse.isPending}
              >
                <RotateCcw className="h-4 w-4" />
                استعادة
              </AppButton>
            )}
            <AppButton
              variant="outline"
              size="sm"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteConfirmOpen(true)}
              loading={deleteCourse.isPending}
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </AppButton>
          </div>
        </AppCard>
      </PermissionGuard>

      <AppConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="أرشفة الدورة"
        description="هل أنت متأكد من أرشفة هذه الدورة؟ يمكنك استعادتها لاحقاً."
        confirmLabel="أرشفة"
        destructive
        onConfirm={handleArchive}
      />

      <AppConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="حذف الدورة"
        description="هل أنت متأكد من حذف هذه الدورة؟ هذا الإجراء نهائي ولا يمكن التراجع عنه."
        confirmLabel="حذف"
        destructive
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}

export { WorkspaceSettings };