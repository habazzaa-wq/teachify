export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalContent {
  title: string;
  isActive: boolean;
  updatedAt: string;
  sections: LegalSection[];
}

export type LegalDocumentType = "privacy" | "terms";

export interface LegalSettings {
  privacy: LegalContent;
  terms: LegalContent;
}

const DOC_TITLES: Record<LegalDocumentType, string> = {
  privacy: "سياسة الخصوصية",
  terms: "شروط الاستخدام",
};

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asSection(value: unknown): LegalSection | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.heading !== "string" || typeof raw.body !== "string") return null;
  return { heading: raw.heading, body: raw.body };
}

function sanitizeSections(value: unknown, fallback: LegalSection[]): LegalSection[] {
  if (!Array.isArray(value)) return fallback;
  const sections = value.map(asSection).filter((s): s is LegalSection => s !== null);
  return sections.length > 0 ? sections : fallback;
}

function buildDefaultTitle(type: LegalDocumentType, savedTitle: unknown): string {
  return asString(savedTitle, DOC_TITLES[type]);
}

export const DEFAULT_PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "نظرة عامة",
    body: "تلتزم هذه المنصة بحماية خصوصية الطلاب وأولياء الأمور والمعلمين. توضح هذه السياسة أنواع البيانات التي نجمعها، وكيف نستخدمها، وكيف نحميها، وحقوقك فيما يتعلق ببياناتك.",
  },
  {
    heading: "ما البيانات التي نجمعها",
    body: "نقوم بجمع البيانات التي تقدمها مباشرة عند التسجيل مثل الاسم، والبريد الإلكتروني، ورقم الهاتف، وبيانات الطالب التعليمية. كما قد نجمع بيانات الاستخدام مثل الصفحات التي تزورها وطريقة تفاعلك مع المحتوى لتحسين تجربتك التعليمية.",
  },
  {
    heading: "كيف نستخدم بياناتك",
    body: "نستخدم بياناتك لتقديم الخدمات التعليمية، وتحسين المحتوى والمنصة، وإرسال إشعارات مهمة متعلقة بالدروس والامتحانات، والتواصل معك بخصوص حساباتك. لا نبيع بياناتك لأي طرف ثالث.",
  },
  {
    heading: "مشاركة البيانات",
    body: "لا نشارك بياناتك الشخصية مع أطراف خارجية إلا في حدود تشغيل الخدمة مثل مزودي الاستضافة، أو عند وجود التزام قانوني يلزمنا بذلك، أو بموافقتك الصريحة.",
  },
  {
    heading: "حماية البيانات",
    body: "نتخذ تدابير أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به أو الفقدان، بما في ذلك التشفير أثناء النقل والتخزين، وتقييد الوصول إلى البيانات على الأشخاص المصرح لهم فقط.",
  },
  {
    heading: "ملفات تعريف الارتباط (الكوكيز)",
    body: "نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتذكر تفضيلاتك وتحسين أداء المنصة. يمكنك التحكم في هذه الملفات من خلال إعدادات المتصفح، مع العلم أن بعض الخدمات قد لا تعمل بشكل كامل عند تعطيلها.",
  },
  {
    heading: "حقوقك",
    body: "يحق لك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها في أي وقت، والاعتراض على معالجة بياناتك، وسحب موافقتك في الحالات التي نعتمد فيها على الموافقة. يمكنك ممارسة هذه الحقوق من خلال التواصل معنا.",
  },
  {
    heading: "خصوصية القاصرين",
    body: "نولي اهتمامًا خاصًا بحماية بيانات الطلاب القاصرين. عند تسجيل طالب دون السن القانونية، نطلب موافقة ولي الأمر، ونتعامل مع بياناتهم بأقصى درجات الحذر والأمان.",
  },
];

