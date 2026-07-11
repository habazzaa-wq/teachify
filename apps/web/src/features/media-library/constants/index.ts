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

export const SMART_FOLDERS: Array<{ id: string; label: string; icon: string; type?: MediaType }> = [
  { id: "recent", label: "الأخيرة", icon: "Clock" },
  { id: "favorites", label: "المفضلة", icon: "Heart" },
  { id: "pinned", label: "المثبتة", icon: "Pin" },
  { id: "images", label: "الصور", icon: "Image", type: "image" },
  { id: "videos", label: "الفيديو", icon: "Video", type: "video" },
  { id: "audio", label: "الصوت", icon: "Music", type: "audio" },
  { id: "documents", label: "المستندات", icon: "FileText", type: "document" },
  { id: "archives", label: "الأرشيف", icon: "Archive", type: "zip" },
];

export const VIEW_MODE_OPTIONS = [
  { value: "grid", label: "شبكة", icon: "Grid3X3" },
  { value: "list", label: "قائمة", icon: "List" },
  { value: "compact", label: "مضغوط", icon: "LayoutGrid" },
  { value: "large", label: "معاينة كبيرة", icon: "Maximize2" },
] as const;

export const GROUP_BY_OPTIONS = [
  { value: "none", label: "بدون تجميع" },
  { value: "type", label: "بالنوع" },
  { value: "date", label: "التاريخ" },
  { value: "owner", label: "المالك" },
  { value: "size", label: "الحجم" },
] as const;

export const EXTENSION_OPTIONS = [
  { value: "", label: "جميع الامتدادات" },
  { value: "mp4", label: "MP4" },
  { value: "webm", label: "WebM" },
  { value: "mov", label: "MOV" },
  { value: "jpg", label: "JPG" },
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "gif", label: "GIF" },
  { value: "webp", label: "WebP" },
  { value: "svg", label: "SVG" },
  { value: "mp3", label: "MP3" },
  { value: "wav", label: "WAV" },
  { value: "ogg", label: "OGG" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "xlsx", label: "XLSX" },
  { value: "pptx", label: "PPTX" },
  { value: "zip", label: "ZIP" },
] as const;

export const VISIBILITY_OPTIONS = [
  { value: "all", label: "جميع الرؤى" },
  { value: "private", label: "خاص" },
  { value: "organization", label: "المؤسسة" },
  { value: "public", label: "عام" },
] as const;
