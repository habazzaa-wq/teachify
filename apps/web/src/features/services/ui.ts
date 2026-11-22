export const PRIMARY = "var(--brand-primary)";
export const SECONDARY = "var(--brand-secondary)";

export const tint = (color: string, amount: number) =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`;

export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  return `https://wa.me/${digits}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TM";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}
