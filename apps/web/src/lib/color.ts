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
    pContrast = accentL > 62 ? "0 0% 12%" : "0 0% 100%";

    return {
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
  }

  // — Light mode —
  // الأساسي: نطاق متوسط مع نص أبيض/داكن قابل للقراءة.
  const accentL = clamp(p.l, 42, 58);
  // الشريط العلوي: نفس الأساسي صافياً.
  const navL = clamp(p.l, 42, 58);
  // الثانوي: فاتح وجذاب.
  const secL = clamp(s.l < 55 ? s.l + 16 : s.l, 55, 74);
  const secSat = clamp(sSat, 35, 80);
  // نص متناقض مقروء: داكن على الألوان الفاتحة، أبيض على الغامقة.
  pContrast = accentL > 60 ? "0 0% 12%" : "0 0% 100%";

  return {
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
}
