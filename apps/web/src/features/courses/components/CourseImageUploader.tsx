"use client";

import { useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { AppButton } from "@/components/ui";

interface CourseImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onPendingFileChange?: (file: File | null) => void;
  resetKey?: string;
  pending?: boolean;
  uploading?: boolean;
  error?: string | null;
}

function CourseImageUploader({
  value,
  onChange,
  onPendingFileChange,
  resetKey,
  pending = false,
  uploading = false,
  error,
}: CourseImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return releasePreview;
  }, [resetKey, releasePreview]);

  const handleFile = useCallback(
    (file: File) => {
      releasePreview();
      const previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;
      onPendingFileChange?.(file);
      onChange(previewUrl);
    },
    [onChange, onPendingFileChange, releasePreview],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) handleFile(file);
      event.target.value = "";
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    releasePreview();
    onPendingFileChange?.(null);
    onChange(null);
  }, [onChange, onPendingFileChange, releasePreview]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border/50">
          <img src={value} alt="صورة الكورس" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/40 to-transparent p-2">
            <AppButton
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              تغيير
            </AppButton>
            <AppButton
              type="button"
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-3.5 w-3.5" />
              إزالة
            </AppButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">جاري رفع الصورة...</span>
            </>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <ImagePlus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">رفع صورة الكورس</span>
              <span className="text-[11px] text-muted-foreground">JPG، PNG، WEBP — يتم ضغطها تلقائياً</span>
            </>
          )}
        </button>
      )}

      {pending && !uploading && (
        <p className="text-[11px] text-muted-foreground">
          سيتم رفع الصورة إلى السيرفر عند الضغط على حفظ.
        </p>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

export { CourseImageUploader };
