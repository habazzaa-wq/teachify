export const PUBLIC_COURSE_QUERY_KEY = "public-course";

export const COURSE_FAQS_DEFAULT = [
  {
    question: "هل يمكنني الوصول إلى الدورة بشكل دائم؟",
    answer: "نعم، بمجرد الاشتراك في الدورة، ستحصل على وصول دائم لجميع المحتويات والتحديثات المستقبلية.",
  },
  {
    question: "هل أحصل على شهادة إتمام؟",
    answer: "نعم، بعد إتمام جميع دروس الدورة بنجاح، ستحصل على شهادة إتمام معتمدة يمكنك مشاركتها.",
  },
  {
    question: "هل يمكنني مشاهدة الدورة على الهاتف؟",
    answer: "بالتأكيد! المنصة متوافقة مع جميع الأجهزة بما في ذلك الهواتف واللوحات الرقمية والحاسوب.",
  },
  {
    question: "ماذا إذا لم تعجبني الدورة؟",
    answer: "نقدم ضمان استرداد الأموال خلال أول 30 يوماً من تاريخ الشراء إذا لم تكن راضياً.",
  },
];

export const LESSON_TYPE_ICONS: Record<string, string> = {
  video: "video",
  text: "file-text",
  pdf: "file-type",
  exam: "clipboard-check",
  audio: "headphones",
  live: "radio",
  external: "external-link",
};

export const DIFFICULTY_COLORS: Record<string, { light: string; dark: string }> = {
  beginner: { light: "text-emerald-600", dark: "dark:text-emerald-400" },
  intermediate: { light: "text-amber-600", dark: "dark:text-amber-400" },
  advanced: { light: "text-rose-600", dark: "dark:text-rose-400" },
  all_levels: { light: "text-primary", dark: "" },
};
