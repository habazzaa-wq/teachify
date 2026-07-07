import type { MediaType, MediaStatus, ProcessingStatus, MediaVisibility } from "../types";

export const MEDIA_QUERY_KEY = "media-library";

export const MEDIA_TYPE_CONFIG: Record<MediaType, { label: string; icon: string; color: string }> = {
  video: { label: "فيديو", icon: "Video", color: "blue" },
  image: { label: "صورة", icon: "Image", color: "green" },
  audio: { label: "صوت", icon: "Music", color: "purple" },
  document: { label: "مستند", icon: "FileText", color: "amber" },
  pdf: { label: "PDF", icon: "FileText", color: "red" },
  zip: { label: "مضغوط", icon: "Archive", color: "slate" },
  presentation: { label: "عرض تقديمي", icon: "Presentation", color: "orange" },
  spreadsheet: { label: "جدول بيانات", icon: "Table", color: "emerald" },
  link: { label: "رابط", icon: "Link", color: "cyan" },
  file: { label: "ملف", icon: "File", color: "gray" },
};

export const MEDIA_STATUS_CONFIG: Record<MediaStatus, { label: string; color: string }> = {
  pending: { label: "معلق", color: "secondary" },
  uploading: { label: "رفع", color: "info" },
  processing: { label: "معالجة", color: "warning" },
  ready: { label: "جاهز", color: "success" },
  failed: { label: "فشل", color: "destructive" },
};

export const PROCESSING_STATUS_CONFIG: Record<ProcessingStatus, { label: string; color: string }> = {
  uploading: { label: "رفع", color: "info" },
  processing: { label: "معالجة", color: "warning" },
  ready: { label: "جاهز", color: "success" },
  failed: { label: "فشل", color: "destructive" },
  archived: { label: "مؤرشف", color: "secondary" },
  deleted: { label: "محذوف", color: "destructive" },
};

export const VISIBILITY_CONFIG: Record<MediaVisibility, { label: string; icon: string }> = {
  private: { label: "خاص", icon: "Lock" },
  organization: { label: "المؤسسة", icon: "Building" },
  public: { label: "عام", icon: "Globe" },
};

export const TYPE_OPTIONS = [
  { value: "all", label: "جميع الأنواع" },
  { value: "video", label: "فيديو" },
  { value: "image", label: "صورة" },
  { value: "audio", label: "صوت" },
  { value: "document", label: "مستند" },
  { value: "pdf", label: "PDF" },
  { value: "zip", label: "مضغوط" },
  { value: "presentation", label: "عرض تقديمي" },
  { value: "spreadsheet", label: "جدول بيانات" },
  { value: "file", label: "ملف" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "ready", label: "جاهز" },
  { value: "processing", label: "قيد المعالجة" },
  { value: "uploading", label: "رفع" },
  { value: "failed", label: "فشل" },
];

export const SORT_OPTIONS = [
  { value: "created_at", label: "تاريخ الرفع" },
  { value: "title", label: "الاسم" },
  { value: "updated_at", label: "تاريخ التعديل" },
  { value: "size_bytes", label: "الحجم" },
  { value: "type", label: "النوع" },
  { value: "duration", label: "المدة" },
];

export const ALLOWED_UPLOAD_TYPES = [
  "video/mp4", "video/webm", "video/quicktime",
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "audio/mpeg", "audio/wav", "audio/ogg",
  "application/pdf",
  "application/zip", "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
];

export const MAX_UPLOAD_SIZE = 2_000_000_000; // 2GB

export const FILE_SIZE_FORMAT = [
  { threshold: 1_073_741_824, label: "GB", divisor: 1_073_741_824 },
  { threshold: 1_048_576, label: "MB", divisor: 1_048_576 },
  { threshold: 1_024, label: "KB", divisor: 1_024 },
] as const;
