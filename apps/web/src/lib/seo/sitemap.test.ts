import { describe, expect, it } from "vitest";
import {
  buildSitemapIndexXml,
  buildUrlsetXml,
  courseSitemapPath,
  entryToXml,
  publicEntry,
  xmlEscape,
} from "./sitemap";

describe("xmlEscape", () => {
  it("escapes XML special characters", () => {
    expect(xmlEscape('a<b & "c" \'d\'')).toBe("a&lt;b &amp; &quot;c&quot; &apos;d&apos;");
  });
});

describe("buildUrlsetXml", () => {
  it("renders a valid urlset with loc, lastmod, changefreq, priority", () => {
    const xml = buildUrlsetXml([
      {
        url: "https://a.academy.test/courses/algebra",
        lastModified: "2026-01-15T10:00:00Z",
        changeFrequency: "weekly",
        priority: 0.7,
      },
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<loc>https://a.academy.test/courses/algebra</loc>");
    expect(xml).toContain("<lastmod>2026-01-15T10:00:00.000Z</lastmod>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<priority>0.7</priority>");
  });

  it("escapes URLs and drops invalid dates instead of emitting junk", () => {
    const xml = buildUrlsetXml([
      { url: "https://a.academy.test/courses/x&y", lastModified: "not-a-date" },
    ]);
    expect(xml).toContain("<loc>https://a.academy.test/courses/x&amp;y</loc>");
    expect(xml).not.toContain("<lastmod>");
  });

  it("normalizes date-only lastmod to ISO", () => {
    const xml = entryToXml({ url: "https://a.academy.test/", lastModified: "2026-08-01" });
    expect(xml).toContain("<lastmod>2026-08-01</lastmod>");
  });

  it("never emits empty chunks (valid fallback)", () => {
    const xml = buildUrlsetXml([]);
    expect(xml).toContain("<loc>about:blank</loc>");
  });
});

describe("buildSitemapIndexXml", () => {
  it("lists child sitemaps in order", () => {
    const xml = buildSitemapIndexXml([
      "https://a.academy.test/sitemap-core.xml",
      "https://a.academy.test/sitemap-courses/1",
    ]);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<loc>https://a.academy.test/sitemap-core.xml</loc>");
    expect(xml).toContain("<loc>https://a.academy.test/sitemap-courses/1</loc>");
  });
});

describe("courseSitemapPath & publicEntry", () => {
  it("produces stable per-chunk paths", () => {
    expect(courseSitemapPath(1)).toBe("/sitemap-courses/1");
    expect(courseSitemapPath(7)).toBe("/sitemap-courses/7");
  });

  it("builds canonical entries for a given tenant origin", () => {
    const entry = publicEntry("https://b.academy.test", "/courses", {
      changeFrequency: "daily",
    });
    expect(entry.url).toBe("https://b.academy.test/courses");
    expect(entry.changeFrequency).toBe("daily");
  });
});

describe("tenant isolation in sitemap helpers", () => {
  it("URLs are always derived from the provided origin (never cross-tenant)", () => {
    const xmlA = buildUrlsetXml([publicEntry("https://a.academy.test", "/courses/x")]);
    const xmlB = buildUrlsetXml([publicEntry("https://b.academy.test", "/courses/x")]);
    expect(xmlA).toContain("https://a.academy.test/courses/x");
    expect(xmlA).not.toContain("b.academy.test");
    expect(xmlB).toContain("https://b.academy.test/courses/x");
    expect(xmlB).not.toContain("a.academy.test");
  });
});
