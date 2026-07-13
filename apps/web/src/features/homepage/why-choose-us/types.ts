export type WhyChooseUsIll =
  | "cap"
  | "video"
  | "target"
  | "chat"
  | "trend"
  | "wallet";

export interface WhyChooseUsFeature {
  title: string;
  desc: string;
  ill: WhyChooseUsIll;
}

export interface WhyChooseUsSettings {
  isActive: boolean;
  title: string;
  subtitle: string;
  features: WhyChooseUsFeature[];
}

export const ILL_OPTIONS: { value: WhyChooseUsIll; label: string }[] = [
  { value: "cap", label: "الشهادة / الخريج" },
  { value: "video", label: "تشغيل الفيديو" },
  { value: "target", label: "الهدف" },
  { value: "chat", label: "المحادثة" },
  { value: "trend", label: "النمو" },
  { value: "wallet", label: "الأسعار" },
];

export const DEFAULT_WHY_CHOOSE_US: WhyChooseUsSettings = {
  isActive: true,
  title: "لماذا تختارنا؟",
  subtitle: "من قلب المنظومة تشعّ كل ميزة — نظام متصل يحيط طالبك بكل ما يحتاجه للنجاح",
  features: [
    { title: "معلمون معتمدون وذوو خبرة", desc: "نخبة من المتخصصين لضمان أفضل تجربة تعليمية", ill: "cap" },
    { title: "شروحات فيديو عالية الجودة", desc: "فيديوهات احترافية بوضوح عالٍ وشرح مبسط", ill: "video" },
    { title: "تمارين وتدريب على حل المسائل", desc: "تطبيقات عملية لتثبيت المعلومة ورفع الكفاءة", ill: "target" },
    { title: "دعم ومتابعة مستمرة لأولياء الأمور", desc: "تواصل مباشر وتحديثات دورية عن تقدم الطالب", ill: "chat" },
    { title: "تحديث مستمر للمناهج والمحتوى", desc: "محتوى يواكب أحدث التغيرات والتطورات", ill: "trend" },
  ],
};
