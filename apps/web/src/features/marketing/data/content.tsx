import {
  BookOpen,
  BarChart3,
  Award,
  Users,
  GraduationCap,
  Wallet,
  MessagesSquare,
  ClipboardCheck,
  Search,
  Palette,
  Rocket,
  FileCheck2,
  BellRing,
  Timer,
  LineChart,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Smartphone,
  Braces,
  FolderTree,
  BadgeCheck,
  GitBranch,
  type LucideIcon,
} from "lucide-react";

export const SITE_NAME = "Teachify";
export const SITE_NAME_AR = "تيتشيفاي";
export const SITE_TAGLINE = "منصتك التعليمية المتكاملة — بهويتك وبكل قوة";

export const DEVELOPER_WHATSAPP = "https://wa.me/201011245565";

export const NAV_LINKS: {
  label: string;
  href: string;
  hash: string;
}[] = [
  { label: "النظام المتكامل", href: "/", hash: "#ecosystem" },
  { label: "المنصة", href: "/", hash: "#showcase" },
  { label: "للمعلمين", href: "/", hash: "#for-teachers" },
  { label: "للطلاب", href: "/", hash: "#students" },
  { label: "الامتحانات", href: "/", hash: "#exams" },
  { label: "المجتمع", href: "/", hash: "#community" },
];

export interface EcosystemNode {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: "coral" | "gold" | "blue" | "green" | "violet";
}

export const ECOSYSTEM_NODES: EcosystemNode[] = [
  { id: "teachers", label: "المدرّسون", icon: Users, tone: "blue" },
  { id: "courses", label: "الكورسات", icon: BookOpen, tone: "coral" },
  { id: "students", label: "الطلاب", icon: GraduationCap, tone: "green" },
  { id: "exams", label: "الامتحانات", icon: ClipboardCheck, tone: "gold" },
  { id: "certificates", label: "الشهادات", icon: Award, tone: "violet" },
  { id: "payments", label: "المدفوعات", icon: Wallet, tone: "blue" },
  { id: "analytics", label: "التحليلات", icon: BarChart3, tone: "coral" },
  { id: "community", label: "المجتمع", icon: MessagesSquare, tone: "green" },
];

export const WHY_ITEMS: {
  num: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "coral" | "gold" | "blue" | "green" | "violet" | "red";
}[] = [
  {
    num: "01",
    title: "منصة كاملة، لا أدوات متناثرة",
    description:
      "الكورسات، الامتحانات، الطلاب، المدفوعات، الشهادات والمجتمع — كل شيء في نظام واحد متماسك يدير أكاديميتك من أول تسجيل حتى إصدار الشهادة.",
    icon: LayoutDashboard,
    tone: "coral",
  },
  {
    num: "02",
    title: "علامتك التجارية أولًا",
    description:
      "نطاق خاص، شعارك، ألوانك وخطوطك. منصتك تظهر بهويتك أنت — ليست موقعًا جاهزًا يحمل اسم طرف ثالث.",
    icon: Palette,
    tone: "gold",
  },
  {
    num: "03",
    title: "بنية تنمو معك",
    description:
      "مصممة لتتحمل الانتقال من بضعة طلاب إلى آلافهم دون إعادة بناء، مع بنية تحتية آمنة وقابلة للتوسع.",
    icon: TrendingUp,
    tone: "green",
  },
  {
    num: "04",
    title: "إدارة قوية لفريقك",
    description:
      "أدوار، صلاحيات، ومهام دقيقة لكل من يعمل معك — مدرّسون، مساعدون، ومشرفون بمستوى وصول محسوب.",
    icon: ShieldCheck,
    tone: "blue",
  },
  {
    num: "05",
    title: "تجربة طالب بمستوى عالمي",
    description:
      "تجربة استخدام سلسة على كل الأجهزة: تصفح، تعلم، امتحان، تقدم، ومكافآت — تجربة تُبقي الطالب يعود.",
    icon: Smartphone,
    tone: "violet",
  },
  {
    num: "06",
    title: "منصة تتطور باستمرار",
    description:
      "تحديثات منتظمة مبنية على استخدام حقيقي، تصل إلى منصتك تلقائيًا دون أن تدفع مقابل أدوات منفصلة.",
    icon: Sparkles,
    tone: "red",
  },
];

