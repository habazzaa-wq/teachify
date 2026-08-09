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

### Final indexability matrix

The policy below is the single source of truth and was verified against the running
application (both tenants and the platform host) during the final hardening pass.

| Route group | Policy | Mechanism |
| --- | --- | --- |
| `/` (home) | INDEX / follow | `generateMetadata` in `app/(home)/page.tsx` → `buildSeoMetadata` (`robots: index, follow`) |
| `/courses` (catalog) | INDEX / follow | `generateMetadata` in `app/(home)/courses/page.tsx` |
| `/stages/*` (stage) | INDEX / follow | `generateMetadata` in `app/(home)/stages/[stageId]/page.tsx` |
| `/courses/*` (course detail) | INDEX / follow | `generateMetadata` in `app/(home)/courses/[slug]/page.tsx` |
| `/teacher/*` (dashboard) | NOINDEX / NOFOLLOW | `app/(dashboard)/layout.tsx` metadata |
| `/student/*` | NOINDEX / NOFOLLOW | `app/(student)/student/layout.tsx` metadata |
| `/superadmin/*` | NOINDEX / NOFOLLOW | `app/(superadmin)/layout.tsx` metadata |
| `/wallet/*` | NOINDEX / NOFOLLOW | `app/wallet/layout.tsx` metadata |
| `/exam-sessions/*` | NOINDEX / NOFOLLOW | `app/exam-sessions/layout.tsx` metadata |
| `/exam-results/*` | NOINDEX / NOFOLLOW | `app/exam-results/layout.tsx` metadata |
| `/community` | NOINDEX / NOFOLLOW | `app/community/layout.tsx` metadata |
| `/tenant-login` (auth/private account pages) | NOINDEX / NOFOLLOW | `app/(tenant)/layout.tsx` metadata |
| `/tenant-not-found` | NOINDEX / NOFOLLOW | `app/tenant-not-found/page.tsx` metadata |
| 404 (`not-found.tsx`) | NOINDEX / NOFOLLOW | `app/not-found.tsx` metadata |

Private/authenticated areas also appear in the `disallow` rules of `app/robots.ts`
(secondary layer). The authoritative signal for Google is the page/layout metadata.

### noindex boundaries

Authenticated and private areas emit `robots: noindex, nofollow` via layout/page metadata (in addition to robots.txt disallow rules) — see the indexability matrix above. The layouts/pages that carry the metadata are:

- `(dashboard)/layout.tsx` (teacher dashboard)
- `(student)/student/layout.tsx`
- `(superadmin)/layout.tsx`
- `(tenant)/layout.tsx`
- `community/layout.tsx`
- `exam-sessions/layout.tsx`, `exam-results/layout.tsx`, `wallet/layout.tsx`
- `tenant-not-found/page.tsx`

### Canonical strategy

- Every public page emits one absolute `<link rel="canonical">` built from the current request origin (`getRequestOrigin()`), so it always matches the tenant host the visitor used.
- Tracking/ref params (`utm_*`, `fbclid`, `gclid`, `ref`, `source`, …) are stripped (`canonicalUrl()` in `src/lib/seo/url.ts`). List-page filter state is intentionally not part of canonicals — filtered views canonicalize to their clean URL.
- Private pages emit **no canonical** (`buildSeoMetadata` drops `alternates` when `noindex` is set), so an authenticated page can never become the canonical representation of a URL.
- Homepage canonical may render without a trailing slash (`https://domain` vs `https://domain/`); both forms are equivalent for search engines.

### Tenant isolation

Isolation is enforced by building every URL from the per-request tenant origin and by resolving metadata strictly from the current tenant context. The final cross-tenant test between `hazem.academy.test` and `beta.academy.test` verified:

| Check | Tenant A (hazem) | Tenant B (beta) |
| --- | --- | --- |
| Homepage canonical | `http://hazem.academy.test` | `http://beta.academy.test` |
| `og:site_name` / `<title>` | Hazem Academy | Beta Academy |
| robots.txt `Sitemap:` | hazem origin | beta origin |
| Sitemap core URLs | only `hazem.academy.test/...` | only `beta.academy.test/...` |
| Course chunk URLs | 10 × hazem courses | 1 × beta course |
| JSON-LD provider/`@id`/URLs | only hazem origin | only beta origin |

Result: **0 cross-tenant URLs, 0 cross-tenant metadata, 0 cross-tenant course data,
0 cross-tenant canonical URLs, 0 cross-tenant sitemap entries.**

## Google Search Console Setup

Each tenant domain (e.g. `teachify.tech`, `academy.test`, tenant custom domains) must be **verified independently**. Two complementary mechanisms exist:

### 1. Verification tokens (per-tenant, `<meta>` based)

