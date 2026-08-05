"use client";

import {
  Coffee,
  FolderOpen,
  Hash,
  HelpCircle,
  Lightbulb,
  Megaphone,
  MessageSquare,
  Pin,
  BookOpen,
  Trophy,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";

const SLUG_ICONS: Record<string, typeof Hash> = {
  announcements: Megaphone,
  questions: HelpCircle,
  homework: BookOpen,
  resources: FolderOpen,
  "study-tips": Lightbulb,
  "top-students": Trophy,
  "off-topic": Coffee,
  pinned: Pin,
  bookmarks: Star,
  general: Hash,
};

/** Channel icon resolved from slug, with a consistent accent ring. */
export function ChannelIcon({
  slug,
  className,
}: {
  slug?: string | null;
  className?: string;
}) {
  const Icon = SLUG_ICONS[(slug ?? "").toLowerCase()] ?? MessageSquare;
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-secondary/15 text-primary",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}
