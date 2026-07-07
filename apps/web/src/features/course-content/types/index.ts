export type ContentItemType =
  | "video"
  | "pdf"
  | "exam"
  | "assignment"
  | "resource"
  | "audio"
  | "live"
  | "scorm"
  | "external_link"
  | "certificate";

export type ContentItemStatus = "draft" | "published" | "archived";

export type ContentItemVisibility = "private" | "preview" | "public";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentItemType;
  status: ContentItemStatus;
  visibility: ContentItemVisibility;
  duration: number | null;
  freePreview: boolean;
  locked: boolean;
  order: number;
  mediaId?: string | null;
  examId?: string | null;
  assignmentId?: string | null;
  resourceId?: string | null;
  certificateId?: string | null;
  scormId?: string | null;
  externalUrl?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleSection {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  freePreview: boolean;
  locked: boolean;
  status: ContentItemStatus;
  durationMinutes: number | null;
  lessonsCount: number;
  contentCount: number;
  items: ContentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  status: ContentItemStatus;
  durationMinutes: number | null;
  sectionsCount: number;
  sections: CourseModuleSection[];
  createdAt: string;
  updatedAt: string;
}

export interface ContentPickerOption {
  type: ContentItemType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}