- Platform-wide defaults: `NEXT_PUBLIC_GSC_VERIFICATION` and `NEXT_PUBLIC_BING_VERIFICATION` (see `apps/web/.env.local.example`).
- Per-tenant override: when the `/tenant/by-domain` API returns an `seo` object (`googleVerification`, `bingVerification`, `description`, `titleTemplate`), those tokens win for that tenant. The frontend type is `TenantSeoConfig` in `apps/web/src/features/tenant-bootstrap/types/index.ts`.
  - **Current state (verified):** the API response does not yet include the `seo` field — a live `/tenant/by-domain` call for `hazem.academy.test` and `beta.academy.test` returns only `id`, `name`, `slug`, `domain`, `status`, `branding`. Per-tenant SEO tokens/description/title-template therefore fall back to the platform env values today. The frontend is ready; add the `seo` field to the API response to enable per-tenant overrides.
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
- `npm run seo:check` — local health-crawl against a running instance (default `http://localhost:3100`, override with `SEO_CHECK_ORIGIN`). Checks titles/descriptions, canonical/robots/OG/Twitter tags, JSON-LD emission, robots.txt, sitemap index + children (same-tenant-origin, public URLs only, no query strings), noindex on private routes, and absence of fake rating signals. Requires no external services.
  - The platform host (`localhost`) redirects `/` to the admin panel, so the full page checks run in **tenant mode**: `SEO_CHECK_TENANT_HOST=hazem.academy.test npm run seo:check` presents that Host to `SEO_CHECK_ORIGIN` (no DNS/hosts-file needed) and verifies the tenant view end-to-end. Without it, `seo:check` verifies the host-agnostic surface (robots.txt, sitemap index, noindex) and prints this guidance.

Runtime smoke test (with the Laravel API reachable):

```bash
npm run build
npm start # or: next start -p 3100
# then verify the head tags, robots.txt, and the sitemap index + children as described above
```

## Current Check Status (last verified run)

`seo:check` was run against the running stack (`SEO_CHECK_ORIGIN=http://localhost:3100`,
Laravel API reachable) for both tenants and the platform host:

| Target | Result |
| --- | --- |
| `SEO_CHECK_TENANT_HOST=hazem.academy.test` | **65 passed / 3 WARN** |
| `SEO_CHECK_TENANT_HOST=beta.academy.test` | **55 passed / 3 WARN** |
| platform host (no tenant host) | **22 passed / 0 failed** |

### Remaining non-blocking warnings

The only warnings are three `og:image` warnings (Homepage, Catalog, Course) on each tenant.
They are **data-driven, not bugs** and were confirmed by inspecting the live API:

- `branding.logo` is `null` for both `hazem.academy.test` and `beta.academy.test`.
- The public hero (`/public/hero`) returns an empty `teacherImage`.
- Every published course has `coverImage: null` and `thumbnail: null` (hazem: 10/10, beta: 1/1).

When a real image *does* exist it is emitted as an absolute URL — e.g. hazem's stage pages
emit `<meta property="og:image" content="https://picsum.photos/seed/kindergarten-stage/800/500"/>`.
The system never invents or fabricates an image; once a tenant uploads a logo, hero image, or
course cover, the matching pages emit `og:image` automatically with no code change. These WARNs
do not fail `npm run seo:check` (exit code stays 0); only hard failures do.

## Known Limitations

- **Dynamic pages stream their body through the React Flight (RSC) payload.** The initial HTML always contains the literal `<head>` metadata (title, canonical, description, robots, OG/Twitter, verification) plus the loading shell; page text and JSON-LD `<script>` blocks arrive inside the RSC payload and materialize after client hydration. Googlebot renders JavaScript, so JSON-LD is indexable, but non-JS crawlers and link scrapers see the shell only. This is framework behavior (async server components + streaming), not a regression — the SEO system keeps the crawler-critical signals (canonicals, metadata, robots.txt, sitemaps) in literal output. `seo:check` treats JSON-LD as "emitted" when present in the response payload.
- `x-tenant-context` (base64 header) is supported by `getTenantSeoContext()` but not yet emitted by middleware; tenant context currently resolves through the public `/tenant/by-domain` API. If a proxy starts injecting `x-tenant-context`, no code change is required.
- The backend `/tenant/by-domain` response does not yet include an `seo` object, so per-tenant verification tokens/description/title-template fall back to the platform env values. The frontend type (`TenantSeoConfig`) is ready; add the `seo` field to the API response to enable per-tenant overrides.
- The homepage canonical may render without a trailing slash (`https://domain` instead of `https://domain/`); both forms are equivalent for search engines.
- `og:image` is only emitted when a real image exists (tenant branding logo, stage image, or course cover/thumbnail) — never invented. Tenants without imagery get no `og:image`; `seo:check` reports this as a WARN, not a failure.