export const SHOWCASE_TABS: {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    id: "teacher",
    label: "لوحة المدرّس",
    icon: LayoutDashboard,
    description: "إدارة كاملة لأكاديميتك من مكان واحد: محتوى، طلاب، مدفوعات، وتقارير.",
  },
  {
    id: "student",
    label: "لوحة الطالب",
    icon: GraduationCap,
    description: "مسار تعلم شخصي: كورسات، تقدم، امتحانات، ومحفظة في تجربة واحدة.",
  },
  {
    id: "course",
    label: "صفحة الكورس",
    icon: BookOpen,
    description: "صفحة كورس احترافية تعرض المحتوى بوضوح وتحوّل الزائر إلى طالب.",
  },
  {
    id: "exam",
    label: "واجهة الامتحان",
    icon: ClipboardCheck,
    description: "امتحانات حقيقية بمؤقت، تنقل بين الأسئلة، وتصحيح فوري.",
  },
  {
    id: "analytics",
    label: "التحليلات",
    icon: LineChart,
    description: "مؤشرات حية عن الطلاب، الإتمام، والأداء تساعدك على اتخاذ قرارات مدروسة.",
  },
  {
    id: "community",
    label: "المجتمع",
    icon: MessagesSquare,
    description: "مساحة تفاعلية حية لطلابك: قنوات، نقاشات، تفاعلات، ومكافآت.",
  },
];

export const TEACHER_CAPABILITIES: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "coral" | "gold" | "blue" | "green" | "violet" | "red";
}[] = [
  {
    icon: BookOpen,
    title: "أطلق الكورسات والمحتوى",
    description: "ابنِ كورساتك بالدروس والمرفقات، وانشرها في دقائق.",
    tone: "coral",
  },
  {
    icon: Users,
    title: "إدارة الطلاب والفرق",
    description: "سجّل الطلاب، صنّفهم، وفوّض مهام لمدرّسيك.",
    tone: "blue",
  },
  {
    icon: ClipboardCheck,
    title: "امتحانات بتصحيح آلي",
    description: "أعد بنوك أسئلة، أطلق الامتحانات، واعرض النتائج فورًا.",
    tone: "gold",
  },
  {
    icon: BarChart3,
    title: "متابعة الأداء والتقارير",
    description: "اعرف من يتقدم ومن يحتاج دعمًا قبل أن يسأل.",
    tone: "green",
  },
  {
    icon: Wallet,
    title: "المدفوعات والمحافظ",
    description: "اقبل الشحن بالكود أو الدفع الإلكتروني وأدر إيراداتك.",
    tone: "violet",
  },
  {
    icon: Award,
    title: "شهادات بعلامتك",
    description: "أصدر شهادات إتمام مخصصة بهوية أكاديميتك.",
    tone: "red",
  },
];

export const STUDENT_EXPERIENCE: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "coral" | "gold" | "blue" | "green" | "violet" | "red";
}[] = [
  {
    icon: Search,
    title: "اكتشاف الكورسات",
    description: "تصفح حسب المرحلة أو المادة واختر ما يناسبك.",
    tone: "coral",
  },
  {
    icon: Smartphone,
    title: "تعلّم من أي جهاز",
    description: "دروس، ملاحظات، وامتحانات بتجربة متجاوبة بالكامل.",
    tone: "blue",
  },
  {
    icon: ClipboardCheck,
    title: "امتحانات وتتبع تقدم",
    description: "نتائج فورية ومؤشرات تقدم واضحة لكل كورس.",
    tone: "gold",
  },
  {
    icon: BellRing,
    title: "إشعارات ذكية",
    description: "تنبيهات بالدروس الجديدة والامتحانات والنتائج لحظيًا.",
    tone: "green",
  },
  {
    icon: MessagesSquare,
    title: "مجتمع ومكافآت",
    description: "نقاشات، تفاعلات، ولوحات ترتيب تحفّز الاستمرار.",
    tone: "violet",
  },
  {
    icon: Wallet,
    title: "محفظة رقمية",
    description: "اشحن رصيدك بسهولة وادفع مقابل الكورسات أينما كنت.",
    tone: "red",
  },
];

export const EXAM_FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: ClipboardCheck,
    title: "أسئلة متعددة الأنماط",
    description: "اختيار من متعدد مع بنوك أسئلة قابلة لإعادة الاستخدام.",
  },
  {
    icon: Timer,
    title: "مؤقت ووضع امتحان حقيقي",
    description: "توقيت دقيق ولوحة أسئلة تحاكي الامتحان الفعلي.",
  },
  {
    icon: BadgeCheck,
    title: "تصحيح آلي فوري",
    description: "تظهر النتائج بمجرد التسليم — دون انتظار مراجعة.",
  },
  {
    icon: LineChart,
    title: "تحليل أداء لكل طالب",
    description: "نقاط القوة والضعف لكل طالب وكل سؤال.",
  },
  {
    icon: Users,
    title: "مراجعة المدرّس",
    description: "راجع النتائج، تدخل يدويًا، وأعد النشر عند الحاجة.",
  },
  {
    icon: FileCheck2,
    title: "تقارير شاملة",
    description: "إحصائيات الامتحان كاملة: مشاركة، متوسط، وتوزيع الدرجات.",
  },
];

