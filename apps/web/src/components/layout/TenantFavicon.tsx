"use client";

import { useEffect } from "react";
import { useTenantStore } from "@/stores/tenant.store";

const FAVICON_LINK_ID = "tenant-favicon";

/**
 * Keeps the browser tab icon in sync with the active tenant's branding.
 * The tenant context (and its favicon) is only known on the client after
 * bootstrap, so the <link rel="icon"> is applied here via the DOM instead
 * of static metadata.
 */
export function TenantFavicon() {
  const branding = useTenantStore((s) => s.branding);

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
