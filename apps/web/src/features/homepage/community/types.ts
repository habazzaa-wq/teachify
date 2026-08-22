export type CommunityDesignId =
  | "classic"
  | "gradient"
  | "spotlight"
  | "bento"
  | "minimal";

export interface CommunityDesignMeta {
  id: CommunityDesignId;
  name: string;
  description: string;
}

export const COMMUNITY_ICON_OPTIONS: { value: CommunityIconId; label: string }[] = [
  { value: "zap", label: "الإجابة السريعة" },
  { value: "book", label: "الكتاب / الشرح" },
  { value: "chat", label: "المحادثة" },
  { value: "file", label: "الملفات" },
  { value: "users", label: "الأعضاء" },
  { value: "star", label: "النجوم / التميز" },
  { value: "trophy", label: "الكأس / التفوق" },
  { value: "video", label: "الفيديو" },
  { value: "clock", label: "الوقت" },
  { value: "shield", label: "الأمان" },
  { value: "heart", label: "الإعجاب" },
  { value: "help", label: "المساعدة" },
];

export const COMMUNITY_DESIGNS: CommunityDesignMeta[] = [
  {
    id: "classic",
    name: "الكلاسيكي الفاخر",
    description:
      "البطاقة الأنيقة المتوازنة مع الإحصائيات الحية وقائمة المميزات — الشكل الأصلي للمنصة.",
  },
  {
    id: "gradient",
    name: "التدرّج الملون",
    description:
      "خلفية متدرجة جسورة مع بطاقة إبراز مميزة — مثالي لجذب الانتباه فوراً.",
  },
  {
    id: "spotlight",
    name: "الأضواء المركزة",
    description:
      "صورة جانبية كبيرة مع اقتباس ملهم وتخطيط سينمائي يعرض المجتمع بشكل مبهر.",
  },
  {
    id: "bento",
    name: "شبكة بينتو",
    description:
      "بطاقات شبكية عصرية بأسلوب Bento Grid — كل ميزة في بطاقة مستقلة أنيقة.",
  },
  {
    id: "minimal",
    name: "المينيمال الهادئ",
    description:
      "تصميم نظيف ومريح للعين مع شريط متحرك — أناقة البساطة بلا ضوضاء.",
  },
];

export type CommunityIconId =
  | "zap"
  | "book"
  | "chat"
  | "file"
  | "users"
  | "star"
  | "trophy"
  | "video"
  | "clock"
  | "shield"
  | "heart"
  | "help";

export interface CommunityFeature {
  id: string;
  icon: CommunityIconId;
  title: string;
  desc: string;
}

export interface CommunityCtaConfig {
  label: string;
  visible: boolean;
}

export interface CommunityStatLabels {
  members: string;
  online: string;
  today: string;
  threads: string;
}

export interface CommunitySectionSettings {
  isActive: boolean;
  design: CommunityDesignId;
  badgeText: string;
  titleTop: string;
  titleBottom: string;
  description: string;
  primaryCta: CommunityCtaConfig;
  secondaryCta: CommunityCtaConfig;
  note: string;
  showStats: boolean;
  statLabels: CommunityStatLabels;
  showActivity: boolean;
  activityLabel: string;
  features: CommunityFeature[];
  gradient: {
    highlightTitle: string;
    highlightText: string;
    showGlow: boolean;
  };
  spotlight: {
    imageUrl: string;
    quote: string;
  };
  bento: {
    footerNote: string;
  };
  minimal: {
    tickerItems: string[];
    showTicker: boolean;
  };
}

let featureSeq = 0;
function nextFeatureId(): string {
  featureSeq += 1;
  return `feature-${Date.now().toString(36)}-${featureSeq}`;
}

export function createFeature(
  partial?: Partial<Omit<CommunityFeature, "id">>,
): CommunityFeature {
  return {
    id: nextFeatureId(),
    icon: partial?.icon ?? "chat",
    title: partial?.title ?? "",
    desc: partial?.desc ?? "",
  };
}

export const DEFAULT_COMMUNITY_SECTION: CommunitySectionSettings = {
  isActive: true,
  design: "classic",
  badgeText: "منتدى الطلاب",
  titleTop: "مكان يجتمع فيه الطلاب",
  titleBottom: "للمناقشة وتبادل المعرفة",
  description:
    "اطرح أسئلتك، شارك حلولك، وساعد زملاءك في قنوات منظمة — أسئلة، واجبات، موارد دراسية، ونصائح للمذاكرة. كل ذلك في مجتمع واحد يجمع طلاب أكاديميتك.",
  primaryCta: { label: "ادخل المنتدى الآن", visible: true },
  secondaryCta: { label: "تعرّف على القنوات", visible: false },
  note: "",
  showStats: true,
  statLabels: {
    members: "أعضاء المجتمع",
    online: "متصل الآن",
    today: "مناقشات اليوم",
    threads: "موضوعات ونقاشات",
  },
  showActivity: true,
  activityLabel: "آخر نشاط في المنتدى",
  features: [
    { id: "f1", icon: "zap", title: "إجابات سريعة", desc: "ردود فورية من الزملاء والمعلمين" },
    { id: "f2", icon: "book", title: "مساعدة دراسية", desc: "دعم في الواجبات والمراجعة" },
    { id: "f3", icon: "chat", title: "قنوات متخصصة", desc: "نقاشات منظمة لكل مادة" },
    { id: "f4", icon: "file", title: "ملفات وملخصات", desc: "مصادر دراسية بين يديك" },
  ],
  gradient: {
    highlightTitle: "مجتمع نشيط على مدار الساعة",
    highlightText:
      "انضم لآلاف الطلاب الذين يتبادلون المعرفة يومياً داخل قنوات المنتدى المتخصصة.",
    showGlow: true,
  },
  spotlight: {
    imageUrl: "",
    quote: "السؤال الجيد هو نصف الإجابة — اسأل، ناقش، وتعلّم مع مجتمعك.",
  },
  bento: {
    footerNote: "كل ما تحتاجه لمشاركتك الدراسية في مكان واحد",
  },
  minimal: {
    showTicker: true,
    tickerItems: [
      "أسئلة وأجوبة",
      "ملخصات ومصادر",
      "نقاشات المنهج",
      "نصائح مذاكرة",
      "دعم المستوردين",
      "تحديات أسبوعية",
    ],
  },
};

/** Deep-merge saved (partial) settings over defaults so new fields never break old data. */
export function mergeCommunitySettings(
  saved?: Partial<CommunitySectionSettings> | null,
): CommunitySectionSettings {
  const base = structuredClone(DEFAULT_COMMUNITY_SECTION);
  if (!saved) return base;

  return {
    ...base,
    ...saved,
    primaryCta: { ...base.primaryCta, ...(saved.primaryCta ?? {}) },
    secondaryCta: { ...base.secondaryCta, ...(saved.secondaryCta ?? {}) },
    statLabels: { ...base.statLabels, ...(saved.statLabels ?? {}) },
    features: Array.isArray(saved.features)
      ? saved.features.map((f) => ({ ...createFeature(), ...f }))
      : base.features,
    gradient: { ...base.gradient, ...(saved.gradient ?? {}) },
    spotlight: { ...base.spotlight, ...(saved.spotlight ?? {}) },
    bento: { ...base.bento, ...(saved.bento ?? {}) },
    minimal: { ...base.minimal, ...(saved.minimal ?? {}) },
  };
}
