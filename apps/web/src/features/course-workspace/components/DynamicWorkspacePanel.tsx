"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Layers,
  GraduationCap,
  FileText,
  Clock,
  ArrowLeft,
  Sparkles,
  Plus,
  Video,
  Headphones,
  ExternalLink,
  Box,
  Radio,
  PenTool,
  FileSpreadsheet,
  FolderOpen,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { ContentInspector } from "./ContentInspector";
import { WorkspaceOverview } from "./WorkspaceOverview";
import { PermissionGuard, AppButton } from "@/components/ui";
import type { CourseModule, CourseModuleSection, ContentItem } from "@/features/course-content/types";
import type { Course } from "@/features/courses/types";
import { cn } from "@/lib/cn";
import { estimateDurationMinutes } from "@/features/course-content/utils";

type WorkspaceView =
  | { type: "lecture"; data: CourseModule }
  | { type: "section"; data: CourseModuleSection }
  | { type: "item"; data: ContentItem };

interface DynamicWorkspacePanelProps {
  view: WorkspaceView | null;
  course?: Course | null;
  courseLoading?: boolean;
  onAddLecture?: () => void;
  totalModules?: number;
}

const contentTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  pdf: FileText,
  exam: FileSpreadsheet,
  assignment: PenTool,
  audio: Headphones,
  resource: FolderOpen,
  live: Radio,
  scorm: Box,
  external_link: ExternalLink,
};