export const SEO_CAPABILITIES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Search,
    title: "صفحات عامة قابلة للفهرسة",
    description: "الصفحة الرئيسية، الكورسات، والمراحل التعليمية ظاهرة لمحركات البحث.",
  },
  {
    icon: Braces,
    title: "Metadata وبيانات منظمة",
    description: "عناوين وأوصاف وSchema منظمة لكورساتك تلقائيًا.",
  },
  {
    icon: GitBranch,
    title: "Canonical وSitemap",
    description: "روابط Canonical سليمة وخرائط مواقع تُحدَّث تلقائيًا مع كل نشر.",
  },
  {
    icon: FolderTree,
    title: "robots.txt ومحتوى خاضع للرقابة",
    description: "تحكم كامل بما تسمح لمحركات البحث بفهرسته.",
  },
  {
    icon: Globe,
    title: "SEO بحسب المنصة",
    description: "كل منصة تحمل بياناتها الخاصة، دون تداخل بين أكاديمية وأخرى.",
  },
  {
    icon: Sparkles,
    title: "أدوات تحرير SEO مدمجة",
    description: "حرر العناوين والأوصاف من لوحة تحكم منصتك مباشرة.",
  },
];

export const STEPS: {
  num: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "coral" | "gold" | "blue" | "green" | "violet";
}[] = [
  {
    num: "01",
    title: "اختر منصتك",
    description: "نحدد معًا طبيعة تعليمك — مدرّس، أكاديمية، أو منصة تدريب — ونجهز بيئة تجريبية كاملة.",
    icon: LayoutDashboard,
    tone: "coral",
  },
  {
    num: "02",
    title: "خصّص علامتك",
    description: "نطاقك الخاص، شعارك، ألوانك وخطوطك — كل شيء بهويتك قبل أي إطلاق.",
    icon: Palette,
    tone: "gold",
  },
  {
    num: "03",
    title: "أضف محتواك",
    description: "ارفع الكورسات والدروس وجهّز بنوك الأسئلة والامتحانات من لوحة تحكم سهلة.",
    icon: BookOpen,
    tone: "blue",
  },
  {
    num: "04",
    title: "أطلق منصتك",
    description: "فعّل التسجيل والمدفوعات وأعلن عن انطلاق منصتك لطلابك.",
    icon: Rocket,
    tone: "green",
  },
  {
    num: "05",
    title: "نمِّ طلابك",
    description: "حلل الأداء، حسّن ظهورك في البحث، وفعّل مجتمعك لتحويل الطلاب إلى مجتمع نابض.",
    icon: TrendingUp,
    tone: "violet",
  },
];

export const MATRIX_GROUPS: {
  icon: LucideIcon;
  title: string;
  tone: "coral" | "gold" | "blue" | "green" | "violet" | "red";
  features: string[];
}[] = [
  {
    icon: BookOpen,
    title: "التعلّم",
    tone: "coral",
    features: ["كورسات", "دروس", "محتوى غني", "مراحل تعليمية", "فصول"],
  },
  {
    icon: ClipboardCheck,
    title: "التقييم",
    tone: "gold",
    features: ["امتحانات", "بنوك أسئلة", "تصحيح آلي", "نتائج وتحليل", "مراجعة"],
  },
  {
    icon: Users,
    title: "الطلاب",
    tone: "blue",
    features: ["ملفات طلاب", "سجل التقدم", "شهادات", "مجموعات", "إشعارات"],
  },
  {
    icon: MessagesSquare,
    title: "التواصل",
    tone: "green",
    features: ["دردشة مباشرة", "مجتمع وقنوات", "نقاشات", "تفاعلات", "تنبيهات"],
  },
  {
    icon: Wallet,
    title: "الأعمال",
    tone: "violet",
    features: ["مدفوعات", "محفظة رقمية", "شحن بالكود", "دفع إلكتروني", "تقارير إيرادات"],
  },
  {
    icon: Search,
    title: "النمو",
    tone: "red",
    features: ["SEO مدمج", "علامة تجارية", "كتالوج عام", "صفحات قابلة للفهرسة"],
  },
  {
    icon: ShieldCheck,
    title: "الإدارة",
    tone: "coral",
    features: ["مدرّسون ومساعدون", "أدوار وصلاحيات", "سجل أنشطة", "إدارة المنصة"],
  },
];

export interface DemoPlatform {
  id: string;
  name: string;
  category: string;
  description: string;
  accent: string;
  accentSoft: string;
  icon: LucideIcon;
  courses: { title: string; meta: string }[];
}

