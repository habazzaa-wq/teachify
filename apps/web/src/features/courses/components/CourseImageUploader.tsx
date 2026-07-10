"use client";

import { useState, useCallback, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { AppButton } from "@/components/ui";
import { mediaLibraryService } from "@/features/media-library/services";

interface CourseImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
}

function CourseImageUploader({ value, onChange }: CourseImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const result = await mediaLibraryService.uploadFileDirect(file, "public");
        onChange(result.cdnUrl ?? result.asset?.cdnUrl ?? result.asset?.thumbnailUrl ?? null);
      } catch (err: any) {
        console.error(
          "Course image upload failed:",
          err?.response?.status,
          err?.response?.data,
        );
        const serverMsg = err?.response?.data?.message;
        setError(serverMsg ?? err?.message ?? "فشل رفع الصورة");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

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
              onClick={() => onChange(null)}
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
              <span className="text-xs text-muted-foreground">جاري الرفع...</span>
            </>
          ) : (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <ImagePlus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">رفع صورة الكورس</span>
              <span className="text-[11px] text-muted-foreground">JPG، PNG، WEBP</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

export { CourseImageUploader };
