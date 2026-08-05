/** URL / link utilities for chat messages and previews. */

const URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{2,63}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;

const IMAGE_EXT_RE = /\.(?:png|jpe?g|gif|webp|avif|svg|bmp)(?:\?.*)?$/i;
const VIDEO_EXT_RE = /\.(?:mp4|webm|ogg|mov)(?:\?.*)?$/i;
const AUDIO_EXT_RE = /\.(?:mp3|wav|m4a|aac|ogg|opus)(?:\?.*)?$/i;
const PDF_EXT_RE = /\.pdf(?:\?.*)?$/i;

export interface FoundUrl {
  raw: string;
  url: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isPdf: boolean;
}

/** Normalize a raw URL-like token to an absolute URL. */
export function normalizeUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

/** Collect all candidate URLs found in a text body. */
export function findUrls(text: string): FoundUrl[] {
  const matches = text.match(URL_PATTERN) ?? [];
  const seen = new Set<string>();
  const results: FoundUrl[] = [];

  for (const raw of matches) {
    const url = normalizeUrl(raw);
    const host = safeHostname(url);
    // Skip markdown-wrapped or common non-link tokens.
    if (!host || host === "example.com") continue;
    const key = url.replace(/[.,;:!?)]+$/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      raw,
      url,
      isImage: IMAGE_EXT_RE.test(url),
      isVideo: VIDEO_EXT_RE.test(url),
      isAudio: AUDIO_EXT_RE.test(url),
      isPdf: PDF_EXT_RE.test(url),
    });
  }

  return results;
}

/** First standalone URL that is not part of a markdown link/image. */
export function findFirstStandaloneUrl(markdown: string): FoundUrl | null {
  const withoutLinks = markdown
    // Remove markdown links and images so we don't preview already-linked URLs.
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, "");
  const found = findUrls(withoutLinks);
  return found[0] ?? null;
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** Best-effort human label for an URL, e.g. "youtube.com". */
export function hostLabel(url: string): string {
  const host = safeHostname(url);
  if (!host) return url;
  return host.replace(/^www\./, "");
}
