"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Trash2,
  Check,
  ArrowLeft,
  SkipForward,
} from "lucide-react";
import { StudioSurfaceCard, StudioButton } from "@/components/studio";
import { cn } from "@/lib/cn";
import { examBankService } from "../services";
import type { ScanMode, ScanProcessingStage } from "../types";
import { ScanImageViewer, ScanComparison } from "./ScanImageViewer";

type ScanPhase =
  | "idle"
  | "crop"
  | "preview"
  | "uploading"
  | "compare"
  | "done"
  | "error";

interface ScanUploadedPayload {
  scanUrl: string;
  scanAssetId: string;
}

interface ScannedQuestionEditorProps {
  questionId: string;
  scanUrl?: string | null;
  onScanUploaded?: (payload: ScanUploadedPayload) => void;
  onScanRemoved?: () => void;
  disabled?: boolean;
}

const SCAN_MODES: { value: ScanMode; label: string; hint: string }[] = [
  { value: "bw_document", label: "أبيض وأسود", hint: "مسح احترافي — نص أسود حاد على ورق أبيض مع استخراج المحتوى" },
  { value: "auto", label: "تلقائي ملوّن", hint: "يحسّن الإضاءة والتباين مع الحفاظ على الألوان" },
  { value: "color_document", label: "مستند ملوّن", hint: "يحافظ على الألوان مع تحسين خفيف" },
  { value: "grayscale_document", label: "تدرج رمادي", hint: "للمستندات المكتوبة بالأبيض والأسود" },
  { value: "original_preserve", label: "بدون معالجة", hint: "حفظ الصورة الأصلية كما هي" },
];

