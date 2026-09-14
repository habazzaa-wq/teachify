export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  heading: string;
  links: FooterLink[];
}

export interface FooterContact {
  phone: string;
  email: string;
  hours: string;
  whatsapp: string;
}

export interface FooterSocials {
  facebook: string;
  youtube: string;
  instagram: string;
  whatsapp: string;
}

export interface FooterSettings {
  aboutText: string;
  tagline: string;
  contact: FooterContact;
  socials: FooterSocials;
  groups: FooterLinkGroup[];
}

export const DEVELOPER_WHATSAPP_NUMBER = "201011245565";

export const DEFAULT_FOOTER: FooterSettings = {
  aboutText:
    "منصة تعليمية عربية متكاملة تضم الطلاب والمعلمين وأولياء الأمور، وتقدّم محتوى دراسيًا منظّمًا لكل المراحل الدراسية.",
  tagline: "منظومة تعليمية متكاملة",
  contact: {
    phone: "+20 10 1124 5565",
    email: "hello@academy.example",
    hours: "السبت — الخميس، ٨ صباحًا حتى ٦ مساءً",
    whatsapp: DEVELOPER_WHATSAPP_NUMBER,
  },
  socials: {
    facebook: "",
    youtube: "",
    instagram: "",
    whatsapp: "https://wa.me/" + DEVELOPER_WHATSAPP_NUMBER,
  },
  groups: [
    {
      heading: "المراحل الدراسية",
      links: [
        { label: "المراحل الدراسية", href: "/stages" },
        { label: "الكورسات", href: "/courses" },
        { label: "لوحة الطالب", href: "/student/dashboard" },
        { label: "تفاعل الطلاب", href: "/community" },
      ],
    },
    {
      heading: "الدعم والمساعدة",
      links: [
        { label: "تواصل معنا", href: "" },
        { label: "الأسئلة الشائعة", href: "/community" },
      ],
    },
    {
      heading: "روابط عامة",
      links: [
        { label: "سياسة الخصوصية", href: "/privacy" },
        { label: "شروط الاستخدام", href: "/terms" },
      ],
    },
  ],
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asLink(value: unknown): FooterLink | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.label !== "string" || typeof raw.href !== "string") return null;
  return { label: raw.label, href: raw.href };
}

function asGroup(value: unknown): FooterLinkGroup | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.heading !== "string") return null;
  const links = Array.isArray(raw.links) ? raw.links.map(asLink).filter((l): l is FooterLink => l !== null) : [];
  return { heading: raw.heading, links };
}

/**
 * Merge a saved (partial) footer payload over rich defaults with per-field
 * sanitization. New fields added later can never break existing saved data.
 */
export function mergeFooterSettings(saved: unknown): FooterSettings {
  const base = DEFAULT_FOOTER;
  if (!saved || typeof saved !== "object") return base;

  const raw = saved as Record<string, unknown>;
  const contact: Partial<FooterContact> = raw.contact && typeof raw.contact === "object" ? raw.contact as Partial<FooterContact> : {};
  const socials: Partial<FooterSocials> = raw.socials && typeof raw.socials === "object" ? raw.socials as Partial<FooterSocials> : {};
  const groups = Array.isArray(raw.groups) ? raw.groups.map(asGroup).filter((g): g is FooterLinkGroup => g !== null) : [];

  return {
    aboutText: asString(raw.aboutText, base.aboutText),
    tagline: asString(raw.tagline, base.tagline),
    contact: {
      phone: asString(contact.phone, base.contact.phone),
      email: asString(contact.email, base.contact.email),
      hours: asString(contact.hours, base.contact.hours),
      whatsapp: asString(contact.whatsapp, base.contact.whatsapp),
    },
    socials: {
      facebook: asString(socials.facebook, base.socials.facebook),
      youtube: asString(socials.youtube, base.socials.youtube),
      instagram: asString(socials.instagram, base.socials.instagram),
      whatsapp: asString(socials.whatsapp, base.socials.whatsapp),
    },
    groups: groups.length > 0 ? groups : base.groups,
  };
}

/** Convert a phone/whatsapp number to a wa.me link (digits only). */
export function toWhatsAppUrl(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}