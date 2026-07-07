import type {
  CourseModule as StudioLecture,
  CourseModuleSection as StudioSection,
  ContentItem,
} from "@/features/course-content/types";

export type { StudioLecture, StudioSection, ContentItem };

/** Resolved selection inside the studio, derived from the workspace store + module tree. */
export type SelectedNode =
  | { type: "course" }
  | { type: "lecture"; lecture: StudioLecture }
  | { type: "section"; lecture: StudioLecture; section: StudioSection }
  | { type: "content"; lecture: StudioLecture; section: StudioSection; item: ContentItem };

/** Single entry of a node context menu. */
export interface NodeMenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
  /** Optional permission slug; rendered inside PermissionGuard when set. */
  permission?: string | null;
  onSelect: () => void;
}
