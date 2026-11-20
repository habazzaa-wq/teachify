export const ABOUT_ICON_NAMES = [
  "Award",
  "BookOpen",
  "Compass",
  "Globe",
  "GraduationCap",
  "Heart",
  "Lightbulb",
  "Rocket",
  "School",
  "ShieldCheck",
  "Sparkles",
  "Star",
  "Target",
  "Users",
] as const;

export type AboutIconName = (typeof ABOUT_ICON_NAMES)[number];

export interface AboutStat {
  id: string;
  value: string;
  label: string;
  icon: AboutIconName;
}

export interface AboutHighlight {
  id: string;
  title: string;
  description: string;
  icon: AboutIconName;
}

export interface AboutPageSettings {
  enabled: boolean;
  navLabel: string;
  navIcon: AboutIconName;
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    image: string;
    icon: AboutIconName;
    primaryActionLabel: string;
    primaryActionUrl: string;
  };
  story: {
    eyebrow: string;
    title: string;
    body: string;
    quote: string;
    icon: AboutIconName;
  };
  stats: AboutStat[];
  highlights: {
    eyebrow: string;
    title: string;
    description: string;
    items: AboutHighlight[];
  };
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
    buttonUrl: string;
    icon: AboutIconName;
  };
}

export const DEFAULT_ABOUT_PAGE: AboutPageSettings = {
  enabled: false,
  navLabel: "من نحن",
  navIcon: "Compass",
  hero: {
    eyebrow: "حكايتنا",
    title: "كل إنجاز كبير",
    accent: "يبدأ برحلة تعلّم",
    description: "نصنع تجربة تعليمية تضع المتعلم في قلبها؛ معرفة واضحة، خطوات عملية، ومساندة تساعدك على تحويل طموحك إلى تقدم تراه في كل يوم.",
    image: "",
    icon: "Sparkles",
    primaryActionLabel: "اكتشف برامجنا",
    primaryActionUrl: "/courses",
  },
  story: {
    eyebrow: "قصتنا",
    title: "تعليم يفتح لك الطريق، لا يكتفي بعرضه",
    body: "نؤمن أن التعليم المؤثر لا يبدأ من كثرة المعلومات، بل من فهم ما يحتاجه المتعلم فعلًا. لذلك نبني تجربة تجمع بين المحتوى المنظم، الشرح الواضح، والتطبيق الذي يحول المعرفة إلى مهارة قابلة للاستخدام.\n\nومن أول خطوة وحتى بلوغ الهدف، نحرص أن تكون رحلتك مفهومة ومرنة: تعرف ماذا ستتعلم، ولماذا تتعلمه، وكيف تنتقل بثقة إلى الخطوة التالية.\n\nنحن مجتمع يتطور بالتعلم المستمر؛ نستمع لاحتياجات طلابنا ومعلمينا، ونراجع تجربتنا باستمرار لنقدم مساحة تعليمية أكثر قربًا وإنسانية وفاعلية.",
    quote: "التعلّم الحقيقي هو أن تكتسب ما يمكّنك من صنع خطوتك التالية بثقة.",
    icon: "Lightbulb",
  },
  stats: [
    { id: "clarity", value: "افهم", label: "محتوى واضح ومنظم يضع الأساس الصحيح", icon: "BookOpen" },
    { id: "practice", value: "طبّق", label: "معرفة تتحول إلى مهارة بخطوات عملية", icon: "Target" },
    { id: "progress", value: "تقدّم", label: "رحلة مرنة تواكب طموحك واحتياجاتك", icon: "Rocket" },
  ],
  highlights: {
    eyebrow: "ما يميزنا",
    title: "تفاصيل صغيرة تصنع تجربة تعلّم مختلفة",
    description: "من وضوح المسار إلى جودة الشرح والتطبيق، نصمم كل خطوة لتساعدك على التعلم بثقة والاستمرار حتى ترى أثر ما تتعلمه.",
    items: [
      { id: "quality", title: "محتوى له هدف واضح", description: "كل درس جزء من مسار متكامل؛ تبدأ من المفاهيم الأساسية، ثم تبني عليها تدريجيًا بدل التشتت بين معلومات متفرقة.", icon: "Award" },
      { id: "flexibility", title: "تعلّم ينسجم مع حياتك", description: "نمنحك مساحة لتنظيم وقتك ومتابعة تقدمك بإيقاع يناسب التزاماتك، دون أن تفقد وضوح الوجهة أو قيمة الاستمرار.", icon: "Compass" },
      { id: "practice", title: "فهم يتحول إلى ممارسة", description: "نربط الشرح بالتطبيق والأمثلة حتى تتمكن من اختبار فهمك، تثبيت ما تعلمته، واستخدامه في مواقف حقيقية.", icon: "Target" },
      { id: "guidance", title: "معلمون يقرّبون الفكرة", description: "طريقة الشرح تصنع فارقًا؛ لذلك نهتم بأن تصل المعلومة بلغة واضحة وبخطوات تساعدك على السؤال والفهم والتقدم.", icon: "GraduationCap" },
      { id: "community", title: "مجتمع يشاركك الرحلة", description: "التعلم يصبح أعمق حين لا تخوضه وحدك. انضم إلى مساحة تشجع تبادل الخبرات، طرح الأسئلة، والاحتفاء بكل تقدم.", icon: "Users" },
      { id: "growth", title: "تطور مستمر في التجربة", description: "نستمع إلى آراء المتعلمين ونراجع المحتوى والأساليب باستمرار، حتى تظل التجربة أقرب إلى احتياجاتك وأكثر فاعلية.", icon: "Sparkles" },
    ],
  },
  cta: {
    eyebrow: "خطوتك القادمة",
    title: "اختر ما تريد أن تتقنه، وابدأ من هنا",
    description: "رحلتك لا تحتاج إلى أن تبدأ بخطوة كبيرة؛ يكفي أن تختار هدفًا واضحًا وتمنح نفسك فرصة للتقدم. استكشف برامجنا، وابنِ المسار الذي يناسب طموحك.",
    buttonLabel: "استكشف البرامج التعليمية",
    buttonUrl: "/courses",
    icon: "Rocket",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function icon(value: unknown, fallback: AboutIconName): AboutIconName {
  return typeof value === "string" && ABOUT_ICON_NAMES.includes(value as AboutIconName)
    ? (value as AboutIconName)
    : fallback;
}

function mergeItems<T extends AboutStat | AboutHighlight>(
  value: unknown,
  fallback: T[],
  kind: "stat" | "highlight",
): T[] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }));

  return value
    .filter(isRecord)
    .map((item, index) => {
      const base = fallback[index] ?? fallback[0];
      if (!base) return null;

      if (kind === "stat") {
        return {
          id: text(item.id, `stat-${index + 1}`),
          value: text(item.value, ""),
          label: text(item.label, ""),
          icon: icon(item.icon, base.icon),
        } as T;
      }

      return {
        id: text(item.id, `highlight-${index + 1}`),
        title: text(item.title, ""),
        description: text(item.description, ""),
        icon: icon(item.icon, base.icon),
      } as T;
    })
    .filter((item): item is T => item !== null);
}

