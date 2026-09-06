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
};
