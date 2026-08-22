# .opencode/summary.md — Session State

## Goal (current session)
- Make every brand-colored detail on the platform dynamic, driven by teacher site-settings branding (`#D87B63` primary / `#FFB50E` secondary), then lint/typecheck and deploy to production.
- Round 2 (this session): eliminate ALL remaining static brand-derived colors — `WhyChooseUs` flagship tile gradient, course-card "اشترك الآن" buttons + featured ribbons, navbar hover text, certificate badge, active pills, hero social icons — AND make public auth/wallet/exam-results pages use the dynamic shadcn tokens by wrapping them in `.community-theme`.
- Deploy target: `ssh -i C:\Users\everest\.ssh\id_ed25519_techify -o StrictHostKeyChecking=no deplo@187.127.92.237 "bash /var/www/teachify/deploy.sh"`. Repo: `D:\projects\techify_production`, branch `deploy`.

## Constraints & Preferences
- Do NOT modify `apps/web/src/config/env.ts` line 108 (`resolveApiUrl` same-origin fix).
- Keep `apps/web/src/components/home/PublicNavbar.tsx` 394-401 `any` casts and `<img>` warnings as-is (pre-existing).
- `.opencode/` is local session state — never committed.
- Dashboard-only semantic colors stay static (student-dashboard ink `#F0ECE6`/`#1a1510`, difficulty `#22c55e`/`#ef4444`, lesson-type `#3b82f6`/`#10b981`/`#a855f7`, `#4F46E5` dashboard-theme defaults).

## Progress
### Done
- **Commit `726d84b` (previous round, deployed)**: full dynamic brand-color pipeline — backend `TenantSettingController` accepts `primary_color`/`secondary_color` (hex, validated); `TenantCreationService` default branding; `lib/color.ts` helpers (`hexToRgb/Hsl/RgbTriplet`, `mixWithBlack`, `generateCommunityThemeColors`); `lib/brand.ts` (`BRAND_PRIMARY_DEFAULT`/`BRAND_SECONDARY_DEFAULT`, `normalizeHex`, `resolveBrandHexColors`, `brandAlpha`, `brandContrast`); `hooks/useBrandColors.ts`; `BrandThemeProvider.tsx` (runtime `<style id="brand-theme-vars">` on `:root`); `tenant.store.ts` persists colors; teacher `/teacher/settings/branding` color pickers; ~70 files converted to `var(--brand-*)`/`rgb(var(--brand-…-rgb) / a)`.
- **Commit `fef5264` (this round, deployed)**: remaining static brand colors → dynamic:
  - `lib/color.ts`: added `mixWithWhite(hex, amount)`.
  - `BrandThemeProvider` + `globals.css`: new tokens `--brand-primary-light`/`--brand-secondary-light` (`mixWithWhite(x, 0.25)`); contrast vars already emitted.
  - `WhyChooseUsOrbit.tsx:154`: `#E08A6C` → `var(--brand-primary-light)`; tile text-white → `text-[var(--brand-primary-contrast)]`.
  - `CatalogCourseCard.tsx`/`StageCourseCard.tsx`: "اشترك الآن" buttons `#F7A20B`/`#1a1510` → secondary gradient + `--brand-secondary-contrast` + `rgb(var(--brand-secondary-rgb) / a)` shadows; featured ribbons (bg+shadow+`text-white`) → contrast var; subject/price badges on primary → `--brand-primary-contrast` (price kept semantic green `#22C55E`).
  - `PublicNavbar.tsx`: 6× `#2D1B00` hover → `--brand-secondary-contrast`; wallet icon, logo icon, register CTA, avatar initials, active nav → `--brand-primary-contrast`.
  - `HeroSection.tsx`: social circles/labels on gold → `--brand-secondary-contrast`, on coral → `--brand-primary-contrast`.
  - `MobileSecondaryNav.tsx`: added per-item `contrast` field; icons/badges/active link → contrast vars.
  - `CatalogStageStrip.tsx` + `StageTeachersStrip.tsx`: active pill `#fff` → `var(--brand-primary-contrast)` (teachers count keeps 0.85 via inline opacity).
  - `CourseHero.tsx:383`: certificate badge shadow + text → dynamic.
  - **`.community-theme` wrapping** (user-approved): `PublicLayout.tsx` root div + `(tenant)`, `wallet`, `exam-results`, `exam-sessions` layouts now apply `community-theme`, so shadcn `bg-primary`/`text-primary`/`border-primary`/`bg-accent` on those public pages follow dynamic brand tokens (were resolving to static blue `--primary: 230 65% 50%`). Wallet modals & auth cards already render under covered layouts.
