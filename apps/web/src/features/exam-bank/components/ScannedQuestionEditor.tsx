"use client";

import { useCallback, useRef, useState } from "react";
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
} from "lucide-react";
import { StudioButton } from "@/components/studio";
import { cn } from "@/lib/cn";
import { examBankService } from "../services";
import { ScanImageViewer } from "./ScanImageViewer";

type ScanPhase = "idle" | "preview" | "uploading" | "done" | "error";

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
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const selectedFileRef = useRef<File | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const resetLocalSelection = useCallback(() => {
    releaseObjectUrl();
    selectedFileRef.current = null;
    setLocalPreview(null);
  }, [releaseObjectUrl]);

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
      resetLocalSelection();
      const localUrl = URL.createObjectURL(file);
      objectUrlRef.current = localUrl;
      selectedFileRef.current = file;
      setLocalPreview(localUrl);
      setServerScanUrl(null);
      setError(null);
      setPhase("preview");
    },
    [validateFile, isUploading, resetLocalSelection],
  );

  const handleUpload = useCallback(async () => {
    const file = selectedFileRef.current;
    if (!file || isUploading) return;

    setIsUploading(true);
    setPhase("uploading");
    setError(null);

    try {
      // Stored exactly as uploaded (original format/bytes preserved server-side).
      const result = await examBankService.uploadScan(questionId, file, "original_preserve");

      if (!result.scanAssetId) {
        setPhase("error");
        setError("لم يتم حفظ السؤال المصوّر بشكل صحيح، حاول مرة أخرى.");
        setIsUploading(false);
        return;
      }

      const finalScanUrl = result.scanUrl ?? localPreview ?? "";
      setServerScanUrl(finalScanUrl || null);
      resetLocalSelection();
      setPhase("done");

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
  }, [questionId, localPreview, onScanUploaded, isUploading, resetLocalSelection]);

  const handleRemove = useCallback(async () => {
    if (disabled || isUploading) return;
    try {
      await examBankService.removeScan(questionId);
      resetLocalSelection();
      setServerScanUrl(null);
      setPhase("idle");
      setError(null);
      onScanRemoved?.();
    } catch {
      setError("تعذر إزالة الصورة. حاول مرة أخرى.");
    }
  }, [questionId, disabled, onScanRemoved, isUploading, resetLocalSelection]);

  const handlePickCamera = () => {
    if (isUploading) return;
    cameraInputRef.current?.click();
  };

  const handlePickGallery = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleRetake = useCallback(() => {
    if (isUploading) return;
    resetLocalSelection();
    setServerScanUrl(null);
    setPhase("idle");
    setError(null);
    onScanRemoved?.();
    setTimeout(() => cameraInputRef.current?.click(), 100);
  }, [onScanRemoved, isUploading, resetLocalSelection]);

  const handleReplace = useCallback(() => {
    if (isUploading) return;
    resetLocalSelection();
    setServerScanUrl(null);
    setPhase("idle");
    setError(null);
    onScanRemoved?.();
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, [onScanRemoved, isUploading, resetLocalSelection]);

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

  const displayUrl = serverScanUrl || localPreview;

  const fileInputs = (
    <>
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
    </>
  );

  if (phase === "done" && displayUrl) {
    return (
      <div className="space-y-3">
        <ScanImageViewer src={displayUrl} alt="صورة السؤال" maxHeight={400} />
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
          <span className="font-medium">تم حفظ صورة السؤال بنجاح</span>
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
              alt="جارٍ رفع الصورة"
              className="max-h-[280px] w-full object-contain opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-studio-accent" />
                <div className="rounded-lg bg-background/90 px-4 py-2 text-sm font-semibold text-studio-fg shadow-sm backdrop-blur-sm">
                  جارٍ رفع الصورة...
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-studio-border bg-studio-soft p-4">
          <Loader2 className="h-5 w-5 animate-spin text-studio-accent" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-studio-fg">جارٍ حفظ صورة السؤال على الخادم...</p>
            <p className="mt-0.5 text-xs text-studio-fg-muted">قد تستغرق العملية بضع ثوانٍ</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "preview" && localPreview) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-studio-border bg-studio-soft">
          <img
            src={localPreview}
            alt="معاينة صورة السؤال"
            className="max-h-[400px] w-full object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                resetLocalSelection();
                setPhase("idle");
                setError(null);
              }}
              className="absolute top-3 left-3 flex h-8 items-center gap-1.5 rounded-lg bg-background/90 px-2.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
              aria-label="إلغاء"
            >
              <X className="h-3.5 w-3.5" />
              إلغاء
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StudioButton
            onClick={handleUpload}
            disabled={disabled || isUploading}
            loading={isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            حفظ الصورة
          </StudioButton>
          <StudioButton
            variant="secondary"
            onClick={handlePickGallery}
            disabled={disabled || isUploading}
          >
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
            <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
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

        <div className="flex flex-wrap items-center gap-2">
          <StudioButton
            variant="secondary"
            onClick={handlePickGallery}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            رفع صورة جديدة
          </StudioButton>
          <StudioButton variant="secondary" onClick={handlePickCamera} className="gap-2">
            <Camera className="h-4 w-4" />
            تصوير السؤال
          </StudioButton>
        </div>

        {fileInputs}
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
          <p className="text-base font-semibold text-studio-fg">أضف صورة السؤال</p>
          <p className="mt-1.5 text-sm text-studio-fg-muted">
            صوّر المسألة بالكاميرا أو ارفع صورة واضحة للورقة
            <br />
            سيتم حفظ الصورة كما هي بنفس جودتها
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <StudioButton
            variant="soft"
            onClick={handlePickCamera}
            disabled={disabled}
            className="gap-2"
            aria-label="تصوير السؤال بالكاميرا"
          >
            <Camera className="h-4 w-4" />
            تصوير السؤال
          </StudioButton>
          <StudioButton
            variant="soft"
            onClick={handlePickGallery}
            disabled={disabled}
            className="gap-2"
            aria-label="رفع صورة من الجهاز"
          >
            <Upload className="h-4 w-4" />
            رفع صورة
          </StudioButton>
        </div>
        <p className="text-[11px] text-studio-fg-subtle">JPEG, PNG, WebP — حد أقصى 10 ميجابايت</p>
        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-studio-accent/5 backdrop-blur-[1px]">
            <p className="text-sm font-semibold text-studio-accent">أفلت الصورة هنا</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/50">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
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

      {fileInputs}
    </div>
  );
}

export default ScannedQuestionEditor;
