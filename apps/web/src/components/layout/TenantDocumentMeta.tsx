"use client";

import { useEffect, useRef } from "react";
import { useTenantStore } from "@/stores/tenant.store";
import { env } from "@/config/env";

const FAVICON_LINK_ID = "tenant-favicon";

/**
 * Keeps the browser tab (title + icon) in sync with the active tenant's
 * branding. The tenant context is only known on the client after bootstrap,
 * so both are applied here via the DOM instead of static metadata.
 */
export function TenantDocumentMeta() {
  const activeTenant = useTenantStore((s) => s.activeTenant);
  const branding = useTenantStore((s) => s.branding);
  const prevTitleRef = useRef<string | null>(null);

  // Keep the browser tab title in sync with the active tenant's name.
  useEffect(() => {
    const tenantName = activeTenant?.name?.trim();
    if (!tenantName) return;
    if (document.title === tenantName) return;

    const current = document.title;

    // Dashboard-style title: exactly the static app name (or the previous
    // tenant name we set). Replace it wholesale with the new tenant name.
    if (
      !current ||
      current === env.appName ||
      (prevTitleRef.current !== null && current === prevTitleRef.current)
    ) {
      document.title = tenantName;
      prevTitleRef.current = tenantName;
      return;
    }

    // Page-specific titles that embed the app name (e.g. "صفحة | أكاديميتي"):
    // swap the app name for the tenant name.
    if (current.includes(env.appName)) {
      document.title = current.split(env.appName).join(tenantName);
      prevTitleRef.current = tenantName;
    }
  }, [activeTenant?.name]);

  // Keep the browser tab icon in sync with the active tenant's favicon.
  useEffect(() => {
    const favicon = branding?.favicon ?? null;
    let link = document.head.querySelector<HTMLLinkElement>(`#${FAVICON_LINK_ID}`);

    if (!favicon) {
      if (link) link.remove();
      return;
    }

    if (!link) {
      link = document.createElement("link");
      link.id = FAVICON_LINK_ID;
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.type = "image/x-icon";
    link.href = favicon;
  }, [branding?.favicon]);

  return null;
}
