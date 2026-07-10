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

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

export function generateThemeColors(primaryHex: string, secondaryHex: string, isDark = false) {
  const p = hexToHsl(primaryHex);
  const s = hexToHsl(secondaryHex);

  /*
    لوحة احترافية مبنية على لونين من الـ tenant:

    - الخلفيات (المحتوى/الكاردات/القوائم) ← رمادي فاتح محايد تماماً، بدون أي تلوين.
    - اللون الأساسي (primary) ← شريط التنقّل (navbar) + الأزرار + العناصر النشطة + حلقات التركيز.
    - اللون الثانوي (secondary) ← لمسات احترافية فقط: تلوين خفيف عند الـ hover في الـ navbar والـ sidebar،
      وخلفية العنصر النشط في القائمة الجانبية. لا يُلوَّn السطح بالكامل.
  */

  // Primary = accent قوي وواضح (أزرار/عناصر نشطة/روابط).
  const pSat = clamp(p.s, 35, 92);
  // Secondary = تلميح خفيف فقط، لذا نُبقى تشبعه هادئاً.
  const sSat = clamp(s.s, 12, 55);

  // لون النص المتناقض داخل شريط التنقّل الأساسي.
  const navFg = isDark ? "0 0% 100%" : p.l > 60 ? "0 0% 12%" : "0 0% 100%";
  const navContrast = navFg;

  if (isDark) {
    const accentL = clamp(p.l > 45 ? p.l : p.l + 22, 52, 82);
    const navL = clamp(p.l > 45 ? p.l - 8 : p.l + 14, 24, 48);

    return {
      // — المحتوى: رمادي محايد داكن (بدون تلوين باللونين) —
      "--tenant-bg": "0 0% 9%",
      "--tenant-surface": "0 0% 12%",
      "--tenant-soft": "0 0% 16%",
      "--tenant-border": "0 0% 20%",
      "--tenant-muted": "0 0% 14%",
      "--tenant-fg": "0 0% 92%",
      "--tenant-fg-muted": "0 0% 60%",
      "--tenant-fg-subtle": "0 0% 44%",
      // — الأساسي (أزرار/عناصر نشطة/روابط/تركيز) —
      "--tenant-accent": `${p.h} ${pSat}% ${accentL}%`,
      "--tenant-accent-fg": "0 0% 100%",
      "--tenant-accent-soft": `${p.h} ${pSat}% ${clamp(accentL - 26, 16, 30)}%`,
      "--tenant-ring": `${p.h} ${pSat}% ${accentL}%`,
      // — الثانوي (تلميحات hover/active فقط) —
      "--tenant-secondary": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 24 : s.l, 50, 68)}%`,
      "--tenant-secondary-soft": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 18 : s.l + 6, 18, 30)}%`,
      // — القائمة الجانبية: محايدة —
      "--tenant-sidebar": "0 0% 11%",
      "--tenant-sidebar-soft": "0 0% 15%",
      "--tenant-sidebar-fg": "0 0% 92%",
      "--tenant-sidebar-fg-muted": "0 0% 60%",
      "--tenant-sidebar-border": "0 0% 18%",
      "--tenant-sidebar-hover": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 16 : s.l + 4, 16, 28)}%`,
      "--tenant-header": `${p.h} ${pSat}% ${navL}%`,

      // — Studio (مشترك بين الكورس-ستوديو واللوحة) —
      "--studio-bg": "0 0% 9%",
      "--studio-surface": "0 0% 12%",
      "--studio-soft": "0 0% 16%",
      "--studio-border": "0 0% 20%",
      "--studio-muted": "0 0% 14%",
      "--studio-fg": "0 0% 92%",
      "--studio-fg-muted": "0 0% 60%",
      "--studio-fg-subtle": "0 0% 44%",
      "--studio-accent": `${p.h} ${pSat}% ${accentL}%`,
      "--studio-accent-fg": "0 0% 100%",
      "--studio-accent-soft": `${p.h} ${pSat}% ${clamp(accentL - 26, 16, 30)}%`,
      "--studio-accent-border": `${p.h} ${pSat}% ${clamp(accentL - 16, 26, 44)}%`,
      "--studio-ring": `${p.h} ${pSat}% ${accentL}%`,
      // — shadcn tokens: كل الأزرار/الروابط تتبع لوني الـ tenant —
      "--primary": `${p.h} ${pSat}% ${accentL}%`,
      "--primary-foreground": navFg,
      "--secondary": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 24 : s.l, 50, 68)}%`,
      "--secondary-foreground": "0 0% 100%",
      "--accent": `${p.h} ${pSat}% ${accentL}%`,
      "--accent-foreground": navFg,
      "--ring": `${p.h} ${pSat}% ${accentL}%`,
      "--studio-secondary": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 24 : s.l, 50, 68)}%`,
      "--studio-secondary-soft": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 18 : s.l + 6, 18, 30)}%`,
      "--studio-secondary-border": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 12 : s.l, 30, 44)}%`,
      // Navbar = الأساسي (صافي)، والعناصر الفرعية تلميح ثانوي عند الـ hover
      "--studio-glass": "0 0% 12% / 0.7",
      "--studio-glass-border": "0 0% 22% / 0.5",
      "--studio-glass-toolbar": `${p.h} ${pSat}% ${navL}% / 1`,
      "--studio-glass-toolbar-fg": navFg,
      "--studio-glass-toolbar-fg-muted": "0 0% 80%",
      "--studio-glass-toolbar-border": `${p.h} ${pSat}% ${clamp(navL + 16, 34, 64)}% / 0.5`,
      "--studio-glass-toolbar-soft": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 20 : s.l + 8, 22, 38)}% / 0.55`,
      "--studio-glass-toolbar-soft-hover": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 24 : s.l + 12, 28, 46)}% / 0.7`,
      "--studio-navbar": `${p.h} ${pSat}% ${navL}%`,
      "--studio-navbar-contrast": navContrast,
      // Sidebar = محايد (أبيض داكن)، والـ hover تلميح ثانوي
      "--studio-glass-sidebar": "0 0% 11% / 1",
      "--studio-glass-sidebar-fg": "0 0% 92%",
      "--studio-glass-sidebar-fg-muted": "0 0% 60%",
      "--studio-glass-sidebar-border": "0 0% 18% / 1",
      "--studio-sidebar-hover": `${s.h} ${sSat}% ${clamp(s.l < 40 ? s.l + 16 : s.l + 4, 16, 28)}%`,
      "--studio-glass-dialog": "0 0% 12% / 0.9",
      "--studio-glass-floating": "0 0% 12% / 0.92",
      "--studio-overlay": "0 0% 0% / 0.55",
      "--studio-skeleton": "0 0% 18%",
      "--studio-skeleton-shine": "0 0% 24%",
      "--studio-info": "210 70% 62%",
      "--studio-success": "160 65% 50%",
      "--studio-warning": "35 90% 58%",
      "--studio-danger": "0 72% 60%",
    };
  }

  // — Light mode —
  const accentL = clamp(p.l < 45 ? p.l + 18 : p.l, 42, 62);
  const navL = clamp(p.l < 55 ? p.l + 12 : p.l, 42, 64);

  return {
    // — المحتوى: رمادي فاتح محايد (بدون تلوين باللونين) —
    "--tenant-bg": "220 20% 97%",
    "--tenant-surface": "0 0% 100%",
    "--tenant-soft": "220 16% 94%",
    "--tenant-border": "220 14% 89%",
    "--tenant-muted": "220 16% 96%",
    "--tenant-fg": "222 24% 18%",
    "--tenant-fg-muted": "220 12% 46%",
    "--tenant-fg-subtle": "220 10% 62%",
    // — الأساسي (أزرار/عناصر نشطة/روابط/تركيز) —
    "--tenant-accent": `${p.h} ${pSat}% ${accentL}%`,
    "--tenant-accent-fg": "0 0% 100%",
    "--tenant-accent-soft": `${p.h} ${pSat}% ${clamp(accentL + 34, 92, 97)}%`,
    "--tenant-ring": `${p.h} ${pSat}% ${accentL}%`,
    // — الثانوي (تلميحات hover/active فقط) —
    "--tenant-secondary": `${s.h} ${sSat}% ${clamp(s.l < 45 ? s.l + 22 : s.l, 45, 62)}%`,
    "--tenant-secondary-soft": `${s.h} ${sSat}% ${clamp(s.l + 30, 92, 97)}%`,
    // — القائمة الجانبية: محايدة (أبيض) —
    "--tenant-sidebar": "0 0% 100%",
    "--tenant-sidebar-soft": "220 16% 96%",
    "--tenant-sidebar-fg": "222 24% 22%",
    "--tenant-sidebar-fg-muted": "220 12% 48%",
    "--tenant-sidebar-border": "220 14% 90%",
    "--tenant-sidebar-hover": `${s.h} ${sSat}% ${clamp(s.l + 28, 90, 96)}%`,
    "--tenant-header": `${p.h} ${pSat}% ${navL}%`,

    "--studio-bg": "220 20% 97%",
    "--studio-surface": "0 0% 100%",
    "--studio-soft": "220 16% 94%",
    "--studio-border": "220 14% 89%",
    "--studio-muted": "220 16% 96%",
    "--studio-fg": "222 24% 18%",
    "--studio-fg-muted": "220 12% 46%",
    "--studio-fg-subtle": "220 10% 62%",
    "--studio-accent": `${p.h} ${pSat}% ${accentL}%`,
    "--studio-accent-fg": "0 0% 100%",
    "--studio-accent-soft": `${p.h} ${pSat}% ${clamp(accentL + 34, 92, 97)}%`,
    "--studio-accent-border": `${p.h} ${pSat}% ${clamp(accentL + 18, 66, 84)}%`,
    "--studio-ring": `${p.h} ${pSat}% ${accentL}%`,
    // — shadcn tokens: كل الأزرار/الروابط تتبع لوني الـ tenant —
    "--primary": `${p.h} ${pSat}% ${accentL}%`,
    "--primary-foreground": navFg,
    "--secondary": `${s.h} ${sSat}% ${clamp(s.l < 45 ? s.l + 22 : s.l, 45, 62)}%`,
    "--secondary-foreground": "222 24% 18%",
    "--accent": `${p.h} ${pSat}% ${accentL}%`,
    "--accent-foreground": navFg,
    "--ring": `${p.h} ${pSat}% ${accentL}%`,
    "--studio-secondary": `${s.h} ${sSat}% ${clamp(s.l < 45 ? s.l + 22 : s.l, 45, 62)}%`,
    "--studio-secondary-soft": `${s.h} ${sSat}% ${clamp(s.l + 30, 92, 97)}%`,
    "--studio-secondary-border": `${s.h} ${sSat}% ${clamp(s.l + 12, 78, 90)}%`,
    // Navbar = الأساسي (صافي)، والعناصر الفرعية تلميح ثانوي عند الـ hover
    "--studio-glass": "0 0% 100% / 0.7",
    "--studio-glass-border": "220 14% 89% / 0.5",
    "--studio-glass-toolbar": `${p.h} ${pSat}% ${navL}% / 1`,
    "--studio-glass-toolbar-fg": navFg,
    "--studio-glass-toolbar-fg-muted": navFg,
    "--studio-glass-toolbar-border": `${p.h} ${pSat}% ${clamp(navL + 16, 58, 78)}% / 0.6`,
    "--studio-glass-toolbar-soft": `${s.h} ${sSat}% ${clamp(s.l + 26, 90, 96)}% / 0.55`,
    "--studio-glass-toolbar-soft-hover": `${s.h} ${sSat}% ${clamp(s.l + 30, 92, 97)}% / 0.7`,
    "--studio-navbar": `${p.h} ${pSat}% ${navL}%`,
    "--studio-navbar-contrast": navContrast,
    // Sidebar = محايد (أبيض)، والـ hover تلميح ثانوي
    "--studio-glass-sidebar": "0 0% 100% / 1",
    "--studio-glass-sidebar-fg": "222 24% 22%",
    "--studio-glass-sidebar-fg-muted": "220 12% 48%",
    "--studio-glass-sidebar-border": "220 14% 90% / 1",
    "--studio-sidebar-hover": `${s.h} ${sSat}% ${clamp(s.l + 28, 90, 96)}%`,
    "--studio-glass-dialog": "0 0% 100% / 0.9",
    "--studio-glass-floating": "0 0% 100% / 0.92",
    "--studio-overlay": "0 0% 0% / 0.12",
    "--studio-skeleton": "220 16% 90%",
    "--studio-skeleton-shine": "220 20% 95%",
    "--studio-info": "210 70% 50%",
    "--studio-success": "160 65% 40%",
    "--studio-warning": "35 90% 50%",
    "--studio-danger": "0 72% 52%",
  };
}