export const DEFAULT_TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "قبول الشروط",
    body: "باستخدامك هذه المنصة فإنك توافق على هذه الشروط. إذا كنت لا توافق على أي جزء منها، فيرجى عدم استخدام المنصة أو الخدمات المقدمة.",
  },
  {
    heading: "الحسابات والمسؤولية",
    body: "أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بحسابك، وعن جميع الأنشطة التي تتم من خلال حسابك. يجب إبلاغنا فورًا عن أي استخدام غير مصرح به لحسابك.",
  },
  {
    heading: "المحتوى التعليمي",
    body: "جميع المواد التعليمية المنشورة على المنصة محمية بحقوق الملكية الفكرية، وتُقدَّم للاستخدام الشخصي التعليمي فقط. لا يجوز إعادة نشر المحتوى أو توزيعه أو بيعه دون إذن كتابي مسبق.",
  },
  {
    heading: "قواعد استخدام المنصة",
    body: "يلتزم المستخدم بعدم إساءة استخدام المنصة بأي شكل من الأشكال، بما في ذلك نشر محتوى مخالف، أو محاولة اختراق الأنظمة، أو التصرف بطرق تضر بتجربة المستخدمين الآخرين.",
  },
  {
    heading: "المدفوعات والاشتراكات",
    body: "عند شراء أي منتج أو اشتراك، يجب دفع الرسوم المعلنة. تخضع سياسات الاسترداد والاسترجاع لشروط كل منتج. في حال عدم السداد، قد يتم تعليق الوصول إلى الخدمات المدفوعة.",
  },
  {
    heading: "إخلاء المسؤولية",
    body: "نقدم المنصة ومحتواها \"كما هي\" دون ضمانات صريحة أو ضمنية. لا نضمن أن تكون المنصة خالية من الأخطاء أو أن النتائج التعليمية ستكون كما هو متوقع. لا نتحمل مسؤولية أي أضرار غير مباشرة ناتجة عن استخدام المنصة.",
  },
  {
    heading: "إنهاء أو تعليق الحساب",
    body: "نحتفظ بحقنا في تعليق أو إنهاء أي حساب يخالف هذه الشروط أو يساء استخدام المنصة، مع إشعار المستخدم كلما كان ذلك ممكنًا.",
  },
  {
    heading: "التعديلات على الشروط",
    body: "قد نقوم بتحديث هذه الشروط من وقت لآخر. سيتم إعلامك بأي تغييرات جوهرية من خلال المنصة. استمرارك في استخدام المنصة بعد التعديلات يُعد موافقة على الشروط المحدثة.",
  },
  {
    heading: "القانون الواجب التطبيق",
    body: "تخضع هذه الشروط وتفسر وفقًا للقوانين المحلية المعمول بها. أي نزاع ناشئ عن استخدام المنصة يخضع للاختصاص القضائي للمحاكم المختصة.",
  },
];

export const DEFAULT_LEGAL: LegalSettings = {
  privacy: {
    title: "سياسة الخصوصية",
    isActive: true,
    updatedAt: "",
    sections: DEFAULT_PRIVACY_SECTIONS,
  },
  terms: {
    title: "شروط الاستخدام",
    isActive: true,
    updatedAt: "",
    sections: DEFAULT_TERMS_SECTIONS,
  },
};

/**
 * Merge a saved (partial) document over defaults with per-field sanitization so
 * corrupt/null persisted values can never crash the public render tree.
 */
export function mergeLegalContent(
  saved: unknown,
  type: LegalDocumentType,
): LegalContent {
  const base = DEFAULT_LEGAL[type];
  if (!saved || typeof saved !== "object") {
    return { title: DOC_TITLES[type], isActive: true, updatedAt: "", sections: base.sections };
  }
  const raw = saved as Record<string, unknown>;

  return {
    title: buildDefaultTitle(type, raw.title),
    isActive: asBool(raw.isActive, true),
    updatedAt: asString(raw.updatedAt, ""),
    sections: sanitizeSections(raw.sections, base.sections),
  };
}

/**
 * Merge a saved `legal` settings payload over the full default documents.
 */
export function mergeLegalSettings(saved: unknown): LegalSettings {
  if (!saved || typeof saved !== "object") return DEFAULT_LEGAL;
  const raw = saved as Record<string, unknown>;
  return {
    privacy: mergeLegalContent(raw.privacy, "privacy"),
    terms: mergeLegalContent(raw.terms, "terms"),
  };
}