import type { Tenant } from "../types";
import { mockTenants as mockData } from "../mock";

const STORAGE_KEY = "app_tenants";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function load(): Tenant[] {
  if (!isBrowser()) return [...mockData];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored) as Tenant[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  const initial = [...mockData];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

function save(tenants: Tenant[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
  } catch {}
}

function clear(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export const tenantStorage = { load, save, clear };
