export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 3 && clean.length !== 6) return null;
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
        .join("")
      : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  const clean = hex.replace("#", "");
  if (clean.length >= 3) {
    const c0 = clean[0] ?? "0";
    const c1 = clean[1] ?? "0";
    const c2 = clean[2] ?? "0";
    if (clean.length >= 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    } else {
      r = parseInt(c0 + c0, 16);
      g = parseInt(c1 + c1, 16);
      b = parseInt(c2 + c2, 16);
    }
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(Math.min(s * 100, 100)), l: Math.round(Math.min(l * 100, 100)) };
}

/** "r g b" triplet for CSS `rgb(var(--x) / a)` usage. */
export function hexToRgbTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  return `${r} ${g} ${b}`;
}

/** Mix a hex color toward black. `amount` in 0..1 (1 = pure black). */
export function mixWithBlack(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const toHex = (c: number) => Math.round(c * (1 - amount)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Mix a hex color toward white. `amount` in 0..1 (1 = pure white). */
export function mixWithWhite(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const toHex = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Community / public-site palette derived from the tenant's two brand colors.
 * Returns the HSL tokens overridden on `.community-theme` (and dark variant)
 * so every shadcn `primary`/`secondary`/`accent`/`ring` usage follows the
 * configured site colors instead of the static defaults in globals.css.
 */
export function generateCommunityThemeColors(primaryHex: string, secondaryHex: string, isDark = false) {
  const p = hexToHsl(primaryHex);
  const s = hexToHsl(secondaryHex);

  const pSat = clamp(p.s, 35, 90);
  const sSat = clamp(s.s, 45, 100);

  if (isDark) {
    const pL = clamp(p.l > 45 ? p.l + 8 : p.l + 18, 55, 80);
    const sL = clamp(s.l > 45 ? s.l + 2 : s.l + 12, 50, 75);
    const accentL = clamp(p.l - 28, 18, 30);
    return {
      "--primary": `${p.h} ${pSat}% ${pL}%`,
      "--primary-foreground": "0 0% 100%",
      "--secondary": `${s.h} ${sSat}% ${sL}%`,
      "--secondary-foreground": "0 0% 10%",
      "--accent": `${p.h} ${clamp(pSat - 5, 40, 80)}% ${accentL}%`,
      "--accent-foreground": `${p.h} 65% 92%`,
      "--ring": `${p.h} ${pSat}% ${pL}%`,
    };
  }

  const accentL = clamp(p.l + 34, 88, 97);
  return {
    "--primary": `${p.h} ${pSat}% ${clamp(p.l, 42, 65)}%`,
    "--primary-foreground": p.l > 60 ? "0 0% 12%" : "0 0% 100%",
    "--secondary": `${s.h} ${sSat}% ${clamp(s.l, 45, 62)}%`,
    "--secondary-foreground": "30 80% 12%",
    "--accent": `${p.h} ${clamp(pSat - 5, 40, 80)}% ${accentL}%`,
    "--accent-foreground": `${p.h} ${clamp(pSat - 10, 40, 70)}% 25%`,
    "--ring": `${p.h} ${pSat}% ${clamp(p.l, 42, 65)}%`,
  };
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Full brand color *scale* derived programmatically from the two configured
 * base hex colors (primary + secondary). Returns a flat record of CSS custom
 * properties, e.g.:
 *
 *   --brand-primary-50 … --brand-primary-900
 *   --brand-secondary-50 … --brand-secondary-900
 *   --brand-primary / --brand-secondary        (the raw base colors)
 *   --brand-primary-soft / --brand-secondary-soft
 *   --brand-primary-deep / --brand-secondary-deep
 *   --brand-neutral                                (warm white / soft charcoal)
 *   --brand-gradient                               (ready-made 2-color gradient)
 *
 * Why derive instead of hardcoding: the tenant can change the two base colors
 * from the admin dashboard, and every tint/shade below is recomputed from them
 * so the whole design system re-skins itself with **zero hardcoded hex values**
 * in components. For dark mode we flip the mixing direction — light tints
 * become dark-tinted (so they read as "soft" on a dark surface) and the vivid
 * stops brighten slightly, which keeps the brand colors from glowing like neon.
 */
export function generateBrandScale(
  primaryHex: string,
  secondaryHex: string,
  isDark = false,
): Record<string, string> {
  const primaryStops = scaleStops(primaryHex, isDark);
  const secondaryStops = scaleStops(secondaryHex, isDark);

  const vars: Record<string, string> = {
    "--brand-primary": primaryHex,
    "--brand-secondary": secondaryHex,
    "--brand-primary-soft": isDark
      ? mixWithBlack(primaryHex, 0.86)
      : mixWithWhite(primaryHex, 0.86),
    "--brand-secondary-soft": isDark
      ? mixWithBlack(secondaryHex, 0.86)
      : mixWithWhite(secondaryHex, 0.86),
    "--brand-primary-deep": isDark
      ? mixWithWhite(primaryHex, 0.14)
      : mixWithBlack(primaryHex, 0.3),
    "--brand-secondary-deep": isDark
      ? mixWithWhite(secondaryHex, 0.14)
      : mixWithBlack(secondaryHex, 0.3),
    "--brand-neutral": isDark ? "#0e0e12" : "#fbf7f3",
    "--brand-gradient": `linear-gradient(135deg, ${primaryHex}, ${secondaryHex})`,
  };

  for (const k of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
    vars[`--brand-primary-${k}`] = primaryStops[k]!;
    vars[`--brand-secondary-${k}`] = secondaryStops[k]!;
  }

  return vars;
}

/**
 * Build a 10-step scale (50→900) from a single base hex.
 * Light mode: 50 is almost-white, 500 is the base, 900 is almost-black.
 * Dark mode: the direction flips so 50 reads as a *soft dark tint* (not a
 * glowing light pill) and 500+ brighten toward the base for legible accents.
 */
function scaleStops(hex: string, isDark: boolean): Record<number, string> {
  if (!isDark) {
    return {
      50: mixWithWhite(hex, 0.9),
      100: mixWithWhite(hex, 0.8),
      200: mixWithWhite(hex, 0.62),
      300: mixWithWhite(hex, 0.42),
      400: mixWithWhite(hex, 0.2),
      500: hex,
      600: mixWithBlack(hex, 0.12),
      700: mixWithBlack(hex, 0.24),
      800: mixWithBlack(hex, 0.37),
      900: mixWithBlack(hex, 0.5),
    };
  }
  return {
    50: mixWithBlack(hex, 0.78),
    100: mixWithBlack(hex, 0.66),
    200: mixWithBlack(hex, 0.52),
    300: mixWithBlack(hex, 0.4),
    400: mixWithBlack(hex, 0.24),
    500: hex,
    600: mixWithWhite(hex, 0.1),
    700: mixWithWhite(hex, 0.2),
    800: mixWithWhite(hex, 0.32),
    900: mixWithWhite(hex, 0.46),
  };
}

type Hsl = { h: number; s: number; l: number };

function shiftHue(h: number, degrees: number) {
  return ((Math.round(h + degrees) % 360) + 360) % 360;
}

function hsl(h: number, s: number, l: number) {
  return `${Math.round(h)} ${clamp(Math.round(s), 0, 100)}% ${clamp(Math.round(l), 0, 100)}%`;
}

/** WCAG-ish contrast pick for text placed on the brand primary color. */
function contrastForHex(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "0 0% 100%";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? "0 0% 10%" : "0 0% 100%";
}

/**
 * Complete the dashboard palette with every token its shells actually consume.
 *
 * `generateThemeColors` builds the tenant and studio surface tokens, but a lot
 * of the UI (cards, dialogs, selects, dropdowns, charts, toasts, portals) uses the
 * shadcn-style `--background/--card/--muted/--border/...` variables. When those
 * were left at their root defaults, parts of the dashboard kept the old fixed
 * colors. This helper derives them from the same two brand colors, in both
 * light and dark mode, so every surface is consistent.
 *
 * The same map is emitted on `:root` as well as `.tenant-theme` (see
 * buildBrandThemeCss) so portaled elements outside the theme wrapper get the
 * identical palette.
 */
function withDashboardSemanticTokens(
  tokens: Record<string, string>,
  ctx: {
    p: Hsl;
    s: Hsl;
    pSat: number;
    sSat: number;
    accentL: number;
    secL: number;
    pContrast: string;
    isDark: boolean;
  },
): Record<string, string> {
  const v = (key: string) => tokens[key] as string;
  const dark = ctx.isDark;

  const info = v("--studio-info");
  const success = v("--studio-success");
  const warning = v("--studio-warning");
  const danger = v("--studio-danger");

  const infoFg = dark ? "225 25% 10%" : "0 0% 100%";
  const successFg = dark ? "225 30% 8%" : "0 0% 100%";
  const warningFg = "225 25% 10%";
  const dangerFg = "0 0% 100%";

  const chart1 = v("--tenant-accent");
  const chart2 = v("--tenant-secondary");
  const chart3 = hsl(
    shiftHue(ctx.p.h, 32),
    ctx.pSat - 12,
    dark ? clamp(ctx.accentL + 10, 55, 80) : clamp(ctx.accentL + 12, 58, 78),
  );
  const chart4 = hsl(
    shiftHue(ctx.s.h, -28),
    ctx.sSat - 8,
    dark ? clamp(ctx.secL + 8, 50, 76) : clamp(ctx.secL - 8, 50, 72),
  );
  const chart5 = hsl(shiftHue(ctx.p.h, 180), 55, dark ? 66 : 60);

  return {
    ...tokens,

    // Surfaces and text — every card/input/portal now follows the brand pair.
    "--background": v("--tenant-bg"),
    "--foreground": v("--tenant-fg"),
    "--card": v("--tenant-surface"),
    "--card-foreground": v("--tenant-fg"),
    "--popover": v("--tenant-soft"),
    "--popover-foreground": v("--tenant-fg"),
    "--muted": v("--tenant-muted"),
    "--muted-foreground": v("--tenant-fg-muted"),
    "--border": v("--tenant-border"),
    "--input": v("--tenant-border"),

    // shadcn interactive tokens are re-declared here to stay identical to the
    // studio/tenant tokens in both themes (and therefore in portals too).
    "--primary": v("--tenant-accent"),
    "--primary-foreground": ctx.pContrast,
    "--secondary": v("--tenant-secondary"),
    "--secondary-foreground": v("--tenant-fg"),
    "--accent": v("--tenant-accent"),
    "--accent-foreground": ctx.pContrast,
    "--ring": v("--tenant-ring"),

    // Semantic status colors: fixed hues for meaning, but themed foregrounds.
    "--destructive": danger,
    "--destructive-foreground": dangerFg,
    "--success": success,
    "--success-foreground": successFg,
    "--warning": warning,
    "--warning-foreground": warningFg,
    "--info": info,
    "--info-foreground": infoFg,
    "--studio-info-foreground": infoFg,
    "--studio-success-foreground": successFg,
    "--studio-warning-foreground": warningFg,
    "--studio-danger-foreground": dangerFg,

    // Sidebar family used by the generic AppSidebar primitives.
    "--sidebar": v("--tenant-sidebar"),
    "--sidebar-foreground": v("--tenant-sidebar-fg"),
    "--sidebar-accent": v("--tenant-sidebar-hover"),
    "--sidebar-accent-foreground": v("--tenant-sidebar-fg"),
    "--sidebar-soft": v("--tenant-sidebar-soft"),
    "--sidebar-fg-muted": v("--tenant-sidebar-fg-muted"),
    "--sidebar-fg-subtle": v("--tenant-fg-subtle"),
    "--sidebar-border": v("--tenant-sidebar-border"),
    "--sidebar-ring": v("--tenant-ring"),

    // Charts derive from the same two brand colors plus harmonious rotations.
    "--chart-1": chart1,
    "--chart-2": chart2,
    "--chart-3": chart3,
    "--chart-4": chart4,
    "--chart-5": chart5,

    // Named palette kept in sync for StudioChip / media file-type badges.
    "--emerald": success,
    "--emerald-foreground": successFg,
    "--blue": info,
    "--blue-foreground": infoFg,
    "--amber": warning,
    "--amber-foreground": warningFg,
    "--purple": hsl(
      shiftHue(ctx.p.h, 210),
      clamp(ctx.pSat - 10, 35, 70),
      dark ? 66 : 58,
    ),
    "--purple-foreground": dark ? "225 25% 10%" : "0 0% 100%",

    // Missing studio utilities used heavily by the instructor workspace.
    "--studio-panel": v("--studio-surface"),
    "--studio-hover": v("--studio-sidebar-hover"),
  };
}

export function generateThemeColors(primaryHex: string, secondaryHex: string, isDark = false) {
  const p = hexToHsl(primaryHex);
  const s = hexToHsl(secondaryHex);

  /*
    لوحة احترافية مبنية على لونين من الـ tenant، وتدعم Light + Dark:

    · اللون الأساسي (primary) ← شريط التنقّل (navbar) بلون صافٍ + الأزرار +
      العناصر النشطة + الروابط + حلقات التركيز. يظهر بوضوح في كل لوحة التحكم.
    · اللون الثانوي (secondary) ← يلوّن القائمة الجانبية (sidebar) بتلميح خفيف،
      وخلفيات العناصر النشطة والـ hover والبادجات والأزرار الثانوية.
    · الأسطح (المحتوى/الكاردات) ← رمادي محايد مائل قليلاً لهوى اللون الثانوي
      لإحساس متناغم، مع تباين عالٍ للنصوص وراحة للعين.
  */

  // Primary = لون علامة تجارية واضح (أزرار/عناصر نشطة/روابط). نثبّت التشبّع
  // والإضاءة داخل نطاق مريح للعين مع نص متناقض قابل للقراءة.
  const pSat = clamp(p.s, 45, 88);
  // Secondary = لون داعم (sidebar/active/hover/secondary button).
  const sSat = clamp(s.s, 32, 82);

  // لون النص المتناقض داخل عناصر اللون الأساسي يُحسب لاحقاً حسب إضاءة
  // اللون الناتج فعلياً (accentL) حتى يبقى مقروءاً في الوضعين.
  let pContrast: string;

  if (isDark) {
    // الأساسي في الوضع الداكن: أكثر إضاءة ليكون حيويّاً لكن بتباين أبيض.
    const accentL = clamp(p.l > 52 ? p.l - 4 : p.l + 16, 54, 68);
    // الشريط العلوي: درجة أعمق قليلاً من الأساسي لأناقة.
    const navL = clamp(p.l > 52 ? p.l - 8 : p.l + 10, 40, 58);
    // الثانوي في الوضع الداكن.
    const secL = clamp(s.l < 50 ? s.l + 14 : s.l, 42, 64);
    const secSat = clamp(sSat, 30, 78);
    // نص متناقض مقروء: أبيض على الألوان الغامقة، داكن على الألوان الفاتحة.
    pContrast = contrastForHex(primaryHex);
    // تفاعلية احترافية: hover/active يضيئان الأساسي تدريجياً.
    const accentHoverL = clamp(accentL + 6, 60, 74);
    const accentActiveL = clamp(accentL + 11, 64, 80);

    const tokens = {
      // — المحتوى: رمادي داكن مائل لهوى الثانوي (متناغم) —
      "--tenant-bg": `${s.h} ${clamp(sSat, 0, 10)}% 8%`,
      "--tenant-surface": "222 20% 12%",
      "--tenant-soft": "222 16% 15%",
      "--tenant-border": "222 14% 20%",
      "--tenant-muted": "222 14% 16%",
      "--tenant-fg": "210 30% 92%",
      "--tenant-fg-muted": "215 12% 62%",
      "--tenant-fg-subtle": "215 10% 45%",
      // — الأساسي (أزرار/عناصر نشطة/روابط/تركيز) —
      "--tenant-accent": `${p.h} ${pSat}% ${accentL}%`,
      "--tenant-accent-fg": pContrast,
      "--tenant-accent-hover": `${p.h} ${pSat}% ${accentHoverL}%`,
      "--tenant-accent-active": `${p.h} ${pSat}% ${accentActiveL}%`,
      "--tenant-accent-soft": `${p.h} ${clamp(pSat - 10, 30, 70)}% 22%`,
      "--tenant-ring": `${p.h} ${pSat}% ${accentL}%`,
      // — الثانوي (sidebar/active/hover) —
      "--tenant-secondary": `${s.h} ${secSat}% ${secL}%`,
      "--tenant-secondary-soft": `${s.h} ${clamp(secSat - 8, 28, 70)}% 18%`,
      "--tenant-header": `${p.h} ${pSat}% ${navL}%`,
      "--tenant-header-fg": pContrast,
      // — القائمة الجانبية: مائلة للثانوي —
      "--tenant-sidebar": `${s.h} ${clamp(sSat, 0, 12)}% 11%`,
      "--tenant-sidebar-soft": `${s.h} ${clamp(sSat, 0, 12)}% 14%`,
      "--tenant-sidebar-fg": "210 30% 90%",
      "--tenant-sidebar-fg-muted": "215 12% 60%",
      "--tenant-sidebar-border": "222 14% 18%",
      "--tenant-sidebar-hover": `${s.h} ${clamp(secSat - 8, 28, 70)}% 20%`,

      // — Studio —
      "--studio-bg": `${s.h} ${clamp(sSat, 0, 10)}% 8%`,
      "--studio-surface": "222 20% 12%",
      "--studio-soft": "222 16% 15%",
      "--studio-border": "222 14% 20%",
      "--studio-muted": "222 14% 16%",
      "--studio-fg": "210 30% 92%",
      "--studio-fg-muted": "215 12% 62%",
      "--studio-fg-subtle": "215 10% 45%",
      "--studio-accent": `${p.h} ${pSat}% ${accentL}%`,
      "--studio-accent-fg": pContrast,
      "--studio-accent-hover": `${p.h} ${pSat}% ${accentHoverL}%`,
      "--studio-accent-active": `${p.h} ${pSat}% ${accentActiveL}%`,
      "--studio-accent-soft": `${p.h} ${clamp(pSat - 10, 30, 70)}% 22%`,
      "--studio-accent-border": `${p.h} ${clamp(pSat - 5, 35, 75)}% 38%`,
      "--studio-ring": `${p.h} ${pSat}% ${accentL}%`,
      // — shadcn tokens: كل الأزرار/الروابط تتبع لوني الـ tenant —
      "--primary": `${p.h} ${pSat}% ${accentL}%`,
      "--primary-foreground": pContrast,
      "--secondary": `${s.h} ${secSat}% ${secL}%`,
      "--secondary-foreground": "210 30% 92%",
      "--accent": `${p.h} ${pSat}% ${accentL}%`,
      "--accent-foreground": pContrast,
      "--ring": `${p.h} ${pSat}% ${accentL}%`,
      "--studio-secondary": `${s.h} ${secSat}% ${secL}%`,
      "--studio-secondary-soft": `${s.h} ${clamp(secSat - 8, 28, 70)}% 18%`,
      "--studio-secondary-border": `${s.h} ${clamp(secSat - 8, 28, 70)}% 34%`,
      // Navbar = الأساسي (صافٍ)، والعناصر الفرعية تلميح ثانوي عند الـ hover
      "--studio-glass": "222 20% 14% / 0.7",
      "--studio-glass-border": "222 14% 20% / 0.5",
      "--studio-glass-toolbar": `${p.h} ${pSat}% ${navL}% / 1`,
      "--studio-glass-toolbar-fg": pContrast,
      "--studio-glass-toolbar-fg-muted": pContrast,
      "--studio-glass-toolbar-border": `${p.h} ${clamp(pSat - 10, 30, 70)}% ${clamp(accentL + 12, 60, 80)}% / 0.5`,
      "--studio-glass-toolbar-soft": `${s.h} ${clamp(secSat - 8, 28, 70)}% 22% / 0.7`,
      "--studio-glass-toolbar-soft-hover": `${s.h} ${clamp(secSat - 8, 28, 70)}% 28% / 0.85`,
      "--studio-navbar": `${p.h} ${pSat}% ${navL}%`,
      "--studio-navbar-contrast": pContrast,
      // Sidebar = مائل للثانوي، والـ hover تلميح أعمق
      "--studio-glass-sidebar": `${s.h} ${clamp(sSat, 0, 12)}% 11% / 1`,
      "--studio-glass-sidebar-fg": "210 30% 90%",
      "--studio-glass-sidebar-fg-muted": "215 12% 60%",
      "--studio-glass-sidebar-border": "222 14% 18% / 1",
      "--studio-sidebar-hover": `${s.h} ${clamp(secSat - 8, 28, 70)}% 20%`,
      "--studio-glass-dialog": "222 20% 14% / 0.9",
      "--studio-glass-floating": "222 20% 14% / 0.92",
      "--studio-overlay": "0 0% 0% / 0.55",
      "--studio-skeleton": "222 14% 18%",
      "--studio-skeleton-shine": "222 16% 24%",
      "--studio-info": `${p.h} ${clamp(pSat - 5, 35, 75)}% 64%`,
      "--studio-success": "160 65% 45%",
      "--studio-warning": "35 90% 55%",
      "--studio-danger": "0 72% 58%",
    };

    return withDashboardSemanticTokens(tokens, {
      p,
      s,
      pSat,
      sSat,
      accentL,
      secL,
      pContrast,
      isDark: true,
    });
  }

  // — Light mode —
  // الأساسي: نطاق متوسط مع نص أبيض/داكن قابل للقراءة.
  const accentL = clamp(p.l, 42, 58);
  // الشريط العلوي: نفس الأساسي صافياً مع تلميح أعمق قليلاً لإحساس احترافي.
  const navL = clamp(p.l - 3, 38, 55);
  // الثانوي: فاتح وجذاب.
  const secL = clamp(s.l < 55 ? s.l + 16 : s.l, 55, 74);
  const secSat = clamp(sSat, 35, 80);
  // نص متناقض مقروء: داكن على الألوان الفاتحة، أبيض على الغامقة.
  pContrast = contrastForHex(primaryHex);
  // تفاعلية احترافية: hover/active يعمّقان الأساسي تدريجياً.
  const accentHoverL = clamp(accentL - 6, 36, 52);
  const accentActiveL = clamp(accentL - 11, 30, 46);

  const tokens = {
    // — المحتوى: رمادي فاتح مائل لهوى الثانوي (متناغم ونظيف) —
    "--tenant-bg": `${s.h} ${clamp(sSat, 0, 9)}% 98%`,
    "--tenant-surface": "0 0% 100%",
    "--tenant-soft": `${s.h} ${clamp(sSat, 0, 11)}% 96%`,
    "--tenant-border": `${s.h} ${clamp(sSat, 0, 13)}% 90%`,
    "--tenant-muted": `${s.h} ${clamp(sSat, 0, 9)}% 95%`,
    "--tenant-fg": "222 30% 14%",
    "--tenant-fg-muted": "220 12% 42%",
    "--tenant-fg-subtle": "220 10% 60%",
    // — الأساسي (أزرار/عناصر نشطة/روابط/تركيز) —
    "--tenant-accent": `${p.h} ${pSat}% ${accentL}%`,
    "--tenant-accent-fg": pContrast,
    "--tenant-accent-hover": `${p.h} ${pSat}% ${accentHoverL}%`,
    "--tenant-accent-active": `${p.h} ${pSat}% ${accentActiveL}%`,
    "--tenant-accent-soft": `${p.h} ${clamp(pSat - 10, 30, 70)}% 94%`,
    "--tenant-ring": `${p.h} ${pSat}% ${accentL}%`,
    // — الثانوي (sidebar/active/hover) —
    "--tenant-secondary": `${s.h} ${secSat}% ${secL}%`,
    "--tenant-secondary-soft": `${s.h} ${clamp(secSat - 10, 25, 70)}% 95%`,
    "--tenant-header": `${p.h} ${pSat}% ${navL}%`,
    "--tenant-header-fg": pContrast,
    // — القائمة الجانبية: مائلة للثانوي (فاتح) —
    "--tenant-sidebar": `${s.h} ${clamp(sSat, 0, 15)}% 99%`,
    "--tenant-sidebar-soft": `${s.h} ${clamp(sSat, 0, 13)}% 96%`,
    "--tenant-sidebar-fg": "222 30% 18%",
    "--tenant-sidebar-fg-muted": "220 12% 46%",
    "--tenant-sidebar-border": `${s.h} ${clamp(sSat, 0, 13)}% 92%`,
    "--tenant-sidebar-hover": `${s.h} ${clamp(secSat - 10, 25, 70)}% 93%`,

    "--studio-bg": `${s.h} ${clamp(sSat, 0, 9)}% 98%`,
    "--studio-surface": "0 0% 100%",
    "--studio-soft": `${s.h} ${clamp(sSat, 0, 11)}% 96%`,
    "--studio-border": `${s.h} ${clamp(sSat, 0, 13)}% 90%`,
    "--studio-muted": `${s.h} ${clamp(sSat, 0, 9)}% 95%`,
    "--studio-fg": "222 30% 14%",
    "--studio-fg-muted": "220 12% 42%",
    "--studio-fg-subtle": "220 10% 60%",
    "--studio-accent": `${p.h} ${pSat}% ${accentL}%`,
    "--studio-accent-fg": pContrast,
    "--studio-accent-hover": `${p.h} ${pSat}% ${accentHoverL}%`,
    "--studio-accent-active": `${p.h} ${pSat}% ${accentActiveL}%`,
    "--studio-accent-soft": `${p.h} ${clamp(pSat - 10, 30, 70)}% 94%`,
    "--studio-accent-border": `${p.h} ${clamp(pSat - 5, 35, 75)}% 82%`,
    "--studio-ring": `${p.h} ${pSat}% ${accentL}%`,
    // — shadcn tokens: كل الأزرار/الروابط تتبع لوني الـ tenant —
    "--primary": `${p.h} ${pSat}% ${accentL}%`,
    "--primary-foreground": pContrast,
    "--secondary": `${s.h} ${secSat}% ${secL}%`,
    "--secondary-foreground": "222 30% 18%",
    "--accent": `${p.h} ${pSat}% ${accentL}%`,
    "--accent-foreground": pContrast,
    "--ring": `${p.h} ${pSat}% ${accentL}%`,
    "--studio-secondary": `${s.h} ${secSat}% ${secL}%`,
    "--studio-secondary-soft": `${s.h} ${clamp(secSat - 10, 25, 70)}% 95%`,
    "--studio-secondary-border": `${s.h} ${clamp(secSat - 8, 30, 70)}% 84%`,
    // Navbar = الأساسي (صافٍ)، والعناصر الفرعية تلميح ثانوي عند الـ hover
    "--studio-glass": "0 0% 100% / 0.7",
    "--studio-glass-border": `${s.h} ${clamp(sSat, 0, 13)}% 90% / 0.6`,
    "--studio-glass-toolbar": `${p.h} ${pSat}% ${navL}% / 1`,
    "--studio-glass-toolbar-fg": pContrast,
    "--studio-glass-toolbar-fg-muted": pContrast,
    "--studio-glass-toolbar-border": `${p.h} ${clamp(pSat - 10, 30, 70)}% ${clamp(accentL + 20, 70, 90)}% / 0.55`,
    "--studio-glass-toolbar-soft": `${s.h} ${clamp(secSat - 10, 25, 70)}% 94% / 0.7`,
    "--studio-glass-toolbar-soft-hover": `${s.h} ${clamp(secSat - 8, 30, 70)}% 90% / 0.85`,
    "--studio-navbar": `${p.h} ${pSat}% ${navL}%`,
    "--studio-navbar-contrast": pContrast,
    // Sidebar = مائل للثانوي (فاتح)، والـ hover تلميح أعمق
    "--studio-glass-sidebar": `${s.h} ${clamp(sSat, 0, 15)}% 99% / 1`,
    "--studio-glass-sidebar-fg": "222 30% 18%",
    "--studio-glass-sidebar-fg-muted": "220 12% 46%",
    "--studio-glass-sidebar-border": `${s.h} ${clamp(sSat, 0, 13)}% 92% / 1`,
    "--studio-sidebar-hover": `${s.h} ${clamp(secSat - 10, 25, 70)}% 93%`,
    "--studio-glass-dialog": "0 0% 100% / 0.9",
    "--studio-glass-floating": "0 0% 100% / 0.92",
    "--studio-overlay": "0 0% 0% / 0.12",
    "--studio-skeleton": `${s.h} ${clamp(sSat, 0, 11)}% 92%`,
    "--studio-skeleton-shine": `${s.h} ${clamp(sSat, 0, 11)}% 96%`,
    "--studio-info": `${p.h} ${clamp(pSat - 5, 35, 75)}% 52%`,
    "--studio-success": "160 65% 38%",
    "--studio-warning": "35 90% 48%",
    "--studio-danger": "0 72% 50%",
  };

  return withDashboardSemanticTokens(tokens, {
    p,
    s,
    pSat,
    sSat,
    accentL,
    secL,
    pContrast,
    isDark: false,
  });
}
