const getBaseDomain = (): string =>
  process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? "academy.test";

const stripPort = (host: string): string => {
  const parts = host.split(":");
  return parts[0] ?? "";
};

/** Normalize a request host so `www.tenant.example` is the tenant `tenant.example`. */
export function normalizeTenantHost(hostname?: string): string {
  const host = stripPort(hostname ?? getHostname()).toLowerCase();
  return host.startsWith("www.") ? host.slice(4) : host;
}

export function getHostname(): string {
  if (typeof window !== "undefined") {
    return stripPort(window.location.hostname);
  }
  
  // For SSR, we might want to use headers() but it's only available in certain contexts.
  // It's better to pass the hostname explicitly to functions that need it during SSR.
  return "";
}

export function getTenantDomainFromHeaders(headers: Headers): string {
  return normalizeTenantHost(
    headers.get("host") ?? headers.get("x-hostname") ?? "",
  );
}

export function getPlatformDomain(): string {
  return getBaseDomain();
}

export function getTenantSubdomain(hostname?: string): string | null {
  const host = normalizeTenantHost(hostname);
  const base = getBaseDomain();

  if (!host || host === base || host === "localhost") return null;

  if (host.endsWith(`.${base}`)) {
    const sub = host.slice(0, -`.${base}`.length);
    return sub || null;
  }

  return null;
}

export function isPlatformDomain(hostname?: string): boolean {
  const host = normalizeTenantHost(hostname);
  const base = getBaseDomain();

  if (!host) return true;

  return (
    host === base || 
    host === `www.${base}` || 
    host === "localhost" || 
    host === "127.0.0.1"
  );
}

export function isTenantDomain(hostname?: string): boolean {
  const host = normalizeTenantHost(hostname);
  const base = getBaseDomain();

  if (!host || host === "localhost") return false;

  return host.endsWith(`.${base}`) && host !== base;
}

export function getDomainFromHost(hostname?: string): string {
  return normalizeTenantHost(hostname);
}
