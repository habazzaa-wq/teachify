"use client";

import { HardDrive, Wifi, Video, Upload, Clock } from "lucide-react";
import { AppProgress, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { ALLOWED_VIDEO_FORMATS, ALLOWED_VIDEO_QUALITIES } from "../constants";
import type { PlanVideoStorage, VideoFormat, VideoQuality } from "../types";

interface PlanVideoStorageTabProps {
  videoStorage: PlanVideoStorage;
  onChange: (videoStorage: PlanVideoStorage) => void;
}

function UsageMeter({
  label,
  used,
  limit,
  icon: Icon,
  color,
}: {
  label: string;
  used: number;
  limit: number;
  icon: React.ElementType;
  color: "default" | "success" | "warning" | "destructive";
}) {
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const remaining = limit - used;

  return (
    <div className="rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground/90">{label}</span>
        </div>
        <span className="text-sm tabular-nums">
          <span className="font-semibold">{formatNumber(used)}</span>
          <span className="text-muted-foreground"> / {limit > 0 ? formatNumber(limit) : "∞"}</span>
        </span>
      </div>
      {limit > 0 && (
        <div className="space-y-1.5">
          <AppProgress value={used} max={limit} variant={color} size="sm" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{percentage}% مستخدم</span>
            <span className="text-xs text-muted-foreground">{formatNumber(remaining)} متبقي</span>
          </div>
        </div>
      )}
      {limit === 0 && (
        <p className="text-xs text-muted-foreground">غير محدد</p>
      )}
    </div>
  );
}

function PlanVideoStorageTab({ videoStorage, onChange }: PlanVideoStorageTabProps) {
  const update = (field: keyof PlanVideoStorage, value: unknown) => {
    onChange({ ...videoStorage, [field]: value });
  };

  const toggleFormat = (format: VideoFormat) => {
    const current = videoStorage.allowedFormats;
    const next = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    update("allowedFormats", next);
  };

  const toggleQuality = (quality: VideoQuality) => {
    const current = videoStorage.allowedQualities;
    const next = current.includes(quality)
      ? current.filter((q) => q !== quality)
      : [...current, quality];
    update("allowedQualities", next);
  };

  return (
    <div className="space-y-6">
      {/* Usage Meters */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">الاستخدام</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6 space-y-4">
          <UsageMeter
            label="التخزين"
            used={videoStorage.storageUsed}
            limit={videoStorage.storageLimit}
            icon={HardDrive}
            color={videoStorage.storageLimit > 0 && videoStorage.storageUsed / videoStorage.storageLimit > 0.8 ? "warning" : "default"}
          />
          <UsageMeter
            label="النطاق"
            used={videoStorage.bandwidthUsed}
            limit={videoStorage.bandwidthLimit}
            icon={Wifi}
            color={videoStorage.bandwidthLimit > 0 && videoStorage.bandwidthUsed / videoStorage.bandwidthLimit > 0.8 ? "warning" : "default"}
          />
          <UsageMeter
            label="الفيديوهات"
            used={videoStorage.videosUsed}
            limit={videoStorage.videosLimit}
            icon={Video}
            color={videoStorage.videosLimit > 0 && videoStorage.videosUsed / videoStorage.videosLimit > 0.8 ? "warning" : "default"}
          />
        </AppCardContent>
      </AppCard>

      {/* Upload Limits */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">حدود الرفع</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Upload className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground/90">حجم الرفع الأقصى</span>
              </div>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {videoStorage.maximumUploadSize}
                <span className="text-sm font-normal text-muted-foreground mr-1">GB</span>
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground/90">مدة الفيديو القصوى</span>
              </div>
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {videoStorage.maximumVideoDuration}
                <span className="text-sm font-normal text-muted-foreground mr-1">دقيقة</span>
              </p>
            </div>
          </div>
        </AppCardContent>
      </AppCard>

      {/* Formats & Qualities */}
      <AppCard className="overflow-hidden rounded-2xl border shadow-sm">
        <AppCardHeader className="border-b bg-muted/20 px-6 py-4">
          <AppCardTitle className="text-sm font-semibold">الصيغ والجودة</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">الصيغ المسموحة</h5>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_VIDEO_FORMATS.map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => toggleFormat(fmt.value)}
                    className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                      videoStorage.allowedFormats.includes(fmt.value)
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                    aria-label={fmt.label}
                    aria-pressed={videoStorage.allowedFormats.includes(fmt.value)}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">الجودة</h5>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_VIDEO_QUALITIES.map((qual) => (
                  <button
                    key={qual.value}
                    onClick={() => toggleQuality(qual.value)}
                    className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                      videoStorage.allowedQualities.includes(qual.value)
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                    aria-label={qual.label}
                    aria-pressed={videoStorage.allowedQualities.includes(qual.value)}
                  >
                    {qual.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

export { PlanVideoStorageTab };
