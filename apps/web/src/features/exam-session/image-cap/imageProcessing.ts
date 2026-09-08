/**
 * Pure client-side image processing for answer pages. Deliberately dependency
 * free: rotation (90° increments) and a rectangular crop are both implemented
 * on a single <canvas>, so the feature never blocks on a crop library that is
 * not already in package.json.
 *
 * EXIF orientation is honored via createImageBitmap({imageOrientation}) when
 * the browser supports it, falling back to a plain <img> decode otherwise
 * (older Safari reads EXIF itself for drawImage).
 */

import type { CropRect, ImageRotation, ProcessedImage } from "./types";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function isAcceptedImage(file: File): boolean {
  return file.type.startsWith("image/");
}

export function outputMimeFor(file: File): string {
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/webp") return "image/webp";
  return "image/jpeg";
}

export function outputFileNameFor(file: File, rotation: ImageRotation): string {
  const base = (file.name.replace(/\.[^/.]+$/, "") || "page").trim();
  const ext = outputMimeFor(file) === "image/png" ? ".png" : ".jpg";
  return rotation > 0 ? `${base}-rotated${ext}` : `${base}${ext}`;
}

interface DecodedImage {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

async function decode(file: File): Promise<DecodedImage> {
  // Prefer createImageBitmap: it is EXIF-aware and needs no DOM <img>.
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx) => ctx.drawImage(bitmap, 0, 0),
    };
  } catch {
    // Fall through to an <img> decode (covered by browsers without
    // createImageBitmap or picky HEIC containers).
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not read this image file."));
      element.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx) => ctx.drawImage(img, 0, 0),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function rotatedDimensions(
  width: number,
  height: number,
  rotation: ImageRotation,
): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: height, height: width }
    : { width, height };
}

/**
 * Bake rotation + crop into a single Blob. The crop rect is expressed relative
 * to the ROTATED image (exactly what the crop editor shows), so rotation is
 * applied first and the rectangle slices the rotated canvas.
 */
export async function renderProcessedImage(
  file: File,
  rotation: ImageRotation,
  crop: CropRect | null,
): Promise<ProcessedImage> {
  const { width: srcW, height: srcH, draw } = await decode(file);
  const { width: rotW, height: rotH } = rotatedDimensions(srcW, srcH, rotation);

  const cropX = crop ? Math.round(crop.x * rotW) : 0;
  const cropY = crop ? Math.round(crop.y * rotH) : 0;
  const cropW = crop ? Math.max(1, Math.round(crop.width * rotW)) : rotW;
  const cropH = crop ? Math.max(1, Math.round(crop.height * rotH)) : rotH;

  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not prepare the image for upload.");
  }

  // Composite transform maps the source into rotated space, then shifts the
  // crop rectangle's top-left to the origin of the output canvas:
  //   device = rotCenter - cropTopLeft + Rot(θ)·(src - srcCenter)
  if (rotation !== 0) {
    ctx.translate(rotW / 2 - cropX, rotH / 2 - cropY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-srcW / 2, -srcH / 2);
    draw(ctx);
  } else {
    ctx.translate(-cropX, -cropY);
    draw(ctx);
  }

  const mime = outputMimeFor(file);
  const quality = mime === "image/png" || mime === "image/webp" ? undefined : 0.9;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality),
  );
  if (!blob) {
    throw new Error("Could not encode the image for upload.");
  }

  return {
    blob,
    url: URL.createObjectURL(blob),
    width: cropW,
    height: cropH,
    mimeType: blob.type || mime,
  };
}