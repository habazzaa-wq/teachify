"use client";

import { create } from "zustand";
import { addApiRequestContextReader } from "@/services/api/request-context";
import type {
  ActiveTenant,
  Membership,
  Permission,
  Role,
  Ability,
  NavigationItem,
} from "@/types/tenant.types";
import type { AuthBranding } from "@/types/auth.types";
import type { TenantBranding } from "@/features/tenant-bootstrap/types";

export type BootstrapStatus =
  | "idle"
  | "loading"
  | "resolved"
  | "not-found"
  | "error";

interface TenantState {
  activeTenant: ActiveTenant | null;
  membership: Membership | null;
  roles: Role[];
  permissions: Permission[];
  abilities: Ability | null;
  navigation: NavigationItem[];

  domain: string | null;
  subdomain: string | null;
  branding: TenantBranding | null;
  /** Platform-level brand colors (the "platform colors" field). Distinct from
   *  `branding`, which is the teacher appearance applied only to the teacher
   *  dashboard and login. */
  platformBranding: TenantBranding | null;
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;

  setActiveTenant: (tenant: ActiveTenant | null) => void;
  setTenantSite: (site: {
    name: string;
    favicon: string | null;
    logo_type?: string | null;
    logo_icon?: string | null;
    logo_image?: string | null;
    font?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
  }) => void;
  setTenantContext: (context: {
    tenant: ActiveTenant;
    membership: Membership;
    roles: Role[];
    permissions: Permission[];
    abilities: Ability;
    navigation: NavigationItem[];
  }) => void;
  /** Updates only the platform-level brand colors (the public-site theme). */
  setPlatformBranding: (branding: Partial<TenantBranding>) => void;
  setTenantBootstrap: (data: {
    id: number;
    name: string;
    slug: string;
    domain: string;
    status: string;
    branding: TenantBranding;
    platformBranding?: TenantBranding | null;
    subdomain?: string | null;
  }) => void;
  setBootstrapStatus: (status: BootstrapStatus) => void;
  setBootstrapError: (error: string | null) => void;
  clear: () => void;
}

