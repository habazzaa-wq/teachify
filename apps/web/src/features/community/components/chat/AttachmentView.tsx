"use client";

import { FileDown, FileText, Image as ImageIcon } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/cn";
import { toAbsoluteAssetUrl } from "@/lib/url";
import { attachmentMeta, fileNameFromUrl, formatDuration, formatFileSize } from "../../utils/format";
import type { CommunityAttachment } from "../../types";

/** Renders all attachments of a message by their media type. */
export const AttachmentGrid = memo(function AttachmentGrid({
  attachments,
  className,
}: {
  attachments: CommunityAttachment[];
  className?: string;
}) {
  if (attachments.length === 0) return null;
  return (
    <div className={cn("mt-2 flex flex-col gap-2", className)}>
      {attachments.map((attachment) => (
        <AttachmentView key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
});

function AttachmentView({ attachment }: { attachment: CommunityAttachment }) {
  const src = toAbsoluteAssetUrl(attachment.url);

  switch (attachment.type) {
    case "image":
      return (
        <a
          href={src ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block max-w-sm overflow-hidden rounded-xl border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src ?? ""}
            alt={attachment.file_name ?? "صورة"}
            loading="lazy"
            className="max-h-72 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </a>
      );

    case "video":
      return (
        <div className="max-w-sm overflow-hidden rounded-xl border border-border">
          <video src={src ?? undefined} controls preload="metadata" className="max-h-72 w-full" />
        </div>
      );

    case "voice":
      return (
        <div className="flex max-w-sm items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600">
            <WaveIcon />
          </span>
          <audio src={src ?? undefined} controls preload="metadata" className="h-9 max-w-full" />
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatDuration(attachment.duration_seconds)}
          </span>
        </div>
      );

    case "pdf":
      return (
        <div className="max-w-sm overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2">
            <FileText className="h-4 w-4 text-red-500" />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">
              {attachment.file_name ?? "مستند PDF"}
            </span>
            <a
              href={src ?? "#"}
              download
              className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <FileDown className="h-3.5 w-3.5" />
              تحميل
            </a>
          </div>
          <iframe
            src={`${src ?? ""}#toolbar=0`}
            title="PDF"
            className="h-72 w-full bg-white"
            loading="lazy"
          />
        </div>
      );

    default:
      return <FileCard attachment={attachment} />;
  }
}

function FileCard({ attachment }: { attachment: CommunityAttachment }) {
  const meta = attachmentMeta(attachment.type, attachment.mime_type);
  const href = toAbsoluteAssetUrl(attachment.url);
  const Icon = meta.icon === "image" ? ImageIcon : meta.icon === "pdf" ? FileText : FileDown;
  return (
    <a
      href={href ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex max-w-sm items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5 transition-colors hover:bg-muted/70"
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted", meta.color)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{fileNameFromUrl(attachment.file_name ?? href)}</span>
        <span className="block text-[10px] text-muted-foreground">
          {attachment.mime_type ?? attachment.type} · {formatFileSize(attachment.size_bytes)}
        </span>
      </span>
      <FileDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </a>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
      <path d="M2 12h2M6 12h2M10 12h2M14 12h2M18 12h2M22 12h2" />
      <path d="M4 9v6M8 7v10M12 5v14M16 7v10M20 9v6" />
    </svg>
  );
}