export const DEMO_PLATFORMS: DemoPlatform[] = [
  {
    id: "math",
    name: "أكاديمية الرياضيات",
    category: "مدرّس رياضيات",
    description: "كورسات ومراجعات وامتحانات دورية لطلاب الثانوية.",
    accent: "#d87b63",
    accentSoft: "#f9e7e0",
    icon: BarChart3,
    courses: [
      { title: "التفاضل والتكامل", meta: "32 درسًا · 1,240 طالبًا" },
      { title: "الجبر والهندسة", meta: "24 درسًا · 890 طالبًا" },
    ],
  },
  {
    id: "english",
    name: "English Hub",
    category: "أكاديمية لغة إنجليزية",
    description: "منصة تعليم إنجليزي تفاعلية بمستويات وقاعات محادثة.",
    accent: "#4f7cac",
    accentSoft: "#e8eff6",
    icon: BookOpen,
    courses: [
      { title: "English Foundations", meta: "40 درسًا · 2,300 طالبًا" },
      { title: "Speaking Club", meta: "جلسات مباشرة · 640 طالبًا" },
    ],
  },
  {
    id: "school",
    name: "مدرستي أونلاين",
    category: "منصة تعليم مدرسي",
    description: "تعليم إلكتروني متكامل للمدارس: مناهج، امتحانات، وأولياء أمور.",
    accent: "#5d9277",
    accentSoft: "#e7f1eb",
    icon: GraduationCap,
    courses: [
      { title: "العلوم — المرحلة الإعدادية", meta: "45 درسًا · 1,800 طالبًا" },
      { title: "اللغة العربية", meta: "30 درسًا · 1,120 طالبًا" },
    ],
  },
  {
    id: "skills",
    name: "أكاديمية مهارات",
    category: "أكاديمية تدريب مهني",
    description: "تدريب احترافي في المهارات الرقمية مع شهادات معتمدة.",
    accent: "#8b6cb4",
    accentSoft: "#f0ebf7",
    icon: Award,
    courses: [
      { title: "أساسيات التسويق الرقمي", meta: "18 درسًا · 980 طالبًا" },
      { title: "إدارة المشاريع", meta: "22 درسًا · 540 طالبًا" },
    ],
  },
];

export const FOOTER_COLUMNS: {
  title: string;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "المنتج",
    links: [
      { label: "النظام المتكامل", href: "/#ecosystem" },
      { label: "جولة في المنصة", href: "/#showcase" },
      { label: "الامتحانات", href: "/#exams" },
      { label: "التحليلات", href: "/#analytics" },
      { label: "مجتمع الطلاب", href: "/#community" },
    ],
  },
  {
    title: "لمن؟",
    links: [
      { label: "للمعلمين", href: "/#for-teachers" },
      { label: "للطلاب", href: "/#students" },
      { label: "الأكاديميات", href: "/#for-teachers" },
      { label: "مدارس وتدريب", href: "/#demos" },
    ],
  },
  {
    title: "ابدأ",
    links: [
      { label: "كيف تبدأ؟", href: "/#how-it-works" },
      { label: "أمثلة منصات", href: "/#demos" },
      { label: "العلامة التجارية", href: "/#branding" },
      { label: "احجز منصتك", href: "/#cta" },
    ],
  },
  {
    title: "المنصة",
    links: [
      { label: "تسجيل دخول الطالب", href: "/tenant-login" },
      { label: "دخول المدرّس", href: "/teacher/dashboard" },
      { label: "بحث عن كورس", href: "/courses" },
      { label: "الدعم عبر واتساب", href: DEVELOPER_WHATSAPP },
    ],
  },
];

export const CONTACT_EMAIL = "mahmoudhabazza@gmail.com";

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "هل أحتاج إلى خبرة تقنية لإطلاق منصتي؟",
    a: "لا. تيتشيفاي تمنحك بنية تحتية جاهزة؛ تركّز على محتواك وعلامتك، ونحن نتكفل بالتقنية والتشغيل والأمان.",
  },
  {
    q: "هل تحمل المنصّة علامتي التجارية؟",
    a: "نعم، بالكامل: نطاق خاص، شعار، ألوان، وخطوط — يظهر طلابك منصتك الخاصة لا غير.",
  },
  {
    q: "كيف أستلم مدفوعات الطلاب؟",
    a: "من خلال محفظة رقمية داخل المنصّة مع شحن بالكود أو دفع إلكتروني، وتقارير إيرادات واضحة.",
  },
  {
    q: "هل يمكنني تجربة المنصّة قبل الاشتراك؟",
    a: "نعم، نجهّز لك بيئة تجريبية كاملة لتجربتها وخصيصتها قبل أي إطلاق رسمي.",
  },
];
