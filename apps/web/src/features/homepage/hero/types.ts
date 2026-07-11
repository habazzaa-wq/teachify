export interface HeroSocialLinks {
  facebook: string;
  youtube: string;
  phone: string;
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
  },
};
