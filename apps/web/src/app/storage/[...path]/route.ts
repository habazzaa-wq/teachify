import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { Readable } from "node:stream";

/**
 * Serves files from the API's public storage directory (`apps/api/public/storage`,
 * which is symlinked to `storage/app/public` via `php artisan storage:link`).
 *
 * The tenant backends build avatar/media URLs as `/storage/{path}` against the
 * current domain. In production those requests are proxied to this Next.js app
 * (Caddy routes everything non-API to :3000), so we serve them here instead of
 * 404ing. Files are read-only and path-traversal is rejected.
 */
const STORAGE_ROOT =
  process.env.NEXT_PUBLIC_STORAGE_ROOT ??
  join(process.cwd(), "..", "api", "public", "storage");

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  pdf: "application/pdf",
  json: "application/json",
  txt: "text/plain",
};

function safeResolve(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return null;
  }
  const resolved = normalize(join(STORAGE_ROOT, ...segments));
  const rootPrefix = STORAGE_ROOT.endsWith(sep) ? STORAGE_ROOT : `${STORAGE_ROOT}${sep}`;
  if (!resolved.startsWith(rootPrefix) || resolved === STORAGE_ROOT) return null;
  return resolved;
}

function contentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const filePath = safeResolve(path);
  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const stats = await stat(filePath).catch(() => null);
  if (!stats || !stats.isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const nodeStream = createReadStream(filePath);
  const body = Readable.toWeb(nodeStream) as unknown as ReadableStream;

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType(filePath),
      "Content-Length": String(stats.size),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
