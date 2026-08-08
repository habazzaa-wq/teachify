# SEO Verification & Maintenance

This document describes how the tenant-aware SEO system works in production, and how to verify and maintain it from Google Search Console (GSC).

## Architecture Overview

All SEO concerns are server-rendered by the Next.js app (`apps/web`). Each tenant domain resolves its own metadata, canonicals, robots, sitemap, and structured data — nothing is shared across tenants.

| Concern | Location |
| --- | --- |
| Origin / absolute URL helpers | `apps/web/src/lib/seo/url.ts` |
| Tenant SEO context (name, branding, base URL) | `apps/web/src/lib/seo/tenant-context.ts` |
| Metadata builder (canonical, robots, OG, Twitter, verification) | `apps/web/src/lib/seo/metadata.ts` |
| Sitemap XML builders (urlset / sitemapindex, pagination constants) | `apps/web/src/lib/seo/sitemap.ts` |
| JSON-LD builders (Org, WebSite, Course, ItemList, Breadcrumb) | `apps/web/src/lib/seo/jsonld.ts` |
| `<script type="application/ld+json">` component | `apps/web/src/components/seo/JsonLd.tsx` |
| Visible breadcrumb nav | `apps/web/src/components/seo/Breadcrumbs.tsx` |
| Root layout metadata (title template, metadataBase, OG defaults) | `apps/web/src/app/layout.tsx` |
| Dynamic robots.txt | `apps/web/src/app/robots.ts` |
| Sitemap index + core + courses chunks | `apps/web/src/app/sitemap.xml/route.ts`, `sitemap-core.xml/route.ts`, `sitemap-courses/[page]/route.ts` |

### How tenant context is resolved

1. A reverse proxy (Caddy) forwards `Host`, `X-Forwarded-Proto`, `X-Forwarded-Host` to Next.js.
2. Next.js middleware (`apps/web/src/middleware.ts`) marks non-platform hosts with `x-tenant-domain`.
3. `getTenantSeoContext()` reads the optional `x-tenant-context` header (base64 JSON) if a proxy supplies it; otherwise it falls back to the public `/tenant/by-domain` API.
4. When the API is unreachable, metadata gracefully degrades to `env.appName` and the platform description — never to another tenant's data.

### Canonicals and sitemap

- Canonicals are absolute, built from `X-Forwarded-Proto` + `X-Forwarded-Host`/`Host` (see `getRequestOrigin()`).
- `canonicalUrl()` strips tracking params (`utm_*`, `fbclid`, `gclid`, `ref`, ...).
- Sitemaps are served as a **sitemap index** so the catalog can grow beyond 50,000 URLs:
  - `/sitemap.xml` — an XML sitemap *index* listing `/sitemap-core.xml` and `/sitemap-courses/{n}`.
  - `/sitemap-core.xml` — home, `/courses`, and all public stages.
  - `/sitemap-courses/{n}` — one chunk of the public course catalog, 100 courses per chunk (`SITEMAP_COURSES_PER_PAGE`), with chunk count driven by the real catalog API `lastPage` (never more chunks than exist).
- Every child sitemap URL and entry is built from the same per-request tenant origin — a sitemap fetched on tenant A's domain can never list tenant B URLs.
- Sitemap `lastModified` uses `publishedAt ?? createdAt` (real data only).
- `SITEMAP_MAX_URLS_PER_FILE = 50_000` keeps every file within the Google sitemap size limit; the architecture scales to 500k+ courses without code changes.
- Sitemap and robots responses use `Content-Type: application/xml` (or `text/plain` for robots) and short `stale-while-revalidate` cache headers.

### noindex boundaries

Authenticated and private areas emit `robots: noindex, nofollow` via layout/page metadata (in addition to robots.txt disallow rules):

- `(dashboard)/layout.tsx` (teacher dashboard)
- `(student)/student/layout.tsx`
- `(superadmin)/layout.tsx`
- `(tenant)/layout.tsx`
- `community/layout.tsx`
- `exam-sessions/layout.tsx`, `exam-results/layout.tsx`, `wallet/layout.tsx`
- `tenant-not-found/page.tsx`

## Google Search Console Setup

Each tenant domain (e.g. `teachify.tech`, `academy.test`, tenant custom domains) must be **verified independently**. Two complementary mechanisms exist:

### 1. Verification tokens (per-tenant, `<meta>` based)

- Platform-wide defaults: `NEXT_PUBLIC_GSC_VERIFICATION` and `NEXT_PUBLIC_BING_VERIFICATION` (see `apps/web/.env.local.example`).
- Per-tenant override: when the `/tenant/by-domain` API returns an `seo` object (`googleVerification`, `bingVerification`, `description`, `titleTemplate`), those tokens win for that tenant. The frontend type is `TenantSeoConfig` in `apps/web/src/features/tenant-bootstrap/types/index.ts`; the API response does not yet include this field, so today the platform env tokens are used for all tenants.
- The tokens render as:
  - `<meta name="google-site-verification" content="...">`
  - `<meta name="msvalidate.01" content="...">`
- Token resolution is strict per tenant: tenant A's token can never appear on tenant B's domain, and absent tokens render no verification tag at all (never a fake/placeholder value).

### 2. DNS verification (recommended for domain properties)