export function mergeAboutPageSettings(saved: unknown): AboutPageSettings {
  const raw = isRecord(saved) ? saved : {};
  const hero = isRecord(raw.hero) ? raw.hero : {};
  const story = isRecord(raw.story) ? raw.story : {};
  const highlights = isRecord(raw.highlights) ? raw.highlights : {};
  const cta = isRecord(raw.cta) ? raw.cta : {};

  return {
    enabled: raw.enabled === true,
    navLabel: text(raw.navLabel, DEFAULT_ABOUT_PAGE.navLabel),
    navIcon: icon(raw.navIcon, DEFAULT_ABOUT_PAGE.navIcon),
    hero: {
      eyebrow: text(hero.eyebrow, DEFAULT_ABOUT_PAGE.hero.eyebrow),
      title: text(hero.title, DEFAULT_ABOUT_PAGE.hero.title),
      accent: text(hero.accent, DEFAULT_ABOUT_PAGE.hero.accent),
      description: text(hero.description, DEFAULT_ABOUT_PAGE.hero.description),
      image: text(hero.image, DEFAULT_ABOUT_PAGE.hero.image),
      icon: icon(hero.icon, DEFAULT_ABOUT_PAGE.hero.icon),
      primaryActionLabel: text(hero.primaryActionLabel, DEFAULT_ABOUT_PAGE.hero.primaryActionLabel),
      primaryActionUrl: text(hero.primaryActionUrl, DEFAULT_ABOUT_PAGE.hero.primaryActionUrl),
    },
    story: {
      eyebrow: text(story.eyebrow, DEFAULT_ABOUT_PAGE.story.eyebrow),
      title: text(story.title, DEFAULT_ABOUT_PAGE.story.title),
      body: text(story.body, DEFAULT_ABOUT_PAGE.story.body),
      quote: text(story.quote, DEFAULT_ABOUT_PAGE.story.quote),
      icon: icon(story.icon, DEFAULT_ABOUT_PAGE.story.icon),
    },
    stats: mergeItems(raw.stats, DEFAULT_ABOUT_PAGE.stats, "stat"),
    highlights: {
      eyebrow: text(highlights.eyebrow, DEFAULT_ABOUT_PAGE.highlights.eyebrow),
      title: text(highlights.title, DEFAULT_ABOUT_PAGE.highlights.title),
      description: text(highlights.description, DEFAULT_ABOUT_PAGE.highlights.description),
      items: mergeItems(highlights.items, DEFAULT_ABOUT_PAGE.highlights.items, "highlight"),
    },
    cta: {
      eyebrow: text(cta.eyebrow, DEFAULT_ABOUT_PAGE.cta.eyebrow),
      title: text(cta.title, DEFAULT_ABOUT_PAGE.cta.title),
      description: text(cta.description, DEFAULT_ABOUT_PAGE.cta.description),
      buttonLabel: text(cta.buttonLabel, DEFAULT_ABOUT_PAGE.cta.buttonLabel),
      buttonUrl: text(cta.buttonUrl, DEFAULT_ABOUT_PAGE.cta.buttonUrl),
      icon: icon(cta.icon, DEFAULT_ABOUT_PAGE.cta.icon),
    },
  };
}
