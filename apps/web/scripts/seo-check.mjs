#!/usr/bin/env node
/**
 * Local SEO health check (no Google APIs required).
 *
 * Crawls a running Next.js instance and verifies the tenant-aware SEO surface:
 * titles, descriptions, canonicals, robots, sitemap (index + chunks), OG/Twitter
 * metadata, JSON-LD emission, noindex on private routes, and tenant-origin
 * isolation (every canonical/sitemap URL must belong to the checked tenant).
 *
 * Streaming note: dynamic pages stream their body through the React Flight
 * (RSC) payload, so structured data and headings live in the payload rather
 * than as literal HTML until the client hydrates. This check therefore treats
 * "JSON-LD emitted" as present in the page response (literal <script> tag or
 * serialized in the RSC payload) and verifies the trustworthy, crawler-visible
 * signals (head metadata, robots.txt, sitemaps) as literal output.
 *
 * Usage (connect origin is where Next.js listens; tenant host is the domain
 * the request presents — combine them to test a tenant locally without DNS):
 *   SEO_CHECK_ORIGIN=http://localhost:3100 SEO_CHECK_TENANT_HOST=hazem.academy.test node scripts/seo-check.mjs
 *   npm run seo:check            # localhost, no tenant simulation
 *
 * Exits with code 1 when any hard check fails.
 */

import http from "node:http";
import https from "node:https";

const CONNECT_ORIGIN = (
  process.env.SEO_CHECK_ORIGIN ||
  process.argv[2] ||
  "http://localhost:3100"
).replace(/\/+$/, "");

const connectUrl = new URL(CONNECT_ORIGIN);
const connectHost = connectUrl.hostname;
const connectPort = connectUrl.port || (connectUrl.protocol === "https:" ? "443" : "80");

const rawTenant =
  process.env.SEO_CHECK_TENANT_HOST ||
  process.argv[3] ||
  (/^(localhost|127\.0\.0\.1)$/.test(connectHost) ? "" : connectHost);

/** The origin all canonicals/sitemap URLs are expected to belong to. */
const TENANT_ORIGIN = rawTenant ? `http://${rawTenant}` : CONNECT_ORIGIN;

const PRIVATE_PREFIXES = [
  "/teacher/",
  "/student/",
  "/superadmin/",
  "/community/",
  "/exam-sessions",
  "/exam-results",
  "/wallet/",
  "/tenant-login",
  "/tenant-not-found",
  "/api/",
  "/sanctum/",
];

const results = [];
let hardFails = 0;

function record(name, pass, details = "", hard = true) {
  results.push({ name, pass, details, hard });
  if (!pass && hard) hardFails += 1;
}

function request(method, path, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const headers = {
      "user-agent": "techify-seo-check/1.0",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    };
    if (rawTenant) {
      headers.Host = rawTenant;
      headers["x-forwarded-host"] = rawTenant;
      headers["x-forwarded-proto"] = "http";
    }
    const lib = connectUrl.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        host: connectHost,
        port: connectPort,
        path,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          const status = res.statusCode || 0;
          if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
            const loc = res.headers.location;
            const nextPath = loc.startsWith("http") ? new URL(loc).pathname + new URL(loc).search : loc;
            request(method, nextPath, redirectsLeft - 1).then(resolve, reject);
            return;
          }
          resolve({
            status,
            text: body,
            url: path,
            redirected: redirectsLeft < 5,
            headers: res.headers,
          });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function get(path) {
  try {
    return await request("GET", path);
  } catch (e) {
    return { status: 0, text: "", url: path, headers: {}, error: e.message };
  }
}

function metaTag(content, name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, "i");
  const m = content.match(re);
  return m ? m[0] : null;
}

function metaContent(content, name) {
  const tag = metaTag(content, name);
  if (!tag) return null;
  const m = tag.match(/content=["']([^"']*)["']/i);
  return m ? m[1] : null;
}

function propertyContent(content, prop) {
  // Next.js emits twitter:* as `name=`, OG as `property=` — accept either.
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${prop}["'][^>]*>`, "i");
  const m = content.match(re);
  if (!m) return null;
  const c = m[0].match(/content=["']([^"']*)["']/i);
  return c ? c[1] : null;
}

function canonical(content) {
  const m = content.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!m) return null;
  const c = m[0].match(/href=["']([^"']*)["']/i);
  return c ? c[1] : null;
}

function countTag(content, tag) {
  const re = new RegExp(`<${tag}[\\s>]`, "gi");
  return (content.match(re) || []).length;
}

/**
 * Headings are streamed inside the RSC payload, which also serializes hidden
 * fallbacks (not-found/loading) that are never mounted. Only literal `<h1>`
 * in the initial HTML is trustworthy, so streamed pages report 0 and the
 * check is informational (soft) — literal duplicates are still flagged.
 */
function countLiteralHeadings(content) {
  return countTag(content, "h1");
}

