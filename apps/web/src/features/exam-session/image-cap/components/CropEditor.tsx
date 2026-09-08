"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Crop, RotateCcw, RotateCw } from "lucide-react";
import { AppButton } from "@/components/ui";
import {
  AppDialog,
  AppDialogContent,
  AppDialogDescription,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogTitle,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CropRect, ImageRotation } from "../types";
import { rotatedDimensions } from "../imageProcessing";

interface CropEditorProps {
  open: boolean;
  file: File;
  rotation: ImageRotation;
  initialCrop: CropRect | null;
  title: string;
  onRotationChange: (rotation: ImageRotation) => void;
  onApply: (crop: CropRect | null) => void;
  onClose: () => void;
}

const DEFAULT_CROP: CropRect = { x: 0.08, y: 0.08, width: 0.84, height: 0.84 };
const MIN_FRACTION = 0.06;

interface DragState {
  mode: "move" | "nw" | "ne" | "sw" | "se";
  pointerX: number;
  pointerY: number;
  startCrop: CropRect;
  box: DOMRect;
}

/**
 * Dependency-free rectangular crop. Renders the ORIGINAL file rotated onto a
 * preview canvas (the crop coordinates are therefore expressed in the same
 * rotated space `renderProcessedImage` bakes in), then overlays a pointer-drag
 * selection rectangle on top. No crop library is required — the whole editor is
 * pointer events + a canvas.
 */
