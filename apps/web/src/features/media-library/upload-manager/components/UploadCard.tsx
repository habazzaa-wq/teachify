"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pause,
  Play,
  X,
  RotateCw,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  AlertTriangle,
  ShieldCheck,
  History,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { routes } from "@/constants/routes";
import { useUploadItem } from "../store";
import { uploadEngine } from "../services";
import { CATEGORY_ICONS, UPLOAD_ERROR_ICONS } from "./icons";
import { UploadProgressBar } from "./UploadProgressBar";
import { UploadStatusBadge } from "./UploadStatusBadge";
import { formatBytes, formatSpeed, formatETA, formatCountdown } from "../utils/format";

interface UploadCardProps {
  id: string;
  now: number;
}

function ActionButton({
  label,
  onClick,
  children,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-ring focus-visible:ring-offset-1 focus-visible:ring-offset-studio-surface",
        tone === "danger"
          ? "border-studio-border text-studio-fg-muted hover:border-studio-danger/40 hover:bg-studio-danger/10 hover:text-studio-danger"
          : "border-studio-border text-studio-fg-muted hover:bg-studio-soft hover:text-studio-fg",
      )}
    >
      {children}
    </button>
  );
}

function UploadCardBase({ id, now }: UploadCardProps) {
  const item = useUploadItem(id);
  const router = useRouter();

  const handlePause = () => uploadEngine.pause(id);
  const handleResume = () => uploadEngine.resume(id);
  const handleCancel = () => uploadEngine.cancel(id);
  const handleRetry = () => uploadEngine.retry(id);
  const handleRemove = () => uploadEngine.remove(id);

  const handleCopyUrl = () => {
    if (!item?.cdnUrl) return;
    navigator.clipboard
      .writeText(item.cdnUrl)
      .then(() => toast.success("تم نسخ الرابط"))
      .catch(() => toast.error("تعذر نسخ الرابط"));
  };

  const handleOpen = () => {
    if (item?.cdnUrl) window.open(item.cdnUrl, "_blank", "noopener,noreferrer");
  };

  const handleReveal = () => {
    router.push(routes.dashboardMedia);
  };

  if (!item) return null;

  const CategoryIcon = CATEGORY_ICONS[item.category]!;
  const isActive =
    item.status === "queued" ||
    item.status === "preparing" ||
    item.status === "uploading" ||
    item.status === "processing" ||
    item.status === "retrying";
  const canPause = item.status === "queued" || item.status === "uploading" || item.status === "preparing";
  const isCompleted = item.status === "completed";
  const isFailed = item.status === "failed";
  const isPaused = item.status === "paused";

  const meta = [
    formatBytes(item.size),
    isActive && item.speed > 0 ? formatSpeed(item.speed) : null,
    isActive && item.eta !== null ? `باقي ${formatETA(item.eta)}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const chunkLabel =
    item.resumable && item.chunkCount > 1
      ? `${item.uploadedChunks}/${item.chunkCount} جزء`
      : null;

  const ErrorIcon = item.error ? UPLOAD_ERROR_ICONS[item.error.type] : null;

  return (
    <div
      className="flex h-[92px] items-stretch gap-3 border-b border-studio-border px-3 py-2.5"
      aria-label={`ملف ${item.filename}`}
    >
      {/* Thumbnail */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-studio-border bg-studio-soft">
        {item.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.preview}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <CategoryIcon className="h-5 w-5 text-studio-fg-muted" />
        )}
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-studio-fg" title={item.filename}>
            {item.filename}
          </p>
          <UploadStatusBadge status={item.status} />
        </div>

        <UploadProgressBar value={item.progress} status={item.status} />

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-studio-fg-muted">
            {item.status === "failed" && item.error ? (
              <span className="flex min-w-0 items-center gap-1 text-studio-danger" title={item.error.message}>
                {ErrorIcon && <ErrorIcon className="h-3 w-3 shrink-0" />}
                <span className="truncate">{item.error.message}</span>
              </span>
            ) : (
              <span className="truncate">{meta}</span>
            )}
            {chunkLabel && (
              <span className="flex shrink-0 items-center gap-0.5 text-studio-fg-subtle" title={`تقدم الأجزاء (${chunkLabel})`}>
                <Layers className="h-3 w-3" />
                {chunkLabel}
              </span>
            )}
            {item.recovered && (
              <span className="flex shrink-0 items-center gap-0.5 text-studio-info" title="تم استرداد هذه الجلسة من التخزين المحلي">
                <History className="h-3 w-3" />
              </span>
            )}
            {item.checksumVerified && item.status === "completed" && (
              <span className="flex shrink-0 items-center gap-0.5 text-studio-success" title="تم التحقق من السلامة (SHA-256)">
                <ShieldCheck className="h-3 w-3" />
              </span>
            )}
            {item.retryCount > 0 && item.status !== "completed" && (
              <span className="shrink-0 rounded-full bg-studio-warning/10 px-1.5 text-studio-warning">
                محاولة {item.retryCount}
              </span>
            )}
            {item.warning && (
              <span className="flex shrink-0 items-center gap-0.5 text-studio-warning" title={item.warning.message}>
                <AlertTriangle className="h-3 w-3" />
              </span>
            )}
            {item.status === "retrying" && item.retryAt && now > 0 && (
              <span className="shrink-0 text-studio-warning">
                إعادة خلال {formatCountdown(item.retryAt, now)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            {canPause && (
              <ActionButton label="إيقاف مؤقت" onClick={handlePause}>
                <Pause className="h-3.5 w-3.5" />
              </ActionButton>
            )}
            {isPaused && (
              <ActionButton label="استئناف" onClick={handleResume}>
                <Play className="h-3.5 w-3.5" />
              </ActionButton>
            )}
            {isFailed && (
              <ActionButton label="إعادة المحاولة" onClick={handleRetry}>
                <RotateCw className="h-3.5 w-3.5" />
              </ActionButton>
            )}
            {isActive && (
              <ActionButton label="إلغاء" onClick={handleCancel} tone="danger">
                <X className="h-3.5 w-3.5" />
              </ActionButton>
            )}
            {isCompleted && item.cdnUrl && (
              <>
                <ActionButton label="فتح" onClick={handleOpen}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="نسخ الرابط" onClick={handleCopyUrl}>
                  <Copy className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="عرض في المكتبة" onClick={handleReveal}>
                  <Eye className="h-3.5 w-3.5" />
                </ActionButton>
              </>
            )}
            <ActionButton label="إزالة" onClick={handleRemove} tone="danger">
              <Trash2 className="h-3.5 w-3.5" />
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export const UploadCard = memo(UploadCardBase);
