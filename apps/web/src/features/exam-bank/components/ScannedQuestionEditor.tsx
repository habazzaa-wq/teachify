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
  FileImage,
  RotateCcw,
  Trash2,
  Check,
} from "lucide-react";
import { StudioSurfaceCard, StudioButton } from "@/components/studio";
import { cn } from "@/lib/cn";
import { examBankService } from "../services";

type ScanStatus = "idle" | "preview" | "uploading" | "processing" | "done" | "error";

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

const PROCESSING_STEPS = [
  { label: "رفع الصورة", icon: Upload },
  { label: "اكتشاف حدود المستند", icon: FileImage },
  { label: "تصحيح المنظور والقص", icon: ScanLine },
  { label: "تحسين الوضوح", icon: RefreshCw },
  { label: "ضغط الصورة", icon: FileImage },
  { label: "تجهيز السؤال", icon: CheckCircle2 },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export function ScannedQuestionEditor({
  questionId,
  scanUrl: initialScanUrl,
  onScanUploaded,
  onScanRemoved,
  disabled = false,
}: ScannedQuestionEditorProps) {
  const [status, setStatus] = useState<ScanStatus>(initialScanUrl ? "done" : "idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialScanUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setProcessingStep(0);
  }, []);

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
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setStatus("error");
        return;
      }

      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setStatus("preview");
      setError(null);
    },
    [validateFile],
  );

  const handleUpload = useCallback(async () => {
    if (!previewUrl) return;

    setStatus("uploading");
    setError(null);
    setProcessingStep(0);

    try {
      const stepInterval = setInterval(() => {
        setProcessingStep((prev) => Math.min(prev + 1, PROCESSING_STEPS.length - 1));
      }, 1500);

      const file = await fetch(previewUrl).then((r) => r.blob());
      const uploadFile = new File([file], "scan.jpg", { type: "image/jpeg" });

      const result = await examBankService.uploadScan(questionId, uploadFile);

      clearInterval(stepInterval);
      setProcessingStep(PROCESSING_STEPS.length - 1);
      setStatus("done");

      if (result.scanUrl) {
        setPreviewUrl(result.scanUrl);
        onScanUploaded?.({
          scanUrl: result.scanUrl,
          scanAssetId: result.scanAssetId ?? "",
        });
      }
    } catch (err: unknown) {
      setStatus("error");
      const message =
        err instanceof Error
          ? err.message
          : "تعذر رفع الصورة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
      setError(message);
    }
  }, [previewUrl, questionId, onScanUploaded]);

  const handleRemove = useCallback(async () => {
    if (disabled) return;

    try {
      await examBankService.removeScan(questionId);
      reset();
      onScanRemoved?.();
    } catch {
      setError("تعذر إزالة الصورة. حاول مرة أخرى.");
    }
  }, [questionId, disabled, reset, onScanRemoved]);

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
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleRetake = useCallback(() => {
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setProcessingStep(0);
    setTimeout(() => cameraInputRef.current?.click(), 100);
  }, []);

  const handleReplace = useCallback(() => {
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setProcessingStep(0);
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, []);

  if (status === "done" && previewUrl) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <img
            src={previewUrl}
            alt="السؤال الممسوح"
            className="max-h-[400px] w-full object-contain"
          />
          {!disabled && (
            <div className="absolute top-3 left-3 flex gap-1.5">
              <button
                type="button"
                onClick={handleRetake}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-background/90 px-2.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                aria-label="إعادة التصوير"
              >
                <Camera className="h-3.5 w-3.5" />
                إعادة التصوير
              </button>
              <button
                type="button"
                onClick={handleReplace}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-background/90 px-2.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                aria-label="تغيير الصورة"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                تغيير الصورة
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/90 px-2.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-red-600"
                aria-label="حذف الصورة"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">تم تجهيز السؤال المصوّر بنجاح</span>
        </div>
      </div>
    );
  }

  if (status === "uploading" || status === "processing") {
    const currentStep = Math.min(processingStep, PROCESSING_STEPS.length - 1);
    return (
      <div className="space-y-4">
        {previewUrl && (
          <div className="relative overflow-hidden rounded-xl border border-studio-border bg-studio-soft">
            <img
              src={previewUrl}
              alt="جارٍ المعالجة"
              className="max-h-[280px] w-full object-contain opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
              <Loader2 className="h-8 w-8 animate-spin text-studio-accent" />
            </div>
          </div>
        )}
        <StudioSurfaceCard variant="ghost" padding="md" className="border border-studio-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-studio-accent" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-studio-fg">
                  جارٍ تجهيز السؤال...
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {PROCESSING_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isCompleted && "text-emerald-600 dark:text-emerald-400",
                      isCurrent && "bg-studio-accent/5 text-studio-accent font-medium",
                      !isCompleted && !isCurrent && "text-studio-fg-muted opacity-50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                        isCurrent && "border-studio-accent bg-studio-accent/10",
                        !isCompleted && !isCurrent && "border-studio-border",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <StepIcon className="h-3 w-3" />
                      )}
                    </div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </StudioSurfaceCard>
      </div>
    );
  }

  if (status === "preview" && previewUrl) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-studio-border bg-studio-soft">
          <img
            src={previewUrl}
            alt="معاينة السؤال"
            className="max-h-[400px] w-full object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={reset}
              className="absolute top-3 left-3 flex h-8 items-center gap-1.5 rounded-lg bg-background/90 px-2.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
              aria-label="إلغاء"
            >
              <X className="h-3.5 w-3.5" />
              إلغاء
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StudioButton
            onClick={handleUpload}
            disabled={disabled}
            className="gap-2"
          >
            <ScanLine className="h-4 w-4" />
            رفع ومعالجة الصورة
          </StudioButton>
          <StudioButton
            variant="secondary"
            onClick={reset}
            disabled={disabled}
          >
            اختيار صورة أخرى
          </StudioButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
            وسيتم تنظيفها تلقائياً
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

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/50">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
            <button
              type="button"
              onClick={reset}
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
