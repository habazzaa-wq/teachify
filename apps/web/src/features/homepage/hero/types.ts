export interface HeroSocialLinks {
  facebook: string;
  youtube: string;
  phone: string;
  whatsapp: string;
}

export interface HeroIconConfig {
  label: string;
  visible: boolean;
}

export interface HeroIcons {
  gifts: HeroIconConfig;
  facebook: HeroIconConfig;
  chat: HeroIconConfig;
  youtube: HeroIconConfig;
  bestStudents: HeroIconConfig;
  phone: HeroIconConfig;
}

export type HeroBgStyle = "math" | "arabic" | "english" | "geomatics";

export interface HeroBgStyleOption {
  value: HeroBgStyle;
  label: string;
  preview: string;
  fontFamily: string;
  direction: "ltr" | "rtl";
}

/** Shared by the editor and tests so a new tenant-specific style is selectable. */
export const HERO_BG_STYLE_OPTIONS: HeroBgStyleOption[] = [
  {
    value: "math",
    label: "رموز رياضية",
    preview: "π ∑ √ ∞ Δ θ",
    fontFamily: "'Georgia', serif",
    direction: "ltr",
  },
  {
    value: "arabic",
    label: "حروف عربية",
    preview: "أ ب ت ث ج ح",
    fontFamily: "'Noto Kufi Arabic', 'Noto Sans Arabic', sans-serif",
    direction: "rtl",
  },
  {
    value: "english",
    label: "حروف إنجليزية",
    preview: "A B C D E F",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    direction: "ltr",
  },
  {
    value: "geomatics",
    label: "خريطة GIS",
    preview: "N  +  ◎  △",
    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
    direction: "ltr",
  },
];

export interface HeroSettings {
  title: string;
  subtitle: string;
  teacherImage: string;
  teacherName: string;
  badge1Text: string;
  badge2Text: string;
  isActive: boolean;
  socialLinks: HeroSocialLinks;
  icons: HeroIcons;
  bgStyle: HeroBgStyle;
}

export const DEFAULT_HERO: HeroSettings = {
  title: "مرحباً بكم في منصة تعليمية",
  subtitle: "",
  teacherImage: "",
  teacherName: "",
  badge1Text: "معلم محترف",
  badge2Text: "خبرة 20+ سنة",
  isActive: true,
  socialLinks: {
    facebook: "",
    youtube: "",
    phone: "",
    whatsapp: "",
  },
  icons: {
    gifts: { label: "الهدايا", visible: true },
    facebook: { label: "فيس بوك", visible: true },
    chat: { label: "محادثة مباشرة", visible: true },
    youtube: { label: "يوتيوب", visible: true },
    bestStudents: { label: "أفضل الطلاب", visible: true },
    phone: { label: "رقم الهاتف", visible: true },
  },
  bgStyle: "math",
};

type HeroSettingsInput = {
  [K in keyof Omit<HeroSettings, "socialLinks" | "icons">]?: HeroSettings[K] | null;
} & {
  socialLinks?: Partial<Record<keyof HeroSocialLinks, string | null>> | null;
  icons?: Partial<
    Record<keyof HeroIcons, { label?: string | null; visible?: boolean | null } | null>
  > | null;
};

/**
 * The public hero API fills unset copy with tenant-aware defaults and may
 * still return `null` for older saved rows. Normalize once here so the editor
 * never feeds null into a controlled input or loses a nested default.
 */
export function normalizeHeroSettings(value?: HeroSettingsInput | null): HeroSettings {
  const social = value?.socialLinks ?? {};
  const icons = value?.icons ?? {};
  const icon = (key: keyof HeroIcons): HeroIconConfig => ({
    label: icons[key]?.label ?? DEFAULT_HERO.icons[key].label,
    visible: icons[key]?.visible ?? DEFAULT_HERO.icons[key].visible,
  });

  return {
    title: value?.title ?? DEFAULT_HERO.title,
    subtitle: value?.subtitle ?? DEFAULT_HERO.subtitle,
    teacherImage: value?.teacherImage ?? DEFAULT_HERO.teacherImage,
    teacherName: value?.teacherName ?? DEFAULT_HERO.teacherName,
    badge1Text: value?.badge1Text ?? DEFAULT_HERO.badge1Text,
    badge2Text: value?.badge2Text ?? DEFAULT_HERO.badge2Text,
    isActive: value?.isActive ?? DEFAULT_HERO.isActive,
    bgStyle: value?.bgStyle ?? DEFAULT_HERO.bgStyle,
    socialLinks: {
      facebook: social.facebook ?? DEFAULT_HERO.socialLinks.facebook,
      youtube: social.youtube ?? DEFAULT_HERO.socialLinks.youtube,
      phone: social.phone ?? DEFAULT_HERO.socialLinks.phone,
      whatsapp: social.whatsapp ?? DEFAULT_HERO.socialLinks.whatsapp,
    },
    icons: {
      gifts: icon("gifts"),
      facebook: icon("facebook"),
      chat: icon("chat"),
      youtube: icon("youtube"),
      bestStudents: icon("bestStudents"),
      phone: icon("phone"),
    },
  };
}
