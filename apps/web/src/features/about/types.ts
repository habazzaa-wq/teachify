export type AboutIconName =
  | "book"
  | "hammer"
  | "trending"
  | "compass"
  | "target"
  | "sparkles"
  | "heart"
  | "award"
  | "chart"
  | "users"
  | "lightbulb"
  | "shield";

export interface AboutHero {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export interface AboutStat {
  id: string;
  value: string;
  label: string;
}

export interface AboutStoryPoint {
  id: string;
  title: string;
  description: string;
  icon: AboutIconName;
}

export interface AboutStory {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  points: AboutStoryPoint[];
}

export interface AboutStep {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: AboutIconName;
}

export interface AboutJourney {
  eyebrow: string;
  title: string;
  description: string;
  steps: AboutStep[];
}

export interface AboutValue {
  id: string;
  title: string;
  description: string;
  icon: AboutIconName;
}

export interface AboutValues {
  eyebrow: string;
  title: string;
  description: string;
  items: AboutValue[];
}

export interface AboutQuote {
  text: string;
  author: string;
  role: string;
}

export interface AboutLocation {
  eyebrow: string;
  title: string;
  description: string;
  address: string;
  query: string;
  lat: string;
  lng: string;
  zoom: string;
  directionsUrl: string;
  phone: string;
  email: string;
  hours: string;
  whatsapp: string;
}

export interface AboutCta {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

export interface AboutSettings {
  hero: AboutHero;
  stats: AboutStat[];
  story: AboutStory;
  journey: AboutJourney;
  values: AboutValues;
  quote: AboutQuote;
  location: AboutLocation;
  cta: AboutCta;
}

export const ABOUT_ICON_OPTIONS: { value: AboutIconName; label: string }[] = [
  { value: "book", label: "كتاب" },
  { value: "hammer", label: "أداة / تطبيق" },
  { value: "trending", label: "نمو" },
  { value: "compass", label: "بوصلة" },
  { value: "target", label: "هدف" },
  { value: "sparkles", label: "إبداع" },
  { value: "heart", label: "شغف" },
  { value: "award", label: "تميز" },
  { value: "chart", label: "قياس" },
  { value: "users", label: "مجتمع" },
  { value: "lightbulb", label: "فكرة" },
  { value: "shield", label: "ثقة" },
];

export const DEFAULT_ABOUT: AboutSettings = {
  hero: {
    eyebrow: "حكايتنا",
    title: "كل إنجاز كبير يبدأ برحلة تعلّم",
    description:
      "نصنع تجربة تعليمية تضع المتعلم في قلبها؛ معرفة واضحة، خطوات عملية، ومساندة تساعدك على تحويل طموحك إلى تقدّم تراه في كل يوم.",
    image: "",
    primaryLabel: "اكتشف برامجنا",
    primaryHref: "/courses",
    secondaryLabel: "تعرف على قصتنا",
    secondaryHref: "#about-story",
  },
  stats: [
    { id: "steps", value: "٣", label: "مراحل في رحلة المتعلّم" },
    { id: "values", value: "٦", label: "قيم تصنع تجربتنا" },
    { id: "practice", value: "١٠٠٪", label: "تطبيق عملي" },
    { id: "story", value: "٠١", label: "قصة واحدة، كل يوم" },
  ],
  story: {
    eyebrow: "قصتنا · تعليم يفتح لك الطريق، لا يكتفي بعرضه",
    title: "تعليم يفتح لك الطريق، لا يكتفي بعرضه",
    paragraphs: [
      "نؤمن أن التعليم المؤثر لا يبدأ من كثرة المعلومات، بل من فهم ما يحتاجه المتعلّم فعلًا. لذلك نبني تجربة تجمع بين المحتوى المنظّم، الشرح الواضح، والتطبيق الذي يحوّل المعرفة إلى مهارة قابلة للاستخدام.",
      "ومن أول خطوة وحتى بلوغ الهدف، نحرص أن تكون رحلتك مفهومة ومرنة: تعرف ماذا ستتعلّم، ولماذا تتعلّمه، وكيف تستخدمه في عملك أو دراستك.",
    ],
    points: [
      { id: "understand", title: "افهم", description: "محتوى واضح ومنظّم يضع الأساس الصحيح", icon: "book" },
      { id: "apply", title: "طبّق", description: "معرفة تتحوّل إلى مهارة بخطوات عملية", icon: "hammer" },
      { id: "progress", title: "تقدّم", description: "رحلة مرنة تواكب طموحك واحتياجاتك", icon: "trending" },
    ],
  },
  journey: {
    eyebrow: "كيف نعمل",
    title: "أربع محطات من أول سؤال إلى أول إنجاز",
    description: "لا نتركك خطوة بلا معنى؛ كل مرحلة لها هدف واضح ونتيجة تستطيع رؤيتها.",
    steps: [
      {
        id: "listen",
        number: "٠١",
        title: "نسمعك أولًا",
        description: "نبدأ بفهم هدفك ومستواك ووقت المتاح قبل أن نقترح أي مسار.",
        icon: "compass",
      },
      {
        id: "map",
        number: "٠٢",
        title: "نبني الخريطة",
        description: "نحوّل الهدف إلى خطوات صغيرة مرتبة تعرف من خلالها ما التالي دائمًا.",
        icon: "target",
      },
      {
        id: "practice",
        number: "٠٣",
        title: "نتعلم بالتطبيق",
        description: "أمثلة وتمارين قصيرة تجعل المعلومة قابلة للاستخدام من اليوم الأول.",
        icon: "hammer",
      },
      {
        id: "grow",
        number: "٠٤",
        title: "نكمل معك",
        description: "مراجعة وتغذية راجعة مستمرة حتى يصبح التقدّم عادة لا محطة عابرة.",
        icon: "trending",
      },
    ],
  },
  values: {
    eyebrow: "ما الذي يميّزنا",
    title: "قيم صغيرة، أثر كبير",
    description: "ست مبادئ نعود إليها في كل درس وكل قرار تصميمي.",
    items: [
      {
        id: "clarity",
        title: "وضوح الغاية",
        description: "كل درس يبدأ بهدف تعرفه قبل أن تبدأ، وتعرف بعده ما الذي تحقّق.",
        icon: "target",
      },
      {
        id: "application",
        title: "تطبيق قبل الحفظ",
        description: "تمارين ومشاريع قصيرة تحوّل المعلومة إلى مهارة يمكنك استخدامها فورًا.",
        icon: "hammer",
      },
      {
        id: "flexibility",
        title: "تجربة تخصّك",
        description: "مسار مرن يتناسب مع وقتك ومستواك، لا قالب واحد للجميع.",
        icon: "compass",
      },
      {
        id: "support",
        title: "دعم عند الحاجة",
        description: "إجابات واضحة ومساعدة سريعة عندما تقف أمام خطوة تحتاج فيها إلى دفعة.",
        icon: "heart",
      },
      {
        id: "quality",
        title: "جودة المحتوى",
        description: "مادّة منظّمة ومراجَعة بعناية، بلغة قريبة وأمثلة من واقع العمل.",
        icon: "award",
      },
      {
        id: "measurement",
        title: "أثر يمكن قياسه",
        description: "مؤشرات بسيطة تُريك أين أنت اليوم وأين أصبحت بالأمس.",
        icon: "chart",
      },
    ],
  },
  quote: {
    text: "التعلّم الحقيقي هو أن تكتسب ما يمكّنك من صنع خطوتك التالية بثقة.",
    author: "فريق the mechanist",
    role: "صانعو التجربة التعليمية",
  },
  location: {
    eyebrow: "أين نحن",
    title: "تعالَ نبني خطوتك التالية معًا",
    description: "اقترب منا، أو تواصل معنا من أي مكان. نحن هنا عندما تبدأ.",
    address: "القاهرة، جمهورية مصر العربية",
    query: "Cairo, Egypt",
    lat: "30.0444",
    lng: "31.2357",
    zoom: "13",
    directionsUrl: "",
    phone: "+20 10 1124 5565",
    email: "hello@academy.example",
    hours: "السبت — الخميس، ٨ صباحًا حتى ٦ مساءً",
    whatsapp: "201011245565",
  },
  cta: {
    eyebrow: "ابدأ الآن",
    title: "اختر ما تريد أن تتقنه، وابدأ من هنا",
    description: "خطوة صغيرة اليوم تصنع فرقًا واضحًا في الغد.",
    buttonLabel: "تصفح الكورسات",
    buttonHref: "/courses",
  },
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const result = value.filter((item): item is string => typeof item === "string");
  return result.length > 0 ? result : [...fallback];
}

function asIcon(value: unknown, fallback: AboutIconName): AboutIconName {
  return ABOUT_ICON_OPTIONS.some((option) => option.value === value)
    ? (value as AboutIconName)
    : fallback;
}

function asItems<T extends { id: string }>(
  value: unknown,
  fallback: T[],
  parse: (raw: Record<string, unknown>, fallbackItem: T, index: number) => T,
): T[] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }));
  const result = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((raw, index) => parse(raw, fallback[index] ?? fallback[fallback.length - 1]!, index));
  return result.length > 0 ? result : fallback.map((item) => ({ ...item }));
}

