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
  ImageIcon,
} from "lucide-react";
import { StudioSurfaceCard, StudioButton } from "@/components/studio";
import { cn } from "@/lib/cn";
import { examBankService } from "../services";

type ScanStatus = "idle" | "preview" | "uploading" | "processing" | "done" | "error";

interface ScannedQuestionEditorProps {
  questionId: string;
  scanUrl?: string | null;
  onScanUploaded?: (scanUrl: string) => void;
  onScanRemoved?: () => void;
  disabled?: boolean;
}

const PROCESSING_STEPS = [
  "جارٍ الرفع...",
  "جارٍ اكتشاف المستند...",
  "جارٍ تصحيح المنظور...",
  "جارٍ القص...",
  "جارٍ تحسين الوضوح...",
  "جارٍ الضغط...",
  "جارٍ الحفظ...",
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
    async (file: File) => {
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
      }, 1200);

      const file = await fetch(previewUrl).then((r) => r.blob());
      const uploadFile = new File([file], "scan.jpg", { type: "image/jpeg" });

      const result = await examBankService.uploadScan(questionId, uploadFile);

      clearInterval(stepInterval);
      setStatus("done");

      if (result.scanUrl) {
        setPreviewUrl(result.scanUrl);
        onScanUploaded?.(result.scanUrl);
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
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (status === "done" && previewUrl) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-studio-border bg-studio-soft">
          <img
            src={previewUrl}
            alt="السؤال الممسوح"
            className="max-h-[400px] w-full object-contain"
          />
          {!disabled && (
            <div className="absolute top-2 left-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setPreviewUrl(null);
                  cameraInputRef.current?.click();
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-background/90 px-2.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                استبدال
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/90 px-2.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" />
                إزالة
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium">تم المسح والمعالجة بنجاح</span>
        </div>
      </div>
    );
  }

  if (status === "uploading" || status === "processing") {
    return (
      <div className="space-y-4">
        {previewUrl && (
          <div className="relative overflow-hidden rounded-xl border border-studio-border bg-studio-soft opacity-60">
            <img
              src={previewUrl}
              alt="جارٍ المعالجة"
              className="max-h-[300px] w-full object-contain"
            />
          </div>
        )}
        <StudioSurfaceCard variant="ghost" padding="md" className="border border-studio-border">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-studio-accent" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-studio-fg">
                {PROCESSING_STEPS[processingStep]}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-studio-soft">
                <div
                  className="h-full rounded-full bg-studio-accent transition-all duration-700"
                  style={{ width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%` }}
                />
              </div>
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
              className="absolute top-2 left-2 flex h-8 items-center gap-1.5 rounded-lg bg-background/90 px-2.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
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
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-studio-border bg-studio-soft/50 p-8 text-center transition-colors",
          !disabled && "hover:border-studio-accent hover:bg-studio-accent/5",
          disabled && "opacity-50",
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
          <ScanLine className="h-7 w-7 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-studio-fg">
            التقط أو ارفع صورة السؤال
          </p>
          <p className="mt-1 text-xs text-studio-fg-muted">
            مفيد للرياضيات والفيزياء والكيمياء والمعادلات والرسومات والكتابة اليدوية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StudioButton
            variant="soft"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            الكاميرا
          </StudioButton>
          <StudioButton
            variant="soft"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            رفع ملف
          </StudioButton>
        </div>
        <p className="text-[11px] text-studio-fg-subtle">
          JPEG, PNG, WebP — حد أقصى 10 ميجابايت
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
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

export default ScannedQuestionEditor;
