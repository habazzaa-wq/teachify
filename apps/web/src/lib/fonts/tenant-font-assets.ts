/**
 * Server-side preparation for the tenant-selected Google font.
 *
 * `display=optional` (introduced with s4) lets the browser abandon the selected
 * face on a cold load and keep the fallback for the whole page — that is why
 * Tajawal looked like Cairo in production. Inlining the CSS and loading it with
 * `font-display: block` makes the first paint wait for the chosen face, while
 * preloading the critical Arabic/Latin files keeps that wait imperceptible.
 */

const MODERN_BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CSS_REVALIDATE_SECONDS = 60 * 60 * 24;

const FONT_DISPLAY_RE = /font-display\s*:\s*(?:auto|block|swap|fallback|optional)\s*;?/gi;
const FONT_FACE_RE = /@font-face\s*\{([\s\S]*?)\}/g;
const SUBSET_FACE_RE = /\/\*\s*([^*]+?)\s*\*\/\s*@font-face\s*\{([\s\S]*?)\}/g;
const WOFF2_URL_RE = /url\(\s*['"]?(https:\/\/[^)'"]+\.woff2(?:\?[^)'"]*)?)['"]?\s*\)/i;

type FontDisplay = "block" | "swap" | "fallback" | "optional";

interface ParsedFontFace {
  subset: string;
  weight: string;
  url: string | null;
}

export interface TenantFontAssets {
  /** Google CSS with a deterministic font-display value. */
  css: string;
  /** Critical woff2 files to preload before first paint. */
  preloadUrls: string[];
}

/** Rewrite Google's `font-display` descriptor and make the CSS safe to inline. */
export function normalizeFontDisplay(css: string, display: FontDisplay = "block"): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");

  return safeCss.replace(FONT_FACE_RE, (_face, body: string) => {
    const normalizedBody = body.replace(FONT_DISPLAY_RE, `font-display: ${display};`);
    const finalBody = /font-display\s*:/i.test(normalizedBody)
      ? normalizedBody
      : `\n  font-display: ${display};${normalizedBody}`;
    return `@font-face {${finalBody}}`;
  });
}

function parseFaces(css: string): ParsedFontFace[] {
  const faces: ParsedFontFace[] = [];

  const readFace = (body: string, subset: string): ParsedFontFace => ({
    subset,
    weight: body.match(/font-weight\s*:\s*([^;]+)/i)?.[1]?.trim() ?? "",
    url: body.match(WOFF2_URL_RE)?.[1] ?? null,
  });

  for (const match of css.matchAll(SUBSET_FACE_RE)) {
    faces.push(readFace(match[2] ?? "", match[1]?.trim() ?? ""));
  }

  // Some font responses omit the `/* subset */` comments; still collect them.
  if (faces.length === 0) {
    for (const match of css.matchAll(FONT_FACE_RE)) {
      faces.push(readFace(match[1] ?? "", ""));
    }
  }

  return faces;
}

function matchesWeight(weight: string, wanted: number): boolean {
  if (/bold/i.test(weight)) return wanted === 700;
  if (/normal/i.test(weight)) return wanted === 400;

  const values = (weight.match(/\d+/g) ?? []).map(Number);
  if (values.length === 0) return false;
  const min = values.at(0);
  const max = values.at(1);
  if (min !== undefined && max !== undefined && wanted >= min && wanted <= max) return true;
  return values.includes(wanted);
}

/**
 * Pick the Arabic/Latin regular and bold faces. Those cover body copy and
 * headings on the RTL site; the rest of the weights are still defined by the
 * inlined CSS and load on demand without a fallback flash.
 */
export function getFontPreloadUrls(css: string): string[] {
  const faces = parseFaces(css);
  const priorities = [
    { subset: /arabic/i, weight: 400 },
    { subset: /arabic/i, weight: 700 },
    { subset: /latin/i, weight: 400 },
    { subset: /latin/i, weight: 700 },
  ];

  const urls: string[] = [];
  const add = (url: string | null | undefined) => {
    if (url && !urls.includes(url)) urls.push(url);
  };

  for (const priority of priorities) {
    add(
      faces.find(
        (face) => priority.subset.test(face.subset) && matchesWeight(face.weight, priority.weight),
      )?.url,
    );
  }

  if (urls.length === 0) {
    for (const face of faces) {
      if (urls.length >= 2) break;
      add(face.url);
    }
  }

  return urls;
}

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

/**
 * Fetch and cache a Google stylesheet for server-side inlining. A network
 * failure falls back to the normal stylesheet link in the root layout.
 */
export async function loadTenantFontAssets(cssUrl: string): Promise<TenantFontAssets | null> {
  try {
    const response = await fetch(cssUrl, {
      headers: { "User-Agent": MODERN_BROWSER_UA },
      next: { revalidate: CSS_REVALIDATE_SECONDS },
    } as NextFetchInit);
    if (!response.ok) return null;

    const rawCss = await response.text();
    if (!rawCss.includes("@font-face")) return null;

    const css = normalizeFontDisplay(rawCss);
    return { css, preloadUrls: getFontPreloadUrls(css) };
  } catch (error) {
    console.warn("Could not preload tenant font CSS; falling back to stylesheet link.", error);
    return null;
  }
}
