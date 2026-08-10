export type FontCategory =
  | "arabic"
  | "professional"
  | "serif"
  | "display"
  | "handwriting"
  | "mono";

export interface GoogleFontOption {
  /** Stable key = the CSS font-family name. This is what we persist in settings. */
  family: string;
  /** Localised label shown in the picker. */
  label: string;
  /** Google Fonts css2 stylesheet URL. */
  cssUrl: string;
  /** Picker group. */
  category: FontCategory;
}

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  arabic: "الخطوط العربية",
  professional: "خطوط احترافية",
  serif: "خطوط سيريف كلاسيكية",
  display: "خطوط العناوين",
  handwriting: "خطوط يدوية",
  mono: "خطوط ثابتة العرض (Mono)",
};

const WEIGHT_PARAM = ":wght@300;400;500;600;700;800;900";

function css2(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}${WEIGHT_PARAM}&display=swap`;
}

interface FontSeed {
  family: string;
  label: string;
  category: FontCategory;
}

function seed(family: string, label: string, category: FontCategory): GoogleFontOption {
  return { family, label, cssUrl: css2(family), category };
}

const ARABIC_FONTS: FontSeed[] = [
  { family: "Cairo", label: "القاهرة", category: "arabic" },
  { family: "Tajawal", label: "تجوّل", category: "arabic" },
  { family: "Almarai", label: "المراعي", category: "arabic" },
  { family: "Alexandria", label: "الإسكندرية", category: "arabic" },
  { family: "Noto Sans Arabic", label: "نوتو بلا عربي", category: "arabic" },
  { family: "Noto Kufi Arabic", label: "نوتو كوفي عربي", category: "arabic" },
  { family: "Noto Naskh Arabic", label: "نوتو نسخ عربي", category: "arabic" },
  { family: "IBM Plex Sans Arabic", label: "آي بي إم بلكس عربي", category: "arabic" },
  { family: "Readex Pro", label: "ريدكس برو", category: "arabic" },
  { family: "Rubik", label: "روبيك", category: "arabic" },
  { family: "El Messiri", label: "المسيري", category: "arabic" },
  { family: "Changa", label: "تشانغا", category: "arabic" },
  { family: "Baloo Bhaijaan 2", label: "بالو بهايجان", category: "arabic" },
  { family: "Vazirmatn", label: "وزيرمتن", category: "arabic" },
  { family: "Zain", label: "زين", category: "arabic" },
  { family: "Mada", label: "مدى", category: "arabic" },
  { family: "Harmattan", label: "هارماتان", category: "arabic" },
  { family: "Marhey", label: "مرحي", category: "arabic" },
  { family: "Mirza", label: "مرزا", category: "arabic" },
  { family: "Lalezar", label: "لاليزار", category: "arabic" },
  { family: "Rakkas", label: "رقّاص", category: "arabic" },
  { family: "Katibeh", label: "كاتِبة", category: "arabic" },
  { family: "Jomhuria", label: "جمهورية", category: "arabic" },
  { family: "Amiri", label: "أميري", category: "arabic" },
  { family: "Amiri Quran", label: "أميري قرآن", category: "arabic" },
  { family: "Aref Ruqaa", label: "عارف رقعة", category: "arabic" },
  { family: "Aref Ruqaa Ink", label: "عارف رقعة حبر", category: "arabic" },
  { family: "Lateef", label: "لطيف", category: "arabic" },
  { family: "Scheherazade New", label: "شهرزاد الجديد", category: "arabic" },
  { family: "Noto Nastaliq Urdu", label: "نوتو نستعليق أردو", category: "arabic" },
  { family: "Reem Kufi", label: "ريم كوفي", category: "arabic" },
  { family: "Reem Kufi Fun", label: "ريم كوفي فن", category: "arabic" },
  { family: "Gulzar", label: "گلزار", category: "arabic" },
  { family: "Blaka", label: "بلاكا", category: "arabic" },
  { family: "Blaka Hollow", label: "بلاكا هولو", category: "arabic" },
  { family: "Blaka Ink", label: "بلاكا إنك", category: "arabic" },
  { family: "Ruwudu", label: "رُوودو", category: "arabic" },
];

const PROFESSIONAL_FONTS: string[] = [
  "Inter",
  "Poppins",
  "Roboto",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Raleway",
  "Nunito",
  "Nunito Sans",
  "Oswald",
  "Barlow",
  "Barlow Condensed",
  "DM Sans",
  "Manrope",
  "Plus Jakarta Sans",
  "Space Grotesk",
  "Figtree",
  "Outfit",
  "Sora",
  "Work Sans",
  "IBM Plex Sans",
  "Source Sans 3",
  "Public Sans",
  "Archivo",
  "Archivo Narrow",
  "Overpass",
  "Karla",
  "Ubuntu",
  "Jost",
  "Exo 2",
  "Mulish",
  "Comfortaa",
  "Quicksand",
  "Josefin Sans",
  "Lexend",
  "Prompt",
  "Chivo",
  "Assistant",
  "Be Vietnam Pro",
  "Hanken Grotesk",
  "Onest",
  "Urbanist",
  "Albert Sans",
  "Anybody",
  "Epilogue",
  "Faustina",
  "Gantari",
  "Geologica",
  "Instrument Sans",
  "Inter Tight",
  "Kanit",
  "League Spartan",
  "Libre Franklin",
  "Maven Pro",
  "Mukta",
  "Neuton",
  "Oxygen",
  "Radio Canada",
  "Rowdies",
  "Sarabun",
  "Saira",
  "Saira Condensed",
  "Schibsted Grotesk",
  "Syne",
  "Tenor Sans",
  "Titillium Web",
  "Tauri",
  "Unbounded",
  "Vollkorn",
  "Yantramanav",
  "Zilla Slab",
  "Gelasio",
  "Red Hat Display",
  "Red Hat Text",
  "Hind",
  "Hind Madurai",
  "Hind Siliguri",
  "Jaldi",
  "Kadwa",
  "Heebo",
  "Mukta Mahee",
  "Sofia Sans",
];

const SERIF_FONTS: string[] = [
  "Source Serif 4",
  "Merriweather",
  "Playfair Display",
  "Lora",
  "PT Serif",
  "Roboto Slab",
  "Libre Baskerville",
  "EB Garamond",
  "Cormorant Garamond",
  "Cinzel",
  "Crimson Pro",
  "Fraunces",
  "DM Serif Display",
  "DM Serif Text",
  "Instrument Serif",
  "Old Standard TT",
  "Zilla Slab Highlight",
  "Abril Fatface",
  "Bree Serif",
  "Cardo",
  "Literata",
  "Marcellus",
  "Noto Serif",
  "Noto Serif Display",
  "PT Serif Caption",
  "Spectral",
  "Tinos",
];

const DISPLAY_FONTS: string[] = [
  "Bebas Neue",
  "Anton",
  "Archivo Black",
  "Alfa Slab One",
  "Bangers",
  "Caveat",
  "Pacifico",
  "Dancing Script",
  "Great Vibes",
  "Satisfy",
  "Lobster",
  "Shadows Into Light",
  "Kalam",
  "Arizonia",
  "Berkshire Swash",
  "Cinzel Decorative",
  "Cormorant Infant",
  "Courgette",
  "Didact Gothic",
  "Dosis",
  "Fjalla One",
  "Fredoka",
  "Galada",
  "Grand Hotel",
  "Gruppo",
  "Hammersmith One",
  "Kaushan Script",
  "Lobster Two",
  "Merienda",
  "Mitr",
  "Montserrat Alternates",
  "Mr Dafoe",
  "Parisienne",
  "Pathway Gothic One",
  "Philosopher",
  "Righteous",
  "Russo One",
  "Sacramento",
  "Special Elite",
  "Tangerine",
  "Yellowtail",
];

const MONO_FONTS: string[] = [
  "Inconsolata",
  "Space Mono",
  "JetBrains Mono",
  "Fira Code",
  "IBM Plex Mono",
  "Roboto Mono",
  "Source Code Pro",
  "Ubuntu Mono",
  "Oxygen Mono",
  "Cutive Mono",
  "DM Mono",
];

export const GOOGLE_FONTS: GoogleFontOption[] = [
  ...ARABIC_FONTS.map((f) => seed(f.family, f.label, f.category)),
  ...PROFESSIONAL_FONTS.map((family) => seed(family, family, "professional")),
  ...SERIF_FONTS.map((family) => seed(family, family, "serif")),
  ...DISPLAY_FONTS.map((family) => seed(family, family, "display")),
  ...MONO_FONTS.map((family) => seed(family, family, "mono")),
];

const FONT_BY_FAMILY = new Map<string, GoogleFontOption>(
  GOOGLE_FONTS.map((font) => [font.family.toLowerCase(), font]),
);

export function getFontOption(family: string | null | undefined): GoogleFontOption | null {
  if (!family) return null;
  return FONT_BY_FAMILY.get(family.trim().toLowerCase()) ?? null;
}

/** Google Fonts stylesheet URL for a saved family, or null when unset/unknown. */
export function getFontCssUrl(family: string | null | undefined): string | null {
  const option = getFontOption(family);
  return option?.cssUrl ?? null;
}

/**
 * CSS font-family stack for the saved family. Falls back to the default stack
 * when unset so the platform default (Cairo) keeps rendering.
 */
export function buildFontStack(family: string | null | undefined): string | null {
  const option = getFontOption(family);
  if (!option) return null;
  return `"${option.family}", "system-ui", "sans-serif"`;
}
