import type { ActiveTenant } from "@/types/tenant.types";
import type {
  TenantBranding,
  TenantByDomainResponse,
} from "@/features/tenant-bootstrap/types";
import { resolveTenantFont } from "@/features/settings/constants/google-fonts";

/**
 * Shape the tenant payload the server already resolved (the `x-tenant-context`
 * header / by-domain lookup) into the client `ActiveTenant` shape.
 *
 * The server renders the same payload into the very first HTML (navbar, footer,
 * news ticker, tenant font), so the first paint must not fall back to the
 * platform defaults and then "correct itself" after hydration — that was the
 * visible flash of wrong colors/fonts on custom domains.
 */
export function tenantSeedToActiveTenant(
  seed: TenantByDomainResponse | null | undefined,
): ActiveTenant | null {
  if (!seed) return null;
  const b = seed.branding;
  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    status: seed.status,
    domain: seed.domain,
    feature_flags: seed.feature_flags ?? null,
    branding: {
      logo: b?.logo ?? null,
      favicon: b?.favicon ?? null,
      primary_color: b?.primaryColor ?? null,
      secondary_color: b?.secondaryColor ?? null,
      accent_color: b?.accentColor ?? null,
      // Accept either branding row so the first paint on a public domain uses
      // the saved font even if only the platform copy carries it.
      font:
        b?.font ??
        seed.platform_branding?.font ??
        seed.platformBranding?.font ??
        null,
      dark_logo: b?.darkLogo ?? null,
      light_logo: b?.lightLogo ?? null,
      logo_type: b?.logoType ?? null,
      logo_icon: b?.logoIcon ?? null,
      logo_image: b?.logoImage ?? null,
      domain: seed.domain,
    },
    platform_branding: tenantSeedPlatformBranding(seed),
  };
}

export function tenantSeedPlatformBranding(
  seed: TenantByDomainResponse | null | undefined,
): TenantBranding | null {
  return seed?.platform_branding ?? seed?.platformBranding ?? null;
}

function normalizeDomain(domain: string | null | undefined): string {
  return domain?.trim().toLowerCase().replace(/^www\./, "") ?? "";
}

function isSameTenant(
  a: ActiveTenant | null,
  b: ActiveTenant | null,
): boolean {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  if (a.slug && b.slug && a.slug === b.slug) return true;
  const aDomain = normalizeDomain(a.domain);
  const bDomain = normalizeDomain(b.domain);
  return Boolean(aDomain && bDomain && aDomain === bDomain);
}

/**
 * The server already resolved the tenant for the current hostname. A persisted
 * `tenant-state` from an earlier visit (or another domain) must never win over
 * it: that stale copy was making the saved font flip back and hiding the
 * instructors link after hydration.
 *
 * Keep auth-only fields from the store (membership data lives outside the
 * tenant object anyway), but let the current server payload win for identity,
 * feature flags and branding. `liveFont` is used only for a font changed in the
 * current session, where `null` is a meaningful "clear font" value.
 */
export function mergeTenantSeedWithStored(
  seed: ActiveTenant | null,
  stored: ActiveTenant | null,
  liveFont?: string | null,
): ActiveTenant | null {
  if (!seed) return stored;
  if (!stored || !isSameTenant(seed, stored)) return seed;

  const seedBranding = seed.branding ?? null;
  const storedBranding = stored.branding ?? null;
  const seedPlatform = seed.platform_branding ?? seed.platformBranding ?? null;
  const storedPlatform = stored.platform_branding ?? stored.platformBranding ?? null;

  const font =
    liveFont !== undefined
      ? liveFont
      : resolveTenantFont(seedBranding, seedPlatform, storedBranding, storedPlatform);

  const branding = {
    ...(storedBranding ?? {}),
    ...(seedBranding ?? {}),
    font,
  } as ActiveTenant["branding"];

  const platform = seedPlatform ?? storedPlatform ?? null;
  const mergedPlatform = platform ? ({ ...platform, font } as TenantBranding) : null;

  return {
    ...stored,
    ...seed,
    branding,
    platform_branding: mergedPlatform,
    platformBranding: mergedPlatform,
    feature_flags: seed.feature_flags ?? stored.feature_flags ?? null,
  };
}
