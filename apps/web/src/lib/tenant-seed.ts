import type { ActiveTenant } from "@/types/tenant.types";
import type {
  TenantBranding,
  TenantByDomainResponse,
} from "@/features/tenant-bootstrap/types";

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
    branding: {
      logo: b?.logo ?? null,
      favicon: b?.favicon ?? null,
      primary_color: b?.primaryColor ?? null,
      secondary_color: b?.secondaryColor ?? null,
      accent_color: b?.accentColor ?? null,
      font: b?.font ?? null,
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
