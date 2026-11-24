"use client";

/**
 * Course covers are uploaded as raw multipart files. If the deployed nginx vhost
 * still has its default `client_max_body_size 1m`, any photo taken on a phone
 * is rejected with a 413 before Laravel can accept it (the API itself allows
 * up to 100MB). Compress covers in the browser so the request always fits,
 * regardless of which vhost revision is live.
 */

/** Keep headroom for multipart boundaries and headers under nginx's 1m default. */
export const MAX_COURSE_IMAGE_BYTES = 900 * 1024;

const DIMENSION_STEPS = [1600, 1200, 900];
const QUALITY_STEPS = [0.82, 0.7, 0.58, 0.45];

interface DecodedImage {
  width: number;
  height: number;
  source: CanvasImageSource;
  close?: () => void;
}

async function decode(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall back to an <img> decode below.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const element = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("تعذر قراءة الصورة. جرّب ملف JPG أو PNG أو WEBP."));
      img.src = url;
    });
    return {
      width: element.naturalWidth,
      height: element.naturalHeight,
      source: element,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function scaledDimensions(width: number, height: number, max: number) {
  const ratio = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

async function encodeCandidate(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<{ blob: Blob; mime: string } | null> {
  // WebP gives much smaller covers at the same quality. Older browsers fall
  // back to JPEG (canvas.toBlob returns PNG if the requested type is unknown).
  const webp = await toBlob(canvas, "image/webp", quality);
  if (webp && webp.type === "image/webp") {
    return { blob: webp, mime: "image/webp" };
  }

  const jpeg = await toBlob(canvas, "image/jpeg", quality);
  return jpeg ? { blob: jpeg, mime: "image/jpeg" } : null;
}

function toUploadFile(candidate: { blob: Blob; mime: string }, originalName: string): File {
  const base = originalName.replace(/\.[^/.]+$/, "").trim() || "course-cover";
  const extension = candidate.mime === "image/webp" ? "webp" : "jpg";
  return new File([candidate.blob], `${base}.${extension}`, {
    type: candidate.mime,
    lastModified: Date.now(),
  });
}

/**
 * Return the original file when it is already small enough, otherwise produce
 * a progressively smaller raster version until it fits under the proxy limit.
 */
export async function compressCourseImage(file: File): Promise<File> {
  if (file.size <= MAX_COURSE_IMAGE_BYTES) return file;

  const decoded = await decode(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("تعذر تجهيز الصورة للرفع.");
  }

  try {
    let smallest: { blob: Blob; mime: string } | null = null;

    for (const maxDimension of DIMENSION_STEPS) {
      const { width, height } = scaledDimensions(decoded.width, decoded.height, maxDimension);
      canvas.width = width;
      canvas.height = height;

      // Flatten transparency onto white so JPEG/WebP never produce dark edges.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(decoded.source, 0, 0, width, height);

      for (const quality of QUALITY_STEPS) {
        const candidate = await encodeCandidate(canvas, quality);
        if (!candidate) continue;

        if (!smallest || candidate.blob.size < smallest.blob.size) {
          smallest = candidate;
        }
        if (candidate.blob.size <= MAX_COURSE_IMAGE_BYTES) {
          return toUploadFile(candidate, file.name);
        }
      }
    }

    if (smallest && smallest.blob.size <= MAX_COURSE_IMAGE_BYTES) {
      return toUploadFile(smallest, file.name);
    }
    throw new Error("تعذر تقليل حجم الصورة بما يكفي. جرّب صورة أصغر.");
  } finally {
    decoded.close?.();
  }
}