export function CropEditor({
  open,
  file,
  rotation,
  initialCrop,
  title,
  onRotationChange,
  onApply,
  onClose,
}: CropEditorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [intrinsic, setIntrinsic] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<CropRect>(initialCrop ?? DEFAULT_CROP);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // Compose the rotated preview every time rotation changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function render() {
      try {
        const bitmap = await createImageBitmap(file, {
          imageOrientation: "from-image",
        });
        const { width: rw, height: rh } = rotatedDimensions(bitmap.width, bitmap.height, rotation);
        const canvas = document.createElement("canvas");
        canvas.width = rw;
        canvas.height = rh;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        if (rotation === 90 || rotation === 270) {
          ctx.translate(rw / 2, rh / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
        } else {
          ctx.drawImage(bitmap, 0, 0);
        }
        if (!cancelled) {
          setPreviewUrl(canvas.toDataURL("image/png"));
          setIntrinsic({ width: rw, height: rh });
        }
      } catch {
        if (!cancelled) setPreviewUrl(null);
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [open, rotation, file]);

  // Display scale: fit the rotated preview while clamping its width. Pointer
  // math reads the live bounding box on every gesture so resizes stay exact.
  useLayoutEffect(() => {
    if (!open || !intrinsic) return;
    const el = containerRef.current;
    if (!el) return;
    const scale = Math.min(1, 600 / intrinsic.width, 520 / intrinsic.height);
    el.style.width = `${Math.round(intrinsic.width * scale)}px`;
    el.style.height = `${Math.round(intrinsic.height * scale)}px`;
  }, [open, intrinsic]);

  function clampRect(rect: CropRect): CropRect {
    const min = MIN_FRACTION;
    const maxW = 1 - min;
    const maxH = 1 - min;
    const width = Math.min(Math.max(rect.width, min), maxW);
    const height = Math.min(Math.max(rect.height, min), maxH);
    const x = Math.min(Math.max(rect.x, 0), Math.max(0, 1 - width));
    const y = Math.min(Math.max(rect.y, 0), Math.max(0, 1 - height));
    return { x, y, width, height };
  }

  function beginDrag(event: React.PointerEvent, mode: DragState["mode"]) {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    event.preventDefault();
    dragRef.current = {
      mode,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startCrop: { ...crop },
      box,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (event.clientX - drag.pointerX) / drag.box.width;
    const dy = (event.clientY - drag.pointerY) / drag.box.height;
    const s = drag.startCrop;

    if (drag.mode === "move") {
      setCrop(clampRect({ x: s.x + dx, y: s.y + dy, width: s.width, height: s.height }));
      return;
    }

    // Every corner adjusts the two edges it anchors; opposite corners stay fixed.
    const next: CropRect = { ...s };
    switch (drag.mode) {
      case "nw":
        next.x = s.x + dx;
        next.y = s.y + dy;
        next.width = s.width - dx;
        next.height = s.height - dy;
        break;
      case "ne":
        next.y = s.y + dy;
        next.width = s.width + dx;
        next.height = s.height - dy;
        break;
      case "sw":
        next.x = s.x + dx;
        next.width = s.width - dx;
        next.height = s.height + dy;
        break;
      case "se":
        next.width = s.width + dx;
        next.height = s.height + dy;
        break;
    }

    setCrop(clampRect(next));
  }

  function endDrag() {
    dragRef.current = null;
  }

  const px = (v: number) => `${v * 100}%`;

  return (
    <AppDialog open={open} onOpenChange={(value) => (value ? undefined : onClose())}>
      <AppDialogContent className="max-w-2xl">
        <AppDialogHeader>
          <AppDialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-[var(--brand-primary)]" />
            {title}
          </AppDialogTitle>
          <AppDialogDescription>
            اسحب الإطار لاختيار الجزء المطلوب، أو غيّر الاتجاه ثم طبّق.
          </AppDialogDescription>
        </AppDialogHeader>

        <div className="flex items-center justify-center overflow-auto rounded-xl border border-border/60 bg-muted/20 p-3">
          {previewUrl && intrinsic ? (
            <div
              ref={containerRef}
              dir="ltr"
              className="relative touch-none select-none"
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
            >
              <img
                src={previewUrl}
                alt="معاينة القص"
                draggable={false}
                className="block h-full w-full select-none rounded-md object-contain"
              />

              {/* Dim mask around the selection */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(to right, rgba(0,0,0,0.55) ${px(crop.x)}, transparent ${px(crop.x)}, transparent ${px(crop.x + crop.width)}, rgba(0,0,0,0.55) ${px(crop.x + crop.width)}), linear-gradient(to bottom, rgba(0,0,0,0.55) ${px(crop.y)}, transparent ${px(crop.y)}, transparent ${px(crop.y + crop.height)}, rgba(0,0,0,0.55) ${px(crop.y + crop.height)})`,
                }}
              />

              {/* Selection rect */}
              <div
                className="absolute cursor-move rounded-sm border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                style={{
                  left: px(crop.x),
                  top: px(crop.y),
                  width: px(crop.width),
                  height: px(crop.height),
                }}
                onPointerDown={(event) => beginDrag(event, "move")}
                onPointerMove={onPointerMove}
              >
                {/* rule-of-thirds grid */}
                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute left-1/3 top-0 h-full w-px bg-white/70" />
                  <div className="absolute left-2/3 top-0 h-full w-px bg-white/70" />
                  <div className="absolute left-0 top-1/3 h-px w-full bg-white/70" />
                  <div className="absolute left-0 top-2/3 h-px w-full bg-white/70" />
                </div>

                {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                  <button
                    key={corner}
                    type="button"
                    aria-label={`ضبط الزاوية ${corner}`}
                    className="absolute h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-[var(--brand-primary)]"
                    style={{
                      ...(corner.includes("w") ? { left: "-8px" } : { right: "-8px" }),
                      ...(corner.includes("n") ? { top: "-8px" } : { bottom: "-8px" }),
                    }}
                    onPointerDown={(event) => beginDrag(event, corner)}
                    onPointerMove={onPointerMove}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="px-4 py-10 text-sm font-semibold text-muted-foreground">
              تعذّر تحميل الصورة للمعاينة.
            </p>
          )}
        </div>

        <AppDialogFooter className="flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <AppButton
              variant="outline"
              size="sm"
              onClick={() =>
                onRotationChange(((rotation + 270) % 360) as ImageRotation)
              }
            >
              <RotateCcw className="h-4 w-4" />
              تدوير
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => onRotationChange(((rotation + 90) % 360) as ImageRotation)}
            >
              <RotateCw className="h-4 w-4" />
              تدوير
            </AppButton>
            <AppButton
              variant="ghost"
              size="sm"
              disabled={initialCrop === null}
              onClick={() => {
                onApply(null);
                onClose();
              }}
            >
              إزالة القص
            </AppButton>
          </div>
          <div className={cn("ms-auto flex items-center gap-2")}>
            <AppButton variant="ghost" onClick={onClose}>
              إلغاء
            </AppButton>
            <AppButton
              onClick={() => {
                onApply(clampRect(crop));
                onClose();
              }}
            >
              تطبيق
            </AppButton>
          </div>
        </AppDialogFooter>
      </AppDialogContent>
    </AppDialog>
  );
}