import {
  Video,
  FileType,
  FileText,
  ClipboardList,
  FolderOpen,
  Headphones,
  Monitor,
  Puzzle,
  Link,
  Award,
  type LucideIcon,
} from "lucide-react";
import type { ContentItemType, ContentPickerOption } from "../types";

export const CONTENT_TYPE_CONFIG: Record<
  ContentItemType,
  { icon: LucideIcon; label: string; color: string; bg: string }
> = {
  video: {
    icon: Video,
    label: "فيديو",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  pdf: {
    icon: FileType,
    label: "PDF",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  exam: {
    icon: ClipboardList,
    label: "اختبار",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  assignment: {
    icon: FileText,
    label: "واجب",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  resource: {
    icon: FolderOpen,
    label: "ملف",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  audio: {
    icon: Headphones,
    label: "صوت",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  live: {
    icon: Monitor,
    label: "جلسة مباشرة",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  scorm: {
    icon: Puzzle,
    label: "SCORM",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  external_link: {
    icon: Link,
    label: "رابط خارجي",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  certificate: {
    icon: Award,
    label: "شهادة",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
};

export const CONTENT_PICKER_OPTIONS: ContentPickerOption[] =
  Object.entries(CONTENT_TYPE_CONFIG).map(([type, config]) => ({
    type: type as ContentItemType,
    ...config,
  }));

export const MODULE_STATUS_CONFIG = {
  draft: { label: "مسودة", color: "secondary" },
  published: { label: "منشور", color: "success" },
  archived: { label: "مؤرشف", color: "destructive" },
} as const;

export const CONTENT_ITEM_STATUS_CONFIG = {
  draft: { label: "مسودة", color: "secondary" },
  published: { label: "منشور", color: "success" },
  archived: { label: "مؤرشف", color: "destructive" },
} as const;
