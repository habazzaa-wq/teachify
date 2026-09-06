"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

/**
 * The teacher appearance colors arrive in two different key shapes depending on
 * the bootstrap source: `auth/me` returns snake_case (`primary_color`) while the
 * public `by-domain` endpoint returns camelCase (`primaryColor`). Consumers
 * (the dashboard, the tenant login page, the appearance editor) read a mix of
 * both shapes. Normalize any branding payload into a single shape that always
 * carries *both* keys so the control-panel theme never drops to defaults on a
 * refresh just because one bootstrap source happened to use the other casing.
 */
function normalizeBranding(branding: unknown): Record<string, unknown> | null {
  if (!branding || typeof branding !== "object") return (branding as null) ?? null;
  const b = branding as Record<string, unknown>;
  const primary = (b.primary_color ?? b.primaryColor ?? null) as string | null;
  const secondary = (b.secondary_color ?? b.secondaryColor ?? null) as string | null;
  return {
    ...b,
    primary_color: primary,
    primaryColor: primary,
    secondary_color: secondary,
    secondaryColor: secondary,
  };
}

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
  setPlatformBranding: (branding: Partial<TenantBranding> & {
    logoType?: string | null;
    logoIcon?: string | null;
    logoImage?: string | null;
  }) => void;
  setTenantBootstrap: (data: {
    id: number;
    name: string;
    slug: string;
    domain: string;
    status: string;
    branding: TenantBranding;
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
              branding: normalizeBranding(mergedBranding) as unknown as AuthBranding,
            }
          : null;

        return {
          activeTenant,
          branding: state.branding
            ? (normalizeBranding({
                ...state.branding,
                favicon,
                ...(logo_type !== undefined && { logoType: logo_type }),
                ...(logo_icon !== undefined && { logoIcon: logo_icon }),
                ...(logo_image !== undefined && { logoImage: logo_image }),
                ...(font !== undefined && { font }),
                ...(primary_color !== undefined && { primaryColor: primary_color }),
                ...(secondary_color !== undefined && { secondaryColor: secondary_color }),
              }) as unknown as TenantBranding)
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
      }),

    setTenantBootstrap: (data) =>
      set({
        activeTenant: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          status: data.status,
          domain: data.domain,
          branding: {
            logo: data.branding.logo,
            favicon: data.branding.favicon,
            primary_color: data.branding.primaryColor,
            secondary_color: data.branding.secondaryColor,
            accent_color: data.branding.accentColor,
            font: data.branding.font,
            dark_logo: data.branding.darkLogo,
            light_logo: data.branding.lightLogo,
            domain: data.domain,
          },
        },
        domain: data.domain,
        subdomain: data.subdomain ?? null,
        branding: data.branding,
        bootstrapStatus: "resolved",
        bootstrapError: null,
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
        bootstrapStatus: "idle",
        bootstrapError: null,
      }),
  }),
);
