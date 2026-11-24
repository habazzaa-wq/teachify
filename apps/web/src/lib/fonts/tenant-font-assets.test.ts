import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getFontPreloadUrls,
  loadTenantFontAssets,
  normalizeFontDisplay,
} from "./tenant-font-assets";

const GOOGLE_CSS = `/* arabic */
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 400;
  font-display: optional;
  src: url(https://fonts.gstatic.com/s/tajawal/v12/arabic-400.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/tajawal/v12/latin-400.woff2) format('woff2');
}
/* arabic */
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 700;
  font-display: optional;
  src: url(https://fonts.gstatic.com/s/tajawal/v12/arabic-700.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 700;
  font-display: optional;
  src: url(https://fonts.gstatic.com/s/tajawal/v12/latin-700.woff2) format('woff2');
}`;

describe("normalizeFontDisplay", () => {
  it("rewrites optional and swap to block so the chosen face wins first paint", () => {
    const css = normalizeFontDisplay(GOOGLE_CSS);

    expect(css).toContain("font-display: block;");
    expect(css).not.toMatch(/font-display\s*:\s*(?:optional|swap)/i);
  });

  it("adds a block descriptor when Google omits one and escapes inline style closes", () => {
    const css = normalizeFontDisplay(
      "@font-face { font-family: 'X'; src: url(https://fonts.gstatic.com/x.woff2); }</style>",
    );

    expect(css).toContain("font-display: block;");
    expect(css).not.toContain("</style>");
  });
});

describe("getFontPreloadUrls", () => {
  it("preloads Arabic and Latin regular/bold faces first", () => {
    expect(getFontPreloadUrls(normalizeFontDisplay(GOOGLE_CSS))).toEqual([
      "https://fonts.gstatic.com/s/tajawal/v12/arabic-400.woff2",
      "https://fonts.gstatic.com/s/tajawal/v12/arabic-700.woff2",
      "https://fonts.gstatic.com/s/tajawal/v12/latin-400.woff2",
      "https://fonts.gstatic.com/s/tajawal/v12/latin-700.woff2",
    ]);
  });

  it("supports variable-weight ranges and deduplicates the file", () => {
    const css = `/* arabic */
@font-face {
  font-family: 'Variable';
  font-weight: 100 900;
  src: url(https://fonts.gstatic.com/variable.woff2) format('woff2');
}`;

    expect(getFontPreloadUrls(css)).toEqual(["https://fonts.gstatic.com/variable.woff2"]);
  });

  it("falls back to the first faces when subset comments are unavailable", () => {
    const css = `@font-face { font-weight: 400; src: url(https://fonts.gstatic.com/a.woff2); }
@font-face { font-weight: 700; src: url(https://fonts.gstatic.com/b.woff2); }`;

    expect(getFontPreloadUrls(css)).toEqual([
      "https://fonts.gstatic.com/a.woff2",
      "https://fonts.gstatic.com/b.woff2",
    ]);
  });
});

describe("loadTenantFontAssets", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("prepares cached CSS and preloads from a successful fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, text: async () => GOOGLE_CSS }),
    );

    const assets = await loadTenantFontAssets("https://fonts.googleapis.com/css2?family=Tajawal");

    expect(assets?.css).toContain("font-display: block;");
    expect(assets?.preloadUrls).toHaveLength(4);
  });

  it("returns null so the layout can use a stylesheet link when fetch fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(loadTenantFontAssets("https://fonts.googleapis.com/css2")).resolves.toBeNull();
  });
});