DNS TXT verification is the most robust for *Domain* properties and cannot be affected by any code. For each domain, add the `google-site-verification` TXT record at the DNS provider.

### Property type guidance (multi-tenant)

- **Domain property** (`https://tenant.example.com` + subdomains): verifies the whole domain, ideal when a tenant serves pages under one domain. Use DNS TXT.
- **URL-prefix property** (`https://tenant.example.com` only): use when the tenant has multiple hostnames or you only care about a specific host. Use the `<meta>` token (above) or DNS.

### Steps per tenant domain

1. **Add the property** as *Domain* (preferred) or *URL-prefix* in GSC.
2. **Verify ownership** with DNS TXT and/or the `<meta>` token (see above).
3. **Submit the sitemap**: `https://<tenant-domain>/sitemap.xml` — GSC will follow the index to the core and course-chunk files.
4. Confirm `/robots.txt` renders `Sitemap: https://<tenant-domain>/sitemap.xml` with the same origin.

## Verification Checklist (after deploy)

1. **Head inspection** for a public page (home, `/courses`, a course, a stage):
   - `<title>` uses the tenant name via the template, e.g. `<page title> | <tenant name>`.
   - `<meta name="description">` is the tenant description.
   - `<link rel="canonical">` is absolute and matches the requested tenant origin.
   - `<meta name="robots" content="index, follow">`.
   - `<meta property="og:site_name">` and `og:locale` (`ar_SA`) present.
2. **Noindex check** for `/teacher/*`, `/student/*`, `/superadmin/*`, `/community/*`, `/exam-sessions/*`, `/exam-results/*`, `/wallet/*`, `/tenant-not-found`:
   - `<meta name="robots" content="noindex, nofollow">`.
3. **robots.txt**: `/robots.txt` — confirms disallow rules and sitemap URL. It must NOT block `/api/` or asset/CDN paths required for rendering.
4. **sitemap.xml**: `/sitemap.xml` is a sitemap *index* whose children (`/sitemap-core.xml`, `/sitemap-courses/{n}`) are absolute, tenant-scoped, and reference only public routes. Fetch at least one course chunk and confirm it lists only that tenant's URLs.
5. **Structured data**: validate JSON-LD via Google's Rich Results Test / Schema Markup Validator:
   - Home: `EducationalOrganization` + `WebSite`.
   - Course: `Course` + `BreadcrumbList`.
   - Stage and catalog: `ItemList` of `Course` + `BreadcrumbList`.
   - No fake ratings, reviews, offers, or organizations — only truthful visible content.
6. **URL Inspection**: in GSC, run the Live Test and Request Indexing for home and a sample of catalog URLs after each deployment.

## Maintenance Rules

- **New private route**: add `export const metadata: Metadata = { robots: { index: false, follow: false } }` to its layout (or `export const metadata` with noindex on the page).
- **New public route**: it must have a unique `<title>`/description and — if it can be reached by more than one URL — an absolute canonical.
- **New sitemap-worthy route**: add it to the core sitemap route `apps/web/src/app/sitemap-core.xml/route.ts`; for large collections use the paginated pattern in `apps/web/src/app/sitemap-courses/[page]/route.ts` and never exceed `SITEMAP_MAX_URLS_PER_FILE`.
- **Domain changes**: update the Caddy/proxy `Host` forwarding and DNS; canonicals are derived from request headers so they follow automatically.
- **Title/description defaults** live in `apps/web/src/lib/seo/metadata.ts` (`SITE_DEFAULT_DESCRIPTION`) and `apps/web/src/config/env.ts` (`env.appName`).
- **Verify after every SEO change**: run `npm test` and `npm run seo:check` (below).

## Validation Commands

Run from `apps/web`:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm test` — unit tests for the SEO system (`src/lib/seo/*.test.ts`): canonical/URL handling, metadata + verification tokens, JSON-LD truthfulness, sitemap XML builders, and cross-tenant isolation.
- `npm run seo:check` — local health-crawl against a running instance (default `http://localhost:3100`, override with `SEO_CHECK_ORIGIN`). Checks titles/descriptions, canonical/robots/OG/Twitter tags, JSON-LD validity, robots.txt, sitemap index + children (same-origin, public URLs only, no query strings), noindex on private routes, and absence of fake rating signals. Requires no external services.

Runtime smoke test (with the Laravel API reachable):

```bash
npm run build
npm start # or: next start -p 3100
# then verify the head tags, robots.txt, and the sitemap index + children as described above
```

## Known Limitations

- Next.js streams metadata for dynamic pages after the initial `<head>` shell; the final document still contains the full `<head>` metadata for crawlers. This is framework behavior, not a regression.
- `x-tenant-context` (base64 header) is supported by `getTenantSeoContext()` but not yet emitted by middleware; tenant context currently resolves through the public `/tenant/by-domain` API. If a proxy starts injecting `x-tenant-context`, no code change is required.
- The backend `/tenant/by-domain` response does not yet include an `seo` object, so per-tenant verification tokens/description/title-template fall back to the platform env values. The frontend type (`TenantSeoConfig`) is ready; add the `seo` field to the API response to enable per-tenant overrides.
- The homepage canonical may render without a trailing slash (`https://domain` instead of `https://domain/`); both forms are equivalent for search engines.