- **Verification**: `npm run typecheck` clean; eslint on all changed files shows only pre-existing PublicNavbar `any`s + `<img>` warnings; `npm run build` (Next 16.2.9 Turbopack) succeeds (NFT warning pre-existing).
- **Deployed** via `deploy.sh` (pushed `fef5264`); first SSH attempt was killed by local 10-min timeout mid-build, re-ran detached (`nohup … > /tmp/deploy.log`) — completed in 99s, all PM2 processes online, sanity curl: `/` 307 (normal redirect), `/courses` 200, `/tenant-login` 200, `/wallet/recharge-result` 200.

### In Progress
- None.

### Blocked
- None.

## Key Decisions
- CSS-variable strategy: `BrandThemeProvider` emits `--brand-*` on `:root` (global, no rebuild); `.community-theme` shadcn tokens overridden via `generateCommunityThemeColors(primary, secondary, isDark)`.
- `--brand-*-contrast` computed by `brandContrast` (lum > 0.6 → dark `#17130d`, else `#ffffff`); used for all text-on-brand (replaces hardcoded `#fff`/`#1a1510`).
- `.community-theme` is the shadcn-token bridge for ALL public routes now (was community-only); verified no public page under the wrapped routes uses gray `bg-secondary`/`variant="secondary"` that would unintentionally turn gold (those exist only in dashboard/studio features outside `.community-theme`).
- Gold (secondary) backgrounds + text always use `--brand-secondary-contrast`; white-on-gold was a contrast bug now fixed everywhere it mattered.
- Left intentionally static: ink text `#1a1510`/`#F0ECE6` (neutral), semantic success/danger/lesson-type colors, `globals.css` var fallbacks, `lib/brand.ts` defaults, branding-page placeholders.

## Next Steps
- None pending for this task. If user reports more non-dynamic brand colors, re-grep with the brand-family hex/rgba pattern (see Critical Context) and route all fixes through `--brand-*`/contrast vars.

## Critical Context
- Brand hex scan pattern: `#(D87B63|FFB50E|E08A6C|F7A20B|2D1B00|613e32|805b07)[0-9a-fA-F]*` + rgba triplets `(245,158,11|247,162,11|216,123,99|255,181,14)`.
- `rg` not on PATH; use `Get-ChildItem`/grep tool. `npx eslint` mangles `(dashboard)` paths on Windows — use `node node_modules/eslint/bin/eslint.js`.
- Static `:root` shadcn `--primary` = blue `230 65% 50%`; `.community-theme` (now all public routes) overrides to brand colors. Dashboards keep `tenant-theme`.
- `git diff --name-only` under `apps/web` returns repo-root-relative paths (`apps/web/src/...`); convert to `src/...` for linting.
- Deploy gotcha: `deploy.sh` runs `next build` in the foreground of the SSH session; a long `npm run build` can exceed a 10-min tool timeout and kill the deploy mid-build. Re-run detached: `nohup bash /var/www/teachify/deploy.sh > /tmp/deploy.log 2>&1 &`, poll `tail /tmp/deploy.log` and `pm2 list`.
- Server: branch `deploy` @ `fef5264`, PM2 `teachify-frontend` id 0. Curl via `http://localhost:3000/…` for Next routes.

## Relevant Files
- `apps/web/src/components/layout/BrandThemeProvider.tsx` (runtime brand CSS-var injector; emits dark/light/contrast tokens + `.community-theme` shadcn overrides).
- `apps/web/src/lib/brand.ts`, `apps/web/src/lib/color.ts` (`mixWithWhite`), `apps/web/src/hooks/useBrandColors.ts`.
- `apps/web/src/app/globals.css` (`:root` `--brand-*` fallbacks + `.community-theme` tokens).
- Public routes now wrapped in `community-theme`: `apps/web/src/layouts/PublicLayout.tsx`, `apps/web/src/app/(tenant)/layout.tsx`, `apps/web/src/app/wallet/layout.tsx`, `apps/web/src/app/exam-results/layout.tsx`, `apps/web/src/app/exam-sessions/layout.tsx` (community layout already had it).
- Public components converted this round: `components/home/{PublicNavbar,HeroSection,MobileSecondaryNav,WhyChooseUsOrbit}.tsx`, `features/course-catalog/components/{CatalogCourseCard,CatalogStageStrip}.tsx`, `features/stage-courses/components/{StageCourseCard,StageTeachersStrip}.tsx`, `features/public-course/components/CourseHero.tsx`.
- Backend (done in `726d84b`): `apps/api/app/Http/Controllers/Api/v1/Platform/TenantSettingController.php`, `apps/api/app/Services/Platform/TenantCreationService.php`.

## Historical (previous sessions, already deployed)
- Navbar logo/name branding (`9e4c387`), Google Fonts (`72ebead`), and the section/lesson/exam restore + auto-publish fix (`2d7a420`). API endpoints & tinker verification patterns from those sessions live on the server; see git history for details.
