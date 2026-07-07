export const tenantKeys = {
  all: ["tenant"] as const,
  context: () => [...tenantKeys.all, "context"] as const,
  active: () => [...tenantKeys.all, "active"] as const,
  byDomain: (domain: string) => [...tenantKeys.all, "by-domain", domain] as const,
};
