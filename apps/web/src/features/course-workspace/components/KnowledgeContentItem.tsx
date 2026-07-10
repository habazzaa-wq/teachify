"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import {
  Video,
  FileText,
  FileSpreadsheet,
  PenTool,
  Headphones,
  FolderOpen,
  Radio,
  ExternalLink,
  Box,
  CheckCircle2,
  CircleIcon,
  Clock,
  Award,
} from "lucide-react";
import type { ContentItem, ContentItemType } from "@/features/course-content/types";
import { cn } from "@/lib/cn";

interface KnowledgeContentItemProps {
  item: ContentItem;
  isSelected: boolean;
  onSelect: (item: ContentItem) => void;
}

const typeIcons: Record<ContentItemType, React.ComponentType<{ className?: string }>> = {
  video: Video,
  pdf: FileText,
  exam: FileSpreadsheet,
  assignment: PenTool,
  audio: Headphones,
  resource: FolderOpen,
  live: Radio,
  scorm: Box,
  external_link: ExternalLink,
  certificate: Award,
};

const typeColors: Record<ContentItemType, string> = {
  video: "text-blue-500 bg-blue-500/10 ring-blue-500/20",
  pdf: "text-rose-500 bg-rose-500/10 ring-rose-500/20",
  exam: "text-secondary bg-secondary/10 ring-secondary/20",
  assignment: "text-amber-500 bg-amber-500/10 ring-amber-500/20",
  audio: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/20",
  resource: "text-cyan-500 bg-cyan-500/10 ring-cyan-500/20",
  live: "text-red-500 bg-red-500/10 ring-red-500/20",
  scorm: "text-indigo-500 bg-indigo-500/10 ring-indigo-500/20",
  external_link: "text-sky-500 bg-sky-500/10 ring-sky-500/20",
  certificate: "text-yellow-500 bg-yellow-500/10 ring-yellow-500/20",
};

function KnowledgeContentItem({ item, isSelected, onSelect }: KnowledgeContentItemProps) {
  const handleClick = useCallback(() => {
    onSelect(item);
  }, [onSelect, item]);

  const Icon = typeIcons[item.type] ?? FolderOpen;
  const colorClass = typeColors[item.type] ?? typeColors.resource;

  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg text-start transition-all duration-150 group",
        isSelected
          ? "bg-primary/[0.06] text-primary shadow-sm"
          : "text-muted-foreground/60 hover:bg-muted/20 hover:text-foreground/80",
      )}
      whileTap={{ scale: 0.98 }}
    >
      <span className={cn("p-1 rounded-md shrink-0 ring-1 ring-inset", colorClass)}>
        <Icon className="h-3 w-3" />
      </span>

      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-medium truncate block leading-tight">
          {item.title}
        </span>
        <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
          {item.duration != null && item.duration > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-2 w-2" />
              {Math.round(item.duration / 60)}د
            </span>
          )}
        </span>
      </div>

      <span className="shrink-0">
        {item.status === "published" ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        ) : (
          <CircleIcon className="h-3 w-3 text-muted-foreground/15" />
        )}
      </span>
    </motion.button>
  );
}

export { KnowledgeContentItem };