export const useTenantStore = create<TenantState>()(
  (set) => ({
    activeTenant: null,
    membership: null,
    roles: [],
    permissions: [],
    abilities: null,
    navigation: [],

    domain: null,
    subdomain: null,
    branding: null,
    platformBranding: null,
    bootstrapStatus: "idle",
    bootstrapError: null,

    setActiveTenant: (tenant) => set({ activeTenant: tenant }),

    setTenantSite: ({ name, favicon, logo_type, logo_icon, logo_image, font, primary_color, secondary_color }) =>
      set((state) => {
        const brandingBase = state.activeTenant?.branding ?? {
          logo: null,
          favicon: null,
          primary_color: null,
          secondary_color: null,
          accent_color: null,
          font: null,
          dark_logo: null,
          light_logo: null,
        };

        const mergedBranding: AuthBranding = {
          ...brandingBase,
          favicon,
          ...(logo_type !== undefined && { logo_type }),
          ...(logo_icon !== undefined && { logo_icon }),
          ...(logo_image !== undefined && { logo_image }),
          ...(font !== undefined && { font }),
          ...(primary_color !== undefined && { primary_color }),
          ...(secondary_color !== undefined && { secondary_color }),
        };

        const activeTenant = state.activeTenant
          ? {
              ...state.activeTenant,
              name,
              branding: mergedBranding,
            }
          : null;

        return {
          activeTenant,
          branding: state.branding
            ? {
                ...state.branding,
                favicon,
                ...(logo_type !== undefined && { logoType: logo_type }),
                ...(logo_icon !== undefined && { logoIcon: logo_icon }),
                ...(logo_image !== undefined && { logoImage: logo_image }),
                ...(font !== undefined && { font }),
                ...(primary_color !== undefined && { primaryColor: primary_color }),
                ...(secondary_color !== undefined && { secondaryColor: secondary_color }),
              }
            : state.branding,
        };
      }),

    setTenantContext: ({ tenant, membership, roles, permissions, abilities, navigation }) =>
      set({
        activeTenant: tenant,
        membership,
        roles,
        permissions,
        abilities,
        navigation,
        platformBranding:
          (tenant.platformBranding as TenantBranding | null) ??
          ((tenant as unknown as Record<string, unknown>).platform_branding as TenantBranding | null) ??
          null,
      }),

    setTenantBootstrap: (data) =>
      set((state) => {
        const prev = state.activeTenant?.branding;
        const incoming = data.branding;
        // The auth/me `branding` payload is snake_case at runtime (`primary_color`)
        // while the public `by-domain` payload is camelCase (`primaryColor`).
        // Read both shapes defensively.
        const raw = incoming as unknown as Record<string, unknown>;

        // Preserve the previously-applied brand colors if the incoming payload
        // doesn't carry them (e.g. a bootstrap source with null branding), so a
        // re-bootstrap can never reset the control-panel colors to defaults.
        // Accept both snake_case (auth/me `getBranding`) and camelCase
        // (public `by-domain`) key shapes.
        const primaryColor =
          (incoming.primaryColor as string | undefined) ??
          (raw["primary_color"] as string | undefined) ??
          prev?.primary_color ??
          null;
        const secondaryColor =
          (incoming.secondaryColor as string | undefined) ??
          (raw["secondary_color"] as string | undefined) ??
          prev?.secondary_color ??
          null;

        return {
          activeTenant: {
            id: data.id,
            name: data.name,
            slug: data.slug,
            status: data.status,
            domain: data.domain,
            branding: {
              logo: incoming.logo ?? prev?.logo ?? null,
              favicon: incoming.favicon ?? prev?.favicon ?? null,
              primary_color: primaryColor,
              secondary_color: secondaryColor,
              accent_color: incoming.accentColor ?? prev?.accent_color ?? null,
              font: incoming.font ?? prev?.font ?? null,
              dark_logo: incoming.darkLogo ?? prev?.dark_logo ?? null,
              light_logo: incoming.lightLogo ?? prev?.light_logo ?? null,
              logo_type: incoming.logoType ?? prev?.logo_type ?? null,
              logo_icon: incoming.logoIcon ?? prev?.logo_icon ?? null,
              logo_image: incoming.logoImage ?? prev?.logo_image ?? null,
              domain: data.domain,
            },
          },
          domain: data.domain,
          subdomain: data.subdomain ?? null,
          branding: {
            ...incoming,
            primaryColor,
            secondaryColor,
          },
          platformBranding: data.platformBranding ?? state.platformBranding,
          bootstrapStatus: "resolved",
          bootstrapError: null,
        };
      }),

    setBootstrapStatus: (status) => set({ bootstrapStatus: status }),

    setPlatformBranding: (branding) =>
      set((state) => ({
        platformBranding: {
          ...(state.platformBranding ?? {
            logo: null,
            favicon: null,
            primaryColor: null,
            secondaryColor: null,
            accentColor: null,
            font: null,
            darkLogo: null,
            lightLogo: null,
            logoType: null,
            logoIcon: null,
            logoImage: null,
          }),
          ...branding,
        } as TenantBranding,
      })),

    setBootstrapError: (error) => set({ bootstrapError: error }),

    clear: () =>
      set({
        activeTenant: null,
        membership: null,
        roles: [],
        permissions: [],
        abilities: null,
        navigation: [],
        domain: null,
        subdomain: null,
        branding: null,
        platformBranding: null,
        bootstrapStatus: "idle",
        bootstrapError: null,
      }),
  }),
);

// Provide tenant request context lazily to the API layer at request time.
// Registered from the store itself so axios.ts never has to import Zustand
// (see services/api/request-context.ts).
addApiRequestContextReader(() => ({
  tenantId: useTenantStore.getState().activeTenant?.id?.toString() ?? null,
  tenantDomain: useTenantStore.getState().domain ?? null,
}));
