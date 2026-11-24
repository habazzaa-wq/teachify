/** Shared DOM markers for the tenant font injected in the root layout. */
export const TENANT_FONT_STYLE_ID = "tenant-dynamic-font-css";
export const TENANT_FONT_LINK_ID = "tenant-dynamic-font";
export const TENANT_FONT_PRELOAD_ATTRIBUTE = "data-tenant-font-preload";

export function isSameFontFamily(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  if (!left || !right) return false;
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