const QUALITY_LABELS: Record<string, string> = {
  excellent: "ممتازة — الصورة الأصلية واضحة وتم حفظها بأعلى جودة",
  good: "جيدة — تم تحسين الصورة بنجاح",
  original: "أصلية — تم استخدام نسخة آمنة من الصورة الأصلية",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export function ScannedQuestionEditor({
  questionId,
  scanUrl: initialScanUrl,
  onScanUploaded,
  onScanRemoved,
  disabled = false,
}: ScannedQuestionEditorProps) {
  const [phase, setPhase] = useState<ScanPhase>(initialScanUrl ? "done" : "idle");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [serverScanUrl, setServerScanUrl] = useState<string | null>(initialScanUrl ?? null);
  const [processingStages, setProcessingStages] = useState<ScanProcessingStage[]>([]);
  const [qualityLevel, setQualityLevel] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [mode, setMode] = useState<ScanMode>("bw_document");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const originalFileRef = useRef<string | null>(null);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (originalFileRef.current) URL.revokeObjectURL(originalFileRef.current);
    };
  }, []);

  const [prevInitialUrl, setPrevInitialUrl] = useState(initialScanUrl);
  if (prevInitialUrl !== initialScanUrl) {
    setPrevInitialUrl(initialScanUrl);
    setPhase(initialScanUrl ? "done" : "idle");
    setServerScanUrl(initialScanUrl ?? null);
    if (initialScanUrl) {
      setLocalPreview(null);
    }
  }

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "نوع الملف غير مدعوم. يُسمح فقط بصيغ JPEG و PNG و WebP.";
    }
    if (file.size > MAX_SIZE) {
      return "حجم الملف يتجاوز الحد الأقصى المسموح (10 ميجابايت).";
    }
    return null;
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (isUploading) return;
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setPhase("error");
        return;
      }
      if (originalFileRef.current) URL.revokeObjectURL(originalFileRef.current);
      const localUrl = URL.createObjectURL(file);
      originalFileRef.current = localUrl;
      setOriginalFileUrl(localUrl);
      setLocalPreview(localUrl);
      setServerScanUrl(null);
      setPhase(disabled || mode === "original_preserve" ? "preview" : "crop");
      setError(null);
      setProcessingStages([]);
      setQualityLevel(null);
      setFallbackUsed(false);
    },
    [validateFile, isUploading, disabled, mode],
  );

  const handleCropConfirm = useCallback(
    (file: File) => {
      if (originalFileRef.current) URL.revokeObjectURL(originalFileRef.current);
      const croppedUrl = URL.createObjectURL(file);
      originalFileRef.current = croppedUrl;
      setOriginalFileUrl(croppedUrl);
      setLocalPreview(croppedUrl);
      setPhase("preview");
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (!localPreview || isUploading) return;

    setIsUploading(true);
    setPhase("uploading");
    setError(null);

    try {
      const file = await fetch(localPreview).then((r) => r.blob());
      const uploadFile = new File([file], "scan.jpg", { type: file.type || "image/jpeg" });

      const result = await examBankService.uploadScan(questionId, uploadFile, mode);

      if (!result.scanAssetId) {
        setPhase("error");
        setError("لم يتم حفظ السؤال المصوّر بشكل صحيح، حاول مرة أخرى.");
        setIsUploading(false);
        return;
      }

      const finalScanUrl = result.scanUrl || localPreview;
      setServerScanUrl(finalScanUrl);
      setProcessingStages(result.scanProcessing?.stages ?? []);
      setQualityLevel(result.scanProcessing?.qualityLevel ?? null);
      setFallbackUsed(result.scanProcessing?.fallbackUsed ?? false);

      if (originalFileRef.current && originalFileRef.current !== finalScanUrl) {
        setPhase("compare");
      } else {
        setPhase("done");
      }

      onScanUploaded?.({
        scanUrl: finalScanUrl,
        scanAssetId: result.scanAssetId,
      });
    } catch (err: unknown) {
      setPhase("error");
      const message =
        err instanceof Error
          ? err.message
          : "تعذر رفع الصورة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [localPreview, questionId, onScanUploaded, mode, isUploading]);

  const handleContinueFromCompare = useCallback(() => {
    setPhase("done");
  }, []);

  const handleRemove = useCallback(async () => {
    if (disabled || isUploading) return;
    try {
      await examBankService.removeScan(questionId);
      if (originalFileRef.current) {
        URL.revokeObjectURL(originalFileRef.current);
        originalFileRef.current = null;
        setOriginalFileUrl(null);
      }
      setLocalPreview(null);
      setServerScanUrl(null);
      setPhase("idle");
      setError(null);
      onScanRemoved?.();
    } catch {
      setError("تعذر إزالة الصورة. حاول مرة أخرى.");
    }
  }, [questionId, disabled, onScanRemoved, isUploading]);

  const handleRetake = useCallback(() => {
    if (isUploading) return;
    if (originalFileRef.current) {
      URL.revokeObjectURL(originalFileRef.current);
      originalFileRef.current = null;
    }
    setLocalPreview(null);
    setServerScanUrl(null);
    setPhase("idle");
    setError(null);
    onScanRemoved?.();
    setTimeout(() => cameraInputRef.current?.click(), 100);
  }, [onScanRemoved, isUploading]);

  const handleReplace = useCallback(() => {
    if (isUploading) return;
    if (originalFileRef.current) {
      URL.revokeObjectURL(originalFileRef.current);
      originalFileRef.current = null;
    }
    setLocalPreview(null);
    setServerScanUrl(null);
    setPhase("idle");
    setError(null);
    onScanRemoved?.();
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, [onScanRemoved, isUploading]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (disabled || isUploading) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile, isUploading],
  );

  const resetToIdle = useCallback(() => {
    if (originalFileRef.current) {
      URL.revokeObjectURL(originalFileRef.current);
      originalFileRef.current = null;
      setOriginalFileUrl(null);
    }
    setLocalPreview(null);
    setPhase("idle");
  }, []);

  const displayUrl = serverScanUrl || localPreview;

  const modeSelector = (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-semibold text-studio-fg-muted">نمط المعالجة:</span>
      {SCAN_MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          title={m.hint}
          disabled={disabled || isUploading}
          onClick={() => setMode(m.value)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50",
            mode === m.value
              ? "bg-studio-accent text-white"
              : "bg-studio-soft text-studio-fg-muted hover:text-studio-fg",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  const stageList = (stages: ScanProcessingStage[]) => (
    <div className="space-y-1">
      {stages.map((stage) => {
        const skipped = stage.status === "skipped";
        return (
          <div
            key={stage.key}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs transition-all duration-300",
              skipped ? "text-studio-fg-muted" : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                skipped ? "border-studio-border" : "border-emerald-500 bg-emerald-500 text-white",
              )}
            >
              {skipped ? (
                <SkipForward className="h-2.5 w-2.5" />
              ) : (
                <Check className="h-2.5 w-2.5" />
              )}
            </div>
            <span className={cn("flex-1", !skipped && "font-medium")}>{stage.label}</span>
            {stage.detail && (
              <span className="text-[10px] text-studio-fg-subtle">{stage.detail}</span>
            )}
            {!skipped && <Check className="h-3 w-3 text-emerald-500" />}
          </div>
        );
      })}
    </div>
  );

  if (phase === "done" && displayUrl) {
    return (
      <div className="space-y-3">
        <ScanImageViewer
          src={displayUrl}
          alt="السؤال الممسوح"
          maxHeight={400}
        />
        {!disabled && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRetake}
              disabled={isUploading}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-studio-border bg-studio-soft px-2.5 text-xs font-semibold text-studio-fg transition-colors hover:bg-studio-accent/5 disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
              إعادة التصوير
            </button>
            <button
              type="button"
              onClick={handleReplace}
              disabled={isUploading}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-studio-border bg-studio-soft px-2.5 text-xs font-semibold text-studio-fg transition-colors hover:bg-studio-accent/5 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              تغيير الصورة
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            {qualityLevel
              ? `تم تجهيز السؤال المصوّر — جودة المسح: ${QUALITY_LABELS[qualityLevel] ?? "جيدة"}`
              : "تم تجهيز السؤال المصوّر بنجاح"}
          </span>
        </div>
      </div>
    );
  }

  if (phase === "compare" && originalFileUrl && serverScanUrl) {
    return (
      <div className="space-y-4">
        <ScanComparison
          originalSrc={originalFileUrl}
          processedSrc={serverScanUrl}
          alt="مقارنة قبل وبعد المعالجة"
        />

        {processingStages.length > 0 && (
          <StudioSurfaceCard variant="ghost" padding="md" className="border border-studio-border">
            <p className="mb-2 text-xs font-bold text-studio-fg">مراحل المعالجة الفعلية</p>
            {stageList(processingStages)}
          </StudioSurfaceCard>
        )}

        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border p-2.5 text-xs",
            fallbackUsed
              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
          )}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            {fallbackUsed
              ? "لم تُحسّن المعالجة الصورة، فتم استخدام نسخة آمنة من الأصلية — الجودة مضمونة"
              : `تم تجهيز السؤال بنجاح — جودة المسح: ${QUALITY_LABELS[qualityLevel ?? "good"]}`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StudioButton onClick={handleContinueFromCompare} className="gap-2">
            <Check className="h-4 w-4" />
            متابعة إلى إعداد الإجابة
          </StudioButton>
          <StudioButton variant="secondary" onClick={handleReplace} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تغيير الصورة
          </StudioButton>
        </div>
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <div className="space-y-4">
        {localPreview && (
          <div className="relative overflow-hidden rounded-xl border border-studio-border bg-studio-soft">
            <img
              src={localPreview}
              alt="جارٍ المعالجة"
              className="max-h-[280px] w-full object-contain opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-studio-accent" />
                <div className="rounded-lg bg-background/90 px-4 py-2 text-sm font-semibold text-studio-fg shadow-sm backdrop-blur-sm">
                  جارٍ رفع الصورة ومعالجتها...
                </div>
              </div>
            </div>
          </div>
        )}

        <StudioSurfaceCard variant="ghost" padding="md" className="border border-studio-border">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-studio-accent" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-studio-fg">
                جارٍ تجهيز السؤال على الخادم...
              </p>
              <p className="mt-0.5 text-xs text-studio-fg-muted">
                يتم الآن تحليل الصورة واكتشاف حدود المستند وتحسين الوضوح — قد تستغرق عملية بضع ثوانٍ
              </p>
            </div>
          </div>
        </StudioSurfaceCard>
      </div>
    );
  }

  if (phase === "crop" && localPreview) {
    return (
      <div className="space-y-3">
        <ScanCropEditor
          src={localPreview}
          onConfirm={handleCropConfirm}
          onSkip={() => setPhase("preview")}
        />
      </div>
    );
  }

  if (phase === "preview" && localPreview) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-studio-border bg-studio-soft">
          <img
            src={localPreview}
            alt="معاينة السؤال"
            className="max-h-[400px] w-full object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={resetToIdle}
              className="absolute top-3 left-3 flex h-8 items-center gap-1.5 rounded-lg bg-background/90 px-2.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
              aria-label="إلغاء"
            >
              <X className="h-3.5 w-3.5" />
              إلغاء
            </button>
          )}
        </div>
        {modeSelector}
        <div className="flex items-center gap-2">
          <StudioButton
            onClick={handleUpload}
            disabled={disabled || isUploading}
            loading={isUploading}
            className="gap-2"
          >
            <ScanLine className="h-4 w-4" />
            رفع ومعالجة الصورة
          </StudioButton>
          <StudioButton variant="secondary" onClick={resetToIdle} disabled={disabled || isUploading}>
            اختيار صورة أخرى
          </StudioButton>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/50">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (localPreview) {
                  setPhase("preview");
                } else {
                  setPhase("idle");
                }
              }}
              className="mt-1.5 text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
            >
              حاول مرة أخرى
            </button>
          </div>
        </div>

        {(localPreview || serverScanUrl) && (
          <StudioButton
            variant="secondary"
            onClick={() => {
              setError(null);
              setPhase("idle");
              setLocalPreview(null);
              setServerScanUrl(null);
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            رفع صورة جديدة
          </StudioButton>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200",
          dragActive
            ? "border-studio-accent bg-studio-accent/5 scale-[1.01]"
            : "border-studio-border bg-studio-soft/50 hover:border-studio-accent-border hover:bg-studio-accent/5",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-200",
            dragActive ? "bg-studio-accent/15" : "bg-emerald-500/10",
          )}
        >
          <ScanLine
            className={cn(
              "h-8 w-8 transition-colors duration-200",
              dragActive ? "text-studio-accent" : "text-emerald-500",
            )}
          />
        </div>
        <div>
          <p className="text-base font-semibold text-studio-fg">
            أضف صورة السؤال
          </p>
          <p className="mt-1.5 text-sm text-studio-fg-muted">
            صوّر المسألة بالكاميرا أو ارفع صورة واضحة للورقة
            <br />
            سيتم تحليلها ومعالجتها بأمان مع الحفاظ على جودة النص
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <StudioButton
            variant="soft"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
            className="gap-2"
            aria-label="تصوير السؤال بالكاميرا"
          >
            <Camera className="h-4 w-4" />
            تصوير السؤال
          </StudioButton>
          <StudioButton
            variant="soft"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="gap-2"
            aria-label="رفع صورة من الجهاز"
          >
            <Upload className="h-4 w-4" />
            رفع صورة
          </StudioButton>
        </div>
        <p className="text-[11px] text-studio-fg-subtle">
          JPEG, PNG, WebP — حد أقصى 10 ميجابايت
        </p>
        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-studio-accent/5 backdrop-blur-[1px]">
            <p className="text-sm font-semibold text-studio-accent">
              أفلت الصورة هنا
            </p>
          </div>
        )}
      </div>

      {modeSelector}

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/50">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-1.5 text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
            >
              حاول مرة أخرى
            </button>
          </div>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        aria-label="تصوير السؤال بالكاميرا"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="اختيار صورة من الجهاز"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ScannedQuestionEditor;