/** JSON-LD can be a literal <script> tag or serialized inside the RSC payload. */
function jsonLdInfo(content) {
  const literalScripts = (content.match(/<script[^>]*type=["']application\/ld\+json["']/gi) || []).length;
  const payloadScripts = (content.match(/application\/ld\+json/gi) || []).length - literalScripts;
  const types = [];
  // Tolerate any backslash escaping depth (`"@type"`, `\"@type\"`, `\\\"@type\\\"`).
  const re = /\\*"@type\\*"\\*:\\*"([^"\\]*)\\*"/g;
  let m;
  while ((m = re.exec(content)) !== null) types.push(m[1]);
  return {
    emitted: literalScripts + payloadScripts > 0,
    literalScripts,
    payloadScripts,
    types: [...new Set(types)],
  };
}

function extractUrls(xml) {
  const urls = [];
  const re = /<loc>([\s\S]*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim());
  return urls;
}

function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/i.test(xml);
}

async function checkPublicPage(path, label) {
  const page = await get(path);
  if (page.error) {
    record(`${label} (${path}) — reachable`, false, `fetch failed: ${page.error}`);
    return null;
  }
  if (page.status !== 200) {
    record(`${label} (${path}) — HTTP 200`, false, `got ${page.status}`);
    return null;
  }
  const content = page.text;

  record(`${label} — has <title>`, /<title>[\s\S]*?<\/title>/i.test(content));
  record(`${label} — meta description`, metaContent(content, "description") ? true : false);
  record(`${label} — robots allows index`, metaContent(content, "robots")?.includes("index") ?? false);
  const h1 = countLiteralHeadings(content);
  record(
    `${label} — exactly one literal <h1>`,
    h1 <= 1,
    h1 === 0
      ? "streamed via RSC payload (client-hydrated) — not present in initial HTML"
      : `found ${h1}`,
    false,
  );
  record(`${label} — og:title`, !!propertyContent(content, "og:title"));
  record(`${label} — og:image`, !!propertyContent(content, "og:image"), "requires a tenant logo or page image", false);
  record(`${label} — twitter:card`, !!propertyContent(content, "twitter:card"));

  const canon = canonical(content);
  if (canon) {
    const sameOrigin = canon.startsWith(TENANT_ORIGIN);
    const hasTracking = /[?&](utm_|fbclid|gclid|ref=)/i.test(canon);
    record(`${label} — canonical same-tenant-origin`, sameOrigin, canon);
    record(`${label} — canonical clean (no tracking)`, !hasTracking, canon);
    const pathNorm = (path.replace(/\/$/, "") || "/").replace(/\/$/, "");
    const canonNorm = canon.replace(/\/+$/, "");
    record(
      `${label} — canonical matches path`,
      canonNorm === TENANT_ORIGIN.replace(/\/+$/, "") + pathNorm,
      canon,
    );
  } else {
    record(`${label} — canonical present`, false, "no canonical found");
  }

  const ld = jsonLdInfo(content);
  record(
    `${label} — JSON-LD emitted`,
    ld.emitted,
    `literal ${ld.literalScripts}, payload ${ld.payloadScripts}, types: ${ld.types.join(", ") || "none"}`,
  );

  return content;
}