const contentTypeColors: Record<string, string> = {
  video: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pdf: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  exam: "bg-secondary/10 text-secondary border-secondary/20",
  assignment: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  audio: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  resource: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  live: "bg-red-500/10 text-red-500 border-red-500/20",
  scorm: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  external_link: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

function LectureCanvas({ lecture }: { lecture: CourseModule }) {
  const sections = lecture.sections ?? [];
  const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0);
  const totalDuration = sections.reduce((s, sec) => s + (sec.durationMinutes ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-8 max-w-3xl"
    >
      {/* HEADER */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-primary/[0.06]">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">{lecture.title}</h2>
            {lecture.status === "published" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                منشور
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <CircleDashed className="h-3 w-3" />
                مسودة
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground/60">
            {sections.length} أقسام · {totalItems} محتوى
            {totalDuration > 0 && ` · ${estimateDurationMinutes(totalDuration)}`}
          </p>
        </div>
      </div>

      {lecture.description && (
        <p className="text-sm text-muted-foreground/70 leading-relaxed">{lecture.description}</p>
      )}

      {/* SECTIONS LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground/60 tracking-wider uppercase">
          الأقسام ({sections.length})
        </h3>
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border border-dashed border-border/40 bg-muted/10">
            <Layers className="h-8 w-8 text-muted-foreground/15" />
            <p className="text-xs text-muted-foreground/40">لا توجد أقسام بعد. أضف قسماً جديداً</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section, i) => (
              <div
                key={section.id}
                className="group flex items-start gap-3 p-4 rounded-xl bg-card border border-border/40 hover:border-border/60 hover:shadow-sm transition-all"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06] text-xs font-mono font-bold text-muted-foreground/50 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{section.title}</span>
                    {section.freePreview && (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-medium">مجاني</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/50">
                    <span>{section.items.length} محتوى</span>
                    {section.durationMinutes != null && section.durationMinutes > 0 && (
                      <>
                        <span>·</span>
                        <span>{estimateDurationMinutes(section.durationMinutes)}</span>
                      </>
                    )}
                  </div>
                  {/* CONTENT ITEMS PREVIEW */}
                  {section.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {section.items.map((item) => {
                        const Icon = contentTypeIcons[item.type] ?? FolderOpen;
                        const colors = contentTypeColors[item.type] ?? contentTypeColors.resource;
                        return (
                          <span
                            key={item.id}
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium border",
                              colors,
                            )}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {item.title.length > 20 ? item.title.slice(0, 20) + "…" : item.title}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* METRICS */}
      {sections.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "الأقسام", value: sections.length, icon: Layers, color: "text-blue-500" },
            { label: "المحتوى", value: totalItems, icon: FileText, color: "text-secondary" },
            { label: "المدة", value: estimateDurationMinutes(totalDuration), icon: Clock, color: "text-amber-500" },
            { label: "النوع", value: lecture.sectionsCount > 0 ? "مختلط" : "—", icon: GraduationCap, color: "text-emerald-500" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/40 bg-card p-3 text-center">
              <stat.icon className={cn("h-4 w-4 mx-auto mb-1", stat.color)} />
              <p className="text-sm font-bold">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground/50">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function SectionCanvas({ section }: { section: CourseModuleSection }) {
  const items = section.items ?? [];

  const contentTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.type] = (counts[item.type] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-8 max-w-3xl"
    >
      {/* HEADER */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-blue-500/[0.06]">
          <Layers className="h-6 w-6 text-blue-500" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
            {section.freePreview && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">مجاني</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground/60">
            {items.length} محتوى
            {section.durationMinutes != null && section.durationMinutes > 0 && ` · ${estimateDurationMinutes(section.durationMinutes)}`}
          </p>
        </div>
      </div>

      {section.description && (
        <p className="text-sm text-muted-foreground/70 leading-relaxed">{section.description}</p>
      )}

      {/* CONTENT TYPE BREAKDOWN */}
      {Object.keys(contentTypeCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(contentTypeCounts).map(([type, count]) => {
            const Icon = contentTypeIcons[type] ?? FolderOpen;
            const colors = contentTypeColors[type] ?? contentTypeColors.resource;
            return (
              <span key={type} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border", colors)}>
                <Icon className="h-3.5 w-3.5" />
                {type === "video" ? "فيديو" :
                 type === "pdf" ? "PDF" :
                 type === "exam" ? "اختبار" :
                 type === "assignment" ? "واجب" :
                 type === "audio" ? "صوت" :
                 type === "resource" ? "مورد" :
                 type === "live" ? "مباشر" :
                 type === "scorm" ? "SCORM" :
                 type === "external_link" ? "رابط" : type} ({count})
              </span>
            );
          })}
        </div>
      )}

      {/* CONTENT LIST */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-muted-foreground/60 tracking-wider uppercase mb-3">
          المحتوى ({items.length})
        </h3>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border border-dashed border-border/40 bg-muted/10">
            <FileText className="h-8 w-8 text-muted-foreground/15" />
            <p className="text-xs text-muted-foreground/40">لا يوجد محتوى في هذا القسم</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, i) => {
              const Icon = contentTypeIcons[item.type] ?? FolderOpen;
              const colors = contentTypeColors[item.type] ?? contentTypeColors.resource;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/20 transition-colors"
                >
                  <span className="text-[10px] font-mono text-muted-foreground/20 w-5 text-center shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={cn("p-1.5 rounded-lg shrink-0", colors)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                  {item.duration != null && item.duration > 0 && (
                    <span className="text-[10px] text-muted-foreground/50 shrink-0">
                      {Math.round(item.duration / 60)}د
                    </span>
                  )}
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
                    item.status === "published"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted/30 text-muted-foreground/50",
                  )}>
                    {item.status === "published" ? "منشور" : "مسودة"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DynamicWorkspacePanel({ view, course, courseLoading, onAddLecture, totalModules = 0 }: DynamicWorkspacePanelProps) {
  return (
    <div className="min-h-[400px]">
      <AnimatePresence mode="wait">
        {!view ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WorkspaceOverview course={course} loading={courseLoading} onAddLecture={onAddLecture} totalModules={totalModules} />
          </motion.div>
        ) : view.type === "lecture" ? (
          <LectureCanvas key={`lecture-${view.data.id}`} lecture={view.data} />
        ) : view.type === "section" ? (
          <SectionCanvas key={`section-${view.data.id}`} section={view.data} />
        ) : (
          <ContentInspector key={`item-${view.data.id}`} item={view.data} />
        )}
      </AnimatePresence>
    </div>
  );
}

export { DynamicWorkspacePanel };
export type { WorkspaceView };
