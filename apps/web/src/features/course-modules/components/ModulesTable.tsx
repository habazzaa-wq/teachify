"use client";

import { GripVertical, Clock, Star, FolderOpen } from "lucide-react";
import { AppBadge } from "@/components/ui";
import { MODULE_STATUS_CONFIG } from "../constants";
import { ModuleRowActions } from "./ModuleRowActions";
import type { CourseModule } from "../types";

interface ModulesTableProps {
  modules: CourseModule[];
  onView?: (mod: CourseModule) => void;
  onEdit?: (mod: CourseModule) => void;
  onDelete?: (mod: CourseModule) => void;
  onDuplicate?: (mod: CourseModule) => void;
  onPublish?: (mod: CourseModule) => void;
  onArchive?: (mod: CourseModule) => void;
  onFeature?: (mod: CourseModule) => void;
  onRestore?: (mod: CourseModule) => void;
}

export function ModulesTable({
  modules,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onArchive,
  onFeature,
  onRestore,
}: ModulesTableProps) {
  if (modules.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="w-8 px-4 py-3" />
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">الوحدة</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">الأقسام</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">المدة</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">مميز</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => {
              const statusConfig = MODULE_STATUS_CONFIG[mod.status] ?? MODULE_STATUS_CONFIG.draft;
              return (
                <tr key={mod.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/20 cursor-grab" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {mod.color && (
                        <span
                          className="h-6 w-6 rounded-lg shrink-0"
                          style={{ backgroundColor: mod.color }}
                        />
                      )}
                      <div>
                        <p className="font-medium">{mod.title}</p>
                        {mod.description && (
                          <p className="text-xs text-muted-foreground/60 line-clamp-1">{mod.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AppBadge variant={statusConfig.color as any} className="text-[10px] px-2 py-0.5">
                      {statusConfig.label}
                    </AppBadge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground/70">
                      <FolderOpen className="h-3.5 w-3.5" />
                      {mod.sectionsCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {mod.estimatedDuration ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground/70">
                        <Clock className="h-3.5 w-3.5" />
                        {mod.estimatedDuration} د
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {mod.featured ? (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <span className="text-muted-foreground/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground/60">
                    {new Date(mod.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="px-4 py-3">
                    <ModuleRowActions
                      module={mod}
                      onView={() => onView?.(mod)}
                      onEdit={() => onEdit?.(mod)}
                      onDelete={() => onDelete?.(mod)}
                      onDuplicate={() => onDuplicate?.(mod)}
                      onPublish={() => onPublish?.(mod)}
                      onArchive={() => onArchive?.(mod)}
                      onFeature={() => onFeature?.(mod)}
                      onRestore={() => onRestore?.(mod)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
