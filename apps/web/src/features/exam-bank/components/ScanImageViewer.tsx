"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface ScanImageViewerProps {
  src: string;
  alt: string;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
  showControls?: boolean;
}

export function ScanImageViewer({
  src,
  alt,
  className,
  maxHeight = 500,
  showControls = true,
}: ScanImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScale(1);
    setLoaded(false);
    setError(false);
  }, [src]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fullscreen]);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950/30", className)}>
        <p className="text-sm text-red-600 dark:text-red-400">فشل تحميل الصورة</p>
      </div>
    );
  }

  const viewer = (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl border border-studio-border bg-studio-soft",
        fullscreen
          ? "fixed inset-0 z-50 rounded-none border-0 bg-black/95 flex items-center justify-center"
          : "",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center overflow-auto",
          fullscreen ? "w-full h-full p-4" : "",
        )}
        style={fullscreen ? {} : { maxHeight }}
      >
        {!loaded && !error && (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-studio-accent border-t-transparent" />
          </div>
        )}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="eager"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "transition-transform duration-200 ease-out",
            !loaded && "hidden",
            fullscreen ? "max-h-[90vh] max-w-[90vw]" : "w-full",
          )}
          style={{
            objectFit: "contain",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        />
      </div>

      {showControls && loaded && (
        <div
          className={cn(
            "absolute flex items-center gap-1 rounded-lg border border-studio-border bg-background/90 p-1 shadow-sm backdrop-blur-sm",
            fullscreen ? "bottom-6 left-1/2 -translate-x-1/2" : "bottom-2 left-2",
          )}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-7 w-7 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
            aria-label="تكبير"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-7 w-7 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
            aria-label="تصغير"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          {scale !== 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="flex h-7 w-7 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
              aria-label="إعادة الضبط"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="mx-0.5 h-4 w-px bg-studio-border" />
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="flex h-7 w-7 items-center justify-center rounded-md text-studio-fg-muted transition-colors hover:bg-studio-soft hover:text-studio-fg"
            aria-label={fullscreen ? "تصغير" : "ملء الشاشة"}
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}

      {fullscreen && (
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-lg bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return viewer;
}