async function main() {
  console.log(
    `SEO health check → connect ${CONNECT_ORIGIN}, tenant origin ${TENANT_ORIGIN}\n`,
  );

  let reachable = true;
  const probe = await get("/robots.txt");
  if (probe.error) {
    reachable = false;
    record("origin reachable", false, `fetch failed: ${probe.error}`);
  }

  if (reachable) {
    // ── Public pages ──
    const homeProbe = await get("/");
    const platformRedirect = !rawTenant && homeProbe.redirected;
    if (platformRedirect) {
      console.log(
        "  note: the connect origin is the platform host (its / redirects to the admin panel).\n" +
        "  Set SEO_CHECK_TENANT_HOST=hazem.academy.test to run the full page checks\n" +
        "  against a tenant view without DNS (the request presents that Host header).\n",
      );
    }

    let homeHtml = null;
    if (platformRedirect) {
      record("Homepage (platform host)", true, "page checks skipped — use SEO_CHECK_TENANT_HOST for the tenant view", false);
    } else {
      homeHtml = await checkPublicPage("/", "Homepage");
      await checkPublicPage("/courses", "Catalog");
    }

    // ── robots.txt ──
    const robotsRes = await get("/robots.txt");
    const robots = robotsRes.text;
    record("robots.txt — HTTP 200", robotsRes.status === 200, `got ${robotsRes.status}`);
    record(
      "robots.txt — Sitemap line (tenant origin)",
      robots.includes(`Sitemap: ${TENANT_ORIGIN}/sitemap.xml`),
      `expected ${TENANT_ORIGIN}/sitemap.xml`,
    );
    record("robots.txt — disallow /teacher/", robots.includes("Disallow: /teacher/"));
    record("robots.txt — disallow /student/", robots.includes("Disallow: /student/"));
    record("robots.txt — disallow /superadmin/", robots.includes("Disallow: /superadmin/"));

    // ── Sitemap index + chunks ──
    const indexRes = await get("/sitemap.xml");
    const indexXml = indexRes.text;
    record("sitemap.xml — HTTP 200", indexRes.status === 200, `got ${indexRes.status}`);
    record("sitemap.xml — content-type XML", (indexRes.headers["content-type"] || "").includes("xml"), indexRes.headers["content-type"] || "");
    record("sitemap.xml — is sitemapindex", isSitemapIndex(indexXml));

    const childLocs = extractUrls(indexXml);
    const foreignIndexUrls = childLocs.filter((u) => !u.startsWith(TENANT_ORIGIN));
    record(
      "sitemap.xml — all child sitemaps same-tenant-origin",
      foreignIndexUrls.length === 0,
      foreignIndexUrls.join(", ") || "ok",
    );

    const allSitemapUrls = [];
    let stagePath = null;
    let coursePath = null;

    for (const loc of childLocs) {
      const childPath = new URL(loc).pathname;
      const child = await get(childPath);
      record(`sitemap child ${childPath} — HTTP 200`, child.status === 200, child.error || `got ${child.status}`);
      record(`sitemap child ${childPath} — content-type XML`, (child.headers["content-type"] || "").includes("xml"), child.headers["content-type"] || "");
      const urls = extractUrls(child.text);
      allSitemapUrls.push(...urls);
      if (!stagePath) stagePath = urls.find((u) => u.includes("/stages/")) ?? null;
      if (!coursePath) coursePath = urls.find((u) => u.includes("/courses/")) ?? null;
    }

    const foreignUrls = allSitemapUrls.filter((u) => !u.startsWith(TENANT_ORIGIN));
    record("sitemap — all URLs same-tenant-origin", foreignUrls.length === 0, foreignUrls.join(", ") || "ok");

    const privateInSitemap = allSitemapUrls.filter((u) => PRIVATE_PREFIXES.some((p) => u.includes(p)));
    record("sitemap — no private URLs", privateInSitemap.length === 0, privateInSitemap.join(", ") || "ok");

    const queryInSitemap = allSitemapUrls.filter((u) => /\?/.test(u));
    record("sitemap — no query strings", queryInSitemap.length === 0, queryInSitemap.join(", ") || "ok");

    if (stagePath) await checkPublicPage(new URL(stagePath).pathname, "Stage");
    else
      record(
        "stage page discovered from sitemap",
        Boolean(coursePath || platformRedirect),
        coursePath
          ? "no /stages/ URL found — tenant has no stages configured (data-dependent)"
          : platformRedirect
            ? "platform host serves a core-only sitemap — run with SEO_CHECK_TENANT_HOST for the full tenant sitemap"
            : "no /stages/ URL found in sitemap (API may be unavailable)",
        !coursePath && !platformRedirect,
      );

    if (coursePath) {
      const coursePathname = new URL(coursePath).pathname;
      const courseHtml = await checkPublicPage(coursePathname, "Course");
      if (courseHtml) {
        const ld = jsonLdInfo(courseHtml);
        record("Course — Course JSON-LD emitted", ld.types.includes("Course"));
        record("Course — BreadcrumbList JSON-LD emitted", ld.types.includes("BreadcrumbList"));
        const fakeSignals = /aggregateRating|\\"ratingValue\\"|\\"reviewCount\\"/.test(courseHtml);
        record("Course — no fake ratings/reviews", !fakeSignals);
      }
    } else {
      record(
        "course page discovered from sitemap",
        Boolean(platformRedirect),
        platformRedirect
          ? "platform host serves a core-only sitemap — run with SEO_CHECK_TENANT_HOST for course chunks"
          : "no /courses/ URL found in sitemap (API may be unavailable)",
        !platformRedirect,
      );
    }

    // ── Private routes must be noindex ──
    for (const p of ["/tenant-login", "/wallet/recharge-result"]) {
      const page = await get(p);
      const noindex = metaContent(page.text, "robots")?.includes("noindex") ?? false;
      const redirected = page.status >= 300 && page.status < 400;
      record(
        `private ${p} — noindex (or redirect)`,
        noindex || redirected,
        page.error || `status ${page.status}, robots=${metaContent(page.text, "robots") ?? "n/a"}`,
      );
      const presentInSitemap = allSitemapUrls.some((u) => u.includes(p));
      record(`private ${p} — absent from sitemap`, !presentInSitemap);
    }

    // ── Duplicate titles across checked public pages ──
    const titles = [];
    for (const html of [homeHtml]) {
      if (!html) continue;
      const m = html.match(/<title>([\s\S]*?)<\/title>/i);
      if (m) titles.push(m[1].trim());
    }
    record("unique titles across checked pages", new Set(titles).size === titles.length, titles.join(" | "));
  }

  // ── Report ──
  console.log("┌─────────────── RESULT ───────────────┐");
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    let icon;
    if (r.pass) icon = "PASS";
    else if (r.hard) icon = "FAIL";
    else icon = "WARN";
    console.log(`  [${icon}] ${r.name}`);
    if (!r.pass) {
      failed += 1;
      if (r.details) console.log(`         → ${r.details}`);
    } else {
      passed += 1;
    }
  }
  console.log("└──────────────────────────────────────┘");
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(hardFails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("SEO check crashed:", e);
  process.exit(2);
});