// ════════════════════════════════════════════════════════════
//  Manual Crop Editor
// ════════════════════════════════════════════════════════════

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CropDragMode = "draw" | "move" | "nw" | "ne" | "sw" | "se";

interface CropDrag {
  mode: CropDragMode;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  kx: number;
  ky: number;
  startRect: Rect | null;
}

function ScanCropEditor({
  src,
  onConfirm,
  onSkip,
}: {
  src: string;
  onConfirm: (file: File) => void;
  onSkip: () => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [drag, setDrag] = useState<CropDrag | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      const scale = Math.min(1, 640 / img.naturalWidth);
      setDisplaySize({ w: Math.round(img.naturalWidth * scale), h: Math.round(img.naturalHeight * scale) });
    };
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);

  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    const end = () => {
      if (drag?.mode === "draw") {
        setRect((r) => {
          if (!r || !image) return null;
          const minTiny = Math.max(10, Math.min(image.naturalWidth, image.naturalHeight) * 0.02);
          return r.w >= minTiny && r.h >= minTiny ? r : null;
        });
      }
      setDrag(null);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!image || !displaySize || drag) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    const kx = image.naturalWidth / box.width;
    const ky = image.naturalHeight / box.height;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-crop-mode]");
    const mode = (el?.dataset.cropMode ?? "draw") as CropDragMode;
    const sx = Math.max(0, Math.min(image.naturalWidth, (e.clientX - box.left) * kx));
    const sy = Math.max(0, Math.min(image.naturalHeight, (e.clientY - box.top) * ky));
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer may already be released; window listeners still end the drag
    }
    if (mode === "draw") {
      setRect({ x: sx, y: sy, w: 0, h: 0 });
    }
    setDrag({
      mode,
      sx,
      sy,
      ox: box.left,
      oy: box.top,
      kx,
      ky,
      startRect: rect ? { ...rect } : null,
    });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || !image) return;
    const natW = image.naturalWidth;
    const natH = image.naturalHeight;
    const nx = Math.max(0, Math.min(natW, (e.clientX - drag.ox) * drag.kx));
    const ny = Math.max(0, Math.min(natH, (e.clientY - drag.oy) * drag.ky));

    if (drag.mode === "draw") {
      setRect({
        x: Math.min(drag.sx, nx),
        y: Math.min(drag.sy, ny),
        w: Math.abs(nx - drag.sx),
        h: Math.abs(ny - drag.sy),
      });
      return;
    }

    const s = drag.startRect;
    if (!s) return;

    if (drag.mode === "move") {
      setRect({
        x: Math.max(0, Math.min(natW - s.w, s.x + (nx - drag.sx))),
        y: Math.max(0, Math.min(natH - s.h, s.y + (ny - drag.sy))),
        w: s.w,
        h: s.h,
      });
      return;
    }

    const minSize = Math.min(natW, natH) * 0.05;
    let x1 = s.x;
    let y1 = s.y;
    let x2 = s.x + s.w;
    let y2 = s.y + s.h;
    if (drag.mode.includes("w")) x1 = Math.max(0, Math.min(nx, x2 - minSize));
    if (drag.mode.includes("e")) x2 = Math.max(x1 + minSize, Math.min(natW, nx));
    if (drag.mode.includes("n")) y1 = Math.max(0, Math.min(ny, y2 - minSize));
    if (drag.mode.includes("s")) y2 = Math.max(y1 + minSize, Math.min(natH, ny));
    setRect({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
  };

  const handleReset = () => {
    setDrag(null);
    setRect(null);
  };

  const handleConfirm = () => {
    const img = image;
    if (!img || !rect || rect.w < 10 || rect.h < 10) return;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.w);
    canvas.height = Math.round(rect.h);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, Math.round(rect.x), Math.round(rect.y), Math.round(rect.w), Math.round(rect.h), 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onConfirm(new File([blob], "scan.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.95,
    );
  };

  if (!displaySize || !image) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-studio-border bg-studio-soft p-10">
        <Loader2 className="h-8 w-8 animate-spin text-studio-accent" />
      </div>
    );
  }

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  const handles: { id: Exclude<CropDragMode, "draw" | "move">; pos: string; cursor: string }[] = [
    { id: "nw", pos: "-top-2 -left-2", cursor: "cursor-nwse-resize" },
    { id: "ne", pos: "-top-2 -right-2", cursor: "cursor-nesw-resize" },
    { id: "sw", pos: "-bottom-2 -left-2", cursor: "cursor-nesw-resize" },
    { id: "se", pos: "-bottom-2 -right-2", cursor: "cursor-nwse-resize" },
  ];

  return (
    <div className="space-y-3">
      <StudioSurfaceCard variant="ghost" padding="md" className="border border-studio-border">
        <p className="mb-1 text-sm font-bold text-studio-fg">تحديد الجزء المطلوب</p>
        <p className="text-xs text-studio-fg-muted">
          اضغط واسحب على الصورة لرسم تحديد جديد مثل لقطة الشاشة — يمكنك سحب التحديد لنقله أو مقابضه لتعديله، والسحب في أي مكان آخر يبدأ تحديدًا جديدًا
        </p>
      </StudioSurfaceCard>

      <div
        className="relative mx-auto cursor-crosshair select-none"
        style={{ width: displaySize.w, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <img
          src={src}
          alt="اقتصاص الصورة"
          draggable={false}
          className="block w-full rounded-lg"
          style={{ height: displaySize.h }}
        />
        {rect && (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-black/55"
              style={{
                clipPath: `polygon(
                  0 0, 100% 0, 100% 100%, 0 100%,
                  0 ${pct(rect.y, displaySize.h)}, ${pct(rect.x, displaySize.w)} ${pct(rect.y, displaySize.h)},
                  ${pct(rect.x, displaySize.w)} ${pct(rect.y + rect.h, displaySize.h)},
                  ${pct(rect.x + rect.w, displaySize.w)} ${pct(rect.y + rect.h, displaySize.h)},
                  ${pct(rect.x + rect.w, displaySize.w)} ${pct(rect.y, displaySize.h)},
                  ${pct(rect.x, displaySize.w)} ${pct(rect.y, displaySize.h)}
                )`,
              }}
            />
            <div
              role="presentation"
              data-crop-mode="move"
              className="absolute cursor-move border-2 border-emerald-400"
              style={{
                left: pct(rect.x, displaySize.w),
                top: pct(rect.y, displaySize.h),
                width: pct(rect.w, displaySize.w),
                height: pct(rect.h, displaySize.h),
              }}
            >
              {handles.map((h) => (
                <span
                  key={h.id}
                  role="presentation"
                  data-crop-mode={h.id}
                  className={cn(
                    "absolute h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-md",
                    h.pos,
                    h.cursor,
                  )}
                />
              ))}
            </div>
          </>
        )}
        {!rect && !drag && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white">
              اضغط واسحب لتحديد الجزء المطلوب
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StudioButton onClick={handleConfirm} disabled={!rect || rect.w < 10 || rect.h < 10} className="gap-2">
          <Check className="h-4 w-4" />
          تأكيد القصّ والمتابعة
        </StudioButton>
        {rect && (
          <StudioButton variant="secondary" onClick={handleReset} className="gap-2">
            إعادة التحديد
          </StudioButton>
        )}
        <StudioButton variant="secondary" onClick={onSkip} className="gap-2">
          <SkipForward className="h-4 w-4" />
          رفع الصورة كاملة بدون قصّ
        </StudioButton>
      </div>
    </div>
  );
}