/**
 * Merge a saved (partial) about payload over rich defaults with per-field
 * sanitization. New fields added later can never break existing saved data.
 */
export function mergeAboutSettings(saved: unknown): AboutSettings {
  const base = DEFAULT_ABOUT;
  if (!saved || typeof saved !== "object") return base;

  const raw = asObject(saved);
  const hero = asObject(raw.hero);
  const story = asObject(raw.story);
  const journey = asObject(raw.journey);
  const values = asObject(raw.values);
  const quote = asObject(raw.quote);
  const location = asObject(raw.location);
  const cta = asObject(raw.cta);

  return {
    hero: {
      eyebrow: asString(hero.eyebrow, base.hero.eyebrow),
      title: asString(hero.title, base.hero.title),
      description: asString(hero.description, base.hero.description),
      image: asString(hero.image, base.hero.image),
      primaryLabel: asString(hero.primaryLabel, base.hero.primaryLabel),
      primaryHref: asString(hero.primaryHref, base.hero.primaryHref),
      secondaryLabel: asString(hero.secondaryLabel, base.hero.secondaryLabel),
      secondaryHref: asString(hero.secondaryHref, base.hero.secondaryHref),
    },
    stats: asItems(
      raw.stats,
      base.stats,
      (item, fallback, index) => ({
        id: asString(item.id, fallback.id || String(index)),
        value: asString(item.value, fallback.value),
        label: asString(item.label, fallback.label),
      }),
    ),
    story: {
      eyebrow: asString(story.eyebrow, base.story.eyebrow),
      title: asString(story.title, base.story.title),
      paragraphs: asStringArray(story.paragraphs, base.story.paragraphs),
      points: asItems(
        story.points,
        base.story.points,
        (item, fallback, index) => ({
          id: asString(item.id, fallback.id || String(index)),
          title: asString(item.title, fallback.title),
          description: asString(item.description, fallback.description),
          icon: asIcon(item.icon, fallback.icon),
        }),
      ),
    },
    journey: {
      eyebrow: asString(journey.eyebrow, base.journey.eyebrow),
      title: asString(journey.title, base.journey.title),
      description: asString(journey.description, base.journey.description),
      steps: asItems(
        journey.steps,
        base.journey.steps,
        (item, fallback, index) => ({
          id: asString(item.id, fallback.id || String(index)),
          number: asString(item.number, fallback.number || String(index + 1).padStart(2, "0")),
          title: asString(item.title, fallback.title),
          description: asString(item.description, fallback.description),
          icon: asIcon(item.icon, fallback.icon),
        }),
      ),
    },
    values: {
      eyebrow: asString(values.eyebrow, base.values.eyebrow),
      title: asString(values.title, base.values.title),
      description: asString(values.description, base.values.description),
      items: asItems(
        values.items,
        base.values.items,
        (item, fallback, index) => ({
          id: asString(item.id, fallback.id || String(index)),
          title: asString(item.title, fallback.title),
          description: asString(item.description, fallback.description),
          icon: asIcon(item.icon, fallback.icon),
        }),
      ),
    },
    quote: {
      text: asString(quote.text, base.quote.text),
      author: asString(quote.author, base.quote.author),
      role: asString(quote.role, base.quote.role),
    },
    location: {
      eyebrow: asString(location.eyebrow, base.location.eyebrow),
      title: asString(location.title, base.location.title),
      description: asString(location.description, base.location.description),
      address: asString(location.address, base.location.address),
      query: asString(location.query, base.location.query),
      lat: asString(location.lat, base.location.lat),
      lng: asString(location.lng, base.location.lng),
      zoom: asString(location.zoom, base.location.zoom),
      directionsUrl: asString(location.directionsUrl, base.location.directionsUrl),
      phone: asString(location.phone, base.location.phone),
      email: asString(location.email, base.location.email),
      hours: asString(location.hours, base.location.hours),
      whatsapp: asString(location.whatsapp, base.location.whatsapp),
    },
    cta: {
      eyebrow: asString(cta.eyebrow, base.cta.eyebrow),
      title: asString(cta.title, base.cta.title),
      description: asString(cta.description, base.cta.description),
      buttonLabel: asString(cta.buttonLabel, base.cta.buttonLabel),
      buttonHref: asString(cta.buttonHref, base.cta.buttonHref),
    },
  };
}

export function buildMapsEmbedUrl(location: AboutLocation): string {
  const query = location.query.trim();
  const lat = location.lat.trim();
  const lng = location.lng.trim();
  const zoom = location.zoom.trim() || "13";
  const destination = query || (lat && lng ? `${lat},${lng}` : "Cairo, Egypt");
  return `https://www.google.com/maps?q=${encodeURIComponent(destination)}&z=${encodeURIComponent(zoom)}&output=embed`;
}

export function buildDirectionsUrl(location: AboutLocation): string {
  if (location.directionsUrl.trim()) return location.directionsUrl.trim();
  const query = location.query.trim();
  const lat = location.lat.trim();
  const lng = location.lng.trim();
  const destination = query || (lat && lng ? `${lat},${lng}` : "Cairo, Egypt");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function buildWhatsAppUrl(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}
