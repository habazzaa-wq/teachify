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
  FileImage,
  Trash2,
  Check,
  ArrowLeft,
} from "lucide-react";
import { StudioSurfaceCard, StudioButton } from "@/components/studio";
import { cn } from "@/lib/cn";
import { examBankService } from "../services";
import { ScanImageViewer, ScanComparison } from "./ScanImageViewer";

type ScanPhase =
  | "idle"
  | "preview"
  | "uploading"
  | "processing"
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

const PROCESSING_STAGES = [
  { key: "uploading", label: "جارٍ رفع الصورة", icon: Upload, duration: 0.15 },
  { key: "processing", label: "جارٍ معالجة الصورة", icon: ScanLine, duration: 0.65 },
  { key: "saving", label: "جارٍ حفظ المستند", icon: FileImage, duration: 0.18 },
  { key: "ready", label: "تم بنجاح", icon: CheckCircle2, duration: 0.02 },
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
  const [phase, setPhase] = useState<ScanPhase>(initialScanUrl ? "done" : "idle");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [serverScanUrl, setServerScanUrl] = useState<string | null>(initialScanUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalFileRef = useRef<string | null>(null);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (originalFileRef.current) URL.revokeObjectURL(originalFileRef.current);
    };
  }, []);

  useEffect(() => {
    setPhase(initialScanUrl ? "done" : "idle");
    setServerScanUrl(initialScanUrl ?? null);
    if (initialScanUrl) {
      setLocalPreview(null);
    }
  }, [initialScanUrl]);

  const cleanupTimers = useCallback(() => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
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
      if (isUploading) return;
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setPhase("error");
        return;
      }
      cleanupTimers();
      if (originalFileRef.current) URL.revokeObjectURL(originalFileRef.current);
      const localUrl = URL.createObjectURL(file);
      originalFileRef.current = localUrl;
      setOriginalFileUrl(localUrl);
      setLocalPreview(localUrl);
      setServerScanUrl(null);
      setPhase("preview");
      setError(null);
      setProcessingStage(0);
      setProcessingProgress(0);
    },
    [validateFile, cleanupTimers, isUploading],
  );

  const startProcessingAnimation = useCallback(() => {
    cleanupTimers();
    setProcessingStage(0);
    setProcessingProgress(0);

    let elapsed = 0;
    let currentStage = 0;
    let cumulativeDuration = 0;
    const stageThresholds = PROCESSING_STAGES.reduce<number[]>((acc, s) => {
      cumulativeDuration += s.duration;
      acc.push(cumulativeDuration);
      return acc;
    }, []);

    progressTimerRef.current = setInterval(() => {
      elapsed += 0.05;
      const totalDuration = PROCESSING_STAGES.reduce((sum, s) => sum + s.duration, 0);
      const rawProgress = Math.min((elapsed / totalDuration) * 100, 95);
      setProcessingProgress(rawProgress);

      while (true) {
        const threshold = stageThresholds[currentStage];
        if (
          currentStage >= PROCESSING_STAGES.length - 1 ||
          threshold === undefined ||
          elapsed < threshold
        ) break;
        currentStage++;
        setProcessingStage(currentStage);
      }
    }, 50);
  }, [cleanupTimers]);

  const completeProcessingAnimation = useCallback(() => {
    cleanupTimers();
    setProcessingStage(PROCESSING_STAGES.length - 1);
    setProcessingProgress(100);
  }, [cleanupTimers]);

  const handleUpload = useCallback(async () => {
    if (!localPreview || isUploading) return;

    setIsUploading(true);
    setPhase("uploading");
    setError(null);
    startProcessingAnimation();

    try {
      const file = await fetch(localPreview).then((r) => r.blob());
      const uploadFile = new File([file], "scan.jpg", { type: "image/jpeg" });

      const result = await examBankService.uploadScan(questionId, uploadFile);

      completeProcessingAnimation();

      if (!result.scanAssetId) {
        setPhase("error");
        setError("لم يتم حفظ السؤال المصوّر بشكل صحيح، حاول مرة أخرى.");
        setIsUploading(false);
        return;
      }

      const finalScanUrl = result.scanUrl || localPreview;
      setServerScanUrl(finalScanUrl);

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
      cleanupTimers();
      setPhase("error");
      const message =
        err instanceof Error
          ? err.message
          : "تعذر رفع الصورة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [localPreview, questionId, onScanUploaded, startProcessingAnimation, completeProcessingAnimation, cleanupTimers, isUploading]);

  const handleContinueFromCompare = useCallback(() => {
    setPhase("done");
  }, []);

  const handleRemove = useCallback(async () => {
    if (disabled || isUploading) return;
    try {
      await examBankService.removeScan(questionId);
      cleanupTimers();
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
  }, [questionId, disabled, onScanRemoved, cleanupTimers, isUploading]);

  const handleRetake = useCallback(() => {
    if (isUploading) return;
    cleanupTimers();
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
  }, [cleanupTimers, onScanRemoved, isUploading]);

  const handleReplace = useCallback(() => {
    if (isUploading) return;
    cleanupTimers();
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
  }, [cleanupTimers, onScanRemoved, isUploading]);

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
          <span className="font-medium">تم تجهيز السؤال المصوّر بنجاح</span>
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
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">تم تجهيز السؤال بنجاح — هذه هي الصورة النهائية التي سيتم استخدامها</span>
        </div>
        <StudioButton onClick={handleContinueFromCompare} className="gap-2">
          <Check className="h-4 w-4" />
          متابعة
        </StudioButton>
      </div>
    );
  }

  if (phase === "uploading" || phase === "processing") {
    const currentStage = Math.min(processingStage, PROCESSING_STAGES.length - 1);
    const stageInfo = PROCESSING_STAGES[currentStage];
    if (!stageInfo) return null;
    const StageIcon = stageInfo.icon;

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
                  {stageInfo.label}
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-studio-border">
              <div
                className="h-full bg-studio-accent transition-all duration-100 ease-linear"
                style={{ width: `${processingProgress}%` }}
              />
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
                <p className="mt-0.5 text-xs text-studio-fg-muted">
                  {Math.round(processingProgress)}% — {stageInfo.label}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {PROCESSING_STAGES.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx < currentStage;
                const isCurrent = idx === currentStage;
                return (
                  <div
                    key={step.key}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs transition-all duration-300",
                      isCompleted && "text-emerald-600 dark:text-emerald-400",
                      isCurrent && "bg-studio-accent/5 text-studio-accent font-semibold",
                      !isCompleted && !isCurrent && "text-studio-fg-muted opacity-40",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                        isCurrent && "border-studio-accent bg-studio-accent/10",
                        !isCompleted && !isCurrent && "border-studio-border",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-2.5 w-2.5" />
                      ) : isCurrent ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <StepIcon className="h-2 w-2" />
                      )}
                    </div>
                    <span className="flex-1">{step.label}</span>
                    {isCompleted && (
                      <Check className="h-3 w-3 text-emerald-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </StudioSurfaceCard>
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
              onClick={() => {
                if (originalFileRef.current) {
                  URL.revokeObjectURL(originalFileRef.current);
                  originalFileRef.current = null;
        setOriginalFileUrl(null);
                }
                setLocalPreview(null);
                setPhase("idle");
              }}
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
            disabled={disabled || isUploading}
            loading={isUploading}
            className="gap-2"
          >
            <ScanLine className="h-4 w-4" />
            رفع ومعالجة الصورة
          </StudioButton>
          <StudioButton
            variant="secondary"
            onClick={() => {
              if (originalFileRef.current) {
                URL.revokeObjectURL(originalFileRef.current);
                originalFileRef.current = null;
        setOriginalFileUrl(null);
              }
              setLocalPreview(null);
              setPhase("idle");
            }}
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
            وسيتم تنظيفها تلقائيًا
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
