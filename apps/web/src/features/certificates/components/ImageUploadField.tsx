"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useUploadCertificateAsset } from "../hooks";

interface Props {
  label: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  hint?: string;
  /** Short (signature) or square (logo / seal) preview box. */
  shape?: "square" | "wide";
}

function uploadErrorMessage(error: unknown): string {
  const response = (error as { response?: { data?: { message?: unknown } } })?.response;
  const message = response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  return error instanceof Error && error.message ? error.message : "تعذّر رفع الصورة، حاول مرة أخرى.";
}

export function ImageUploadField({ label, value, onChange, hint, shape = "square" }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadCertificateAsset();
  const [localError, setLocalError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);

    if (!file.type.startsWith("image/")) {
      setLocalError("الملف لازم يكون صورة.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("حجم الصورة لازم يكون أقل من 5 ميجابايت.");
      return;
    }

    try {
      const url = await upload.mutateAsync(file);
      onChange(url);
    } catch (error: unknown) {
      setLocalError(uploadErrorMessage(error));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const error = localError ?? (upload.isError ? uploadErrorMessage(upload.error) : null);

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold">{label}</div>
      <div
        onClick={pick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") pick();
        }}
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 transition hover:border-primary hover:bg-muted/60 ${
          shape === "wide" ? "h-24 w-full" : "h-24 w-24"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={upload.isPending}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />

        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className={`h-full w-full ${shape === "wide" ? "object-contain p-2" : "object-cover"}`}
            />
            {upload.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-studio-surface/80">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </>
        ) : upload.isPending ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px] font-bold">ارفع صورة</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={pick}
          disabled={upload.isPending}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold hover:bg-muted disabled:opacity-60"
        >
          {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {value ? "تغيير الصورة" : "اختيار صورة"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 rounded-lg border border-studio-danger/40 px-2.5 py-1.5 text-[11px] font-bold text-studio-danger hover:bg-studio-danger/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف
          </button>
        )}
      </div>

      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] font-bold text-studio-danger">{error}</p>}
    </div>
  );
}
