/** Number, size and file helpers for the community UI. */

const compactFormatter = new Intl.NumberFormat("ar", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact localized number, e.g. 1.2ألف. */
export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

const groupingFormatter = new Intl.NumberFormat("ar");

/** Grouped localized number, e.g. ١٬٢٣٤. */
export function formatNumber(value: number): string {
  return groupingFormatter.format(value);
}

/** Human readable file size, e.g. "١٫٢ م.ب". */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["ب", "ك.ب", "م.ب", "ج.ب"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** i;
  return `${new Intl.NumberFormat("ar", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value)} ${units[i]}`;
}

/** Human readable duration for voice notes, e.g. "٠:١٢". */
export function formatDuration(
  seconds: number | null | undefined,
): string {
  if (!seconds || seconds <= 0) return "0:00";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

/** Derive a display filename from a URL when the attachment lacks one. */
export function fileNameFromUrl(url: string | null | undefined): string {
  if (!url) return "ملف";
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const name = path.split("/").filter(Boolean).pop();
    return name || "ملف";
  } catch {
    return "ملف";
  }
}

/** Extract file extension (lowercase, no dot) from a name/URL. */
export function fileExtensionOf(name: string | null | undefined): string {
  if (!name) return "";
  const clean = name.split("?")[0] ?? "";
  const dot = clean.lastIndexOf(".");
  if (dot < 0) return "";
  return clean.slice(dot + 1).toLowerCase();
}

/** Map an attachment mime/type to a Lucide icon key + color. */
export function attachmentMeta(
  type: string,
  mime: string | null,
): { icon: string; color: string } {
  const t = (type || "").toLowerCase();
  const m = (mime || "").toLowerCase();

  if (t === "image" || m.startsWith("image/")) {
    return { icon: "image", color: "text-emerald-600" };
  }
  if (t === "voice" || m.startsWith("audio/")) {
    return { icon: "audio", color: "text-violet-600" };
  }
  if (t === "video" || m.startsWith("video/")) {
    return { icon: "video", color: "text-rose-600" };
  }
  if (t === "pdf" || m === "application/pdf") {
    return { icon: "pdf", color: "text-red-600" };
  }
  if (
    m.includes("word") ||
    m.includes("spreadsheet") ||
    m.includes("presentation")
  ) {
    return { icon: "doc", color: "text-sky-600" };
  }
  return { icon: "file", color: "text-slate-600" };
}
