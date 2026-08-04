"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addApiRequestContextReader } from "@/services/api/request-context";
import type {
  ActiveTenant,
  Membership,
  Permission,
  Role,
  Ability,
  NavigationItem,
} from "@/types/tenant.types";
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
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;

  setActiveTenant: (tenant: ActiveTenant | null) => void;
  setTenantContext: (context: {
    tenant: ActiveTenant;
    membership: Membership;
    roles: Role[];
    permissions: Permission[];
    abilities: Ability;
    navigation: NavigationItem[];
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
    bootstrapStatus: "idle",
    bootstrapError: null,

    setActiveTenant: (tenant) => set({ activeTenant: tenant }),

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

// Provide tenant request context lazily to the API layer at request time.
// Registered from the store itself so axios.ts never has to import Zustand
// (see services/api/request-context.ts).
addApiRequestContextReader(() => ({
  tenantId: useTenantStore.getState().activeTenant?.id?.toString() ?? null,
  tenantDomain: useTenantStore.getState().domain ?? null,
}));
