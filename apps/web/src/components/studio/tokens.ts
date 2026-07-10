export const studioColors = {
  light: {
    bg: "hsl(42, 20%, 96%)",
    surface: "hsl(40, 25%, 98%)",
    soft: "hsl(42, 18%, 92%)",
    border: "hsl(42, 15%, 86%)",
    muted: "hsl(42, 12%, 91%)",
    fg: "hsl(25, 15%, 15%)",
    "fg-muted": "hsl(30, 8%, 58%)",
    "fg-subtle": "hsl(30, 6%, 72%)",
    accent: "hsl(180, 25%, 39%)",
    "accent-fg": "hsl(0, 0%, 100%)",
    "accent-soft": "hsl(180, 20%, 92%)",
    "accent-border": "hsl(180, 25%, 75%)",
    ring: "hsl(180, 25%, 39%)",
    info: "hsl(210, 60%, 50%)",
    success: "hsl(160, 60%, 40%)",
    warning: "hsl(35, 85%, 50%)",
    danger: "hsl(0, 65%, 50%)",
    glass: "hsla(40, 25%, 98%, 0.6)",
    "glass-border": "hsla(42, 15%, 86%, 0.5)",
    "glass-shadow": "hsla(0, 0%, 0%, 0.04)",
    overlay: "hsla(0, 0%, 0%, 0.25)",
    skeleton: "hsl(42, 15%, 88%)",
    "skeleton-shine": "hsl(42, 20%, 94%)",
  },
  dark: {
    bg: "hsl(0, 0%, 10%)",
    surface: "hsl(0, 0%, 13%)",
    soft: "hsl(0, 0%, 16%)",
    border: "hsl(0, 0%, 19%)",
    muted: "hsl(0, 0%, 14%)",
    fg: "hsl(30, 8%, 88%)",
    "fg-muted": "hsl(30, 3%, 52%)",
    "fg-subtle": "hsl(30, 3%, 38%)",
    accent: "hsl(180, 25%, 45%)",
    "accent-fg": "hsl(0, 0%, 10%)",
    "accent-soft": "hsl(180, 20%, 12%)",
    "accent-border": "hsl(180, 25%, 30%)",
    ring: "hsl(180, 25%, 45%)",
    info: "hsl(210, 60%, 55%)",
    success: "hsl(160, 60%, 45%)",
    warning: "hsl(35, 85%, 55%)",
    danger: "hsl(0, 65%, 55%)",
    glass: "hsla(0, 0%, 13%, 0.6)",
    "glass-border": "hsla(0, 0%, 19%, 0.5)",
    "glass-shadow": "hsla(0, 0%, 0%, 0.2)",
    overlay: "hsla(0, 0%, 0%, 0.5)",
    skeleton: "hsl(0, 0%, 16%)",
    "skeleton-shine": "hsl(0, 0%, 20%)",
  },
} as const;

export const studioSpacing = {
  0: "0",
  2: "2px",
  4: "4px",
  8: "8px",
  12: "12px",
  16: "16px",
  20: "20px",
  24: "24px",
  32: "32px",
  40: "40px",
  48: "48px",
  56: "56px",
  64: "64px",
  80: "80px",
  96: "96px",
  128: "128px",
} as const;

export const studioBorderRadius = {
  none: "0",
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  pill: "9999px",
} as const;

export const studioShadows = {
  xs: "0 1px 2px 0 hsla(0, 0%, 0%, 0.04)",
  sm: "0 1px 3px 0 hsla(0, 0%, 0%, 0.06), 0 1px 2px -1px hsla(0, 0%, 0%, 0.04)",
  md: "0 4px 6px -1px hsla(0, 0%, 0%, 0.06), 0 2px 4px -2px hsla(0, 0%, 0%, 0.04)",
  lg: "0 10px 15px -3px hsla(0, 0%, 0%, 0.08), 0 4px 6px -4px hsla(0, 0%, 0%, 0.04)",
  xl: "0 20px 25px -5px hsla(0, 0%, 0%, 0.1), 0 8px 10px -6px hsla(0, 0%, 0%, 0.04)",
  glass: "0 4px 32px 0 hsla(0, 0%, 0%, 0.06), 0 1px 2px 0 hsla(0, 0%, 0%, 0.04)",
  floating: "0 16px 48px 0 hsla(0, 0%, 0%, 0.12), 0 4px 8px 0 hsla(0, 0%, 0%, 0.06)",
} as const;

export const studioEasing = {
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const studioDuration = {
  0: "0ms",
  50: "50ms",
  100: "100ms",
  150: "150ms",
  200: "200ms",
  250: "250ms",
  300: "300ms",
  400: "400ms",
  500: "500ms",
  600: "600ms",
  800: "800ms",
  1000: "1000ms",
  2000: "2000ms",
} as const;

export const studioMotion = {
  hover: { duration: 0.15, ease: studioEasing.easeOut },
  focus: { duration: 0.15, ease: studioEasing.easeOut },
  press: { duration: 0.08, ease: studioEasing.easeOut },
  open: { duration: 0.2, ease: studioEasing.smooth },
  close: { duration: 0.15, ease: studioEasing.default },
  expand: { duration: 0.3, ease: studioEasing.smooth },
  collapse: { duration: 0.2, ease: studioEasing.default },
  enter: { duration: 0.3, ease: studioEasing.smooth },
  exit: { duration: 0.2, ease: studioEasing.default },
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
  springGentle: { type: "spring" as const, stiffness: 300, damping: 25 },
  springBouncy: { type: "spring" as const, stiffness: 500, damping: 20 },
  springSnappy: { type: "spring" as const, stiffness: 600, damping: 35 },
  skeleton: { duration: 1.5, ease: studioEasing.easeInOut },
} as const;

export const studioTypography = {
  display: {
    xl: { fontSize: "56px", lineHeight: "1.1", fontWeight: "600", letterSpacing: "-0.03em" },
    l: { fontSize: "40px", lineHeight: "1.15", fontWeight: "600", letterSpacing: "-0.025em" },
  },
  heading: {
    xl: { fontSize: "32px", lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.02em" },
    l: { fontSize: "24px", lineHeight: "1.25", fontWeight: "600", letterSpacing: "-0.015em" },
    m: { fontSize: "20px", lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.01em" },
    s: { fontSize: "16px", lineHeight: "1.4", fontWeight: "600", letterSpacing: "-0.005em" },
  },
  body: {
    xl: { fontSize: "18px", lineHeight: "1.6", fontWeight: "400", letterSpacing: "0" },
    l: { fontSize: "16px", lineHeight: "1.6", fontWeight: "400", letterSpacing: "0" },
    m: { fontSize: "14px", lineHeight: "1.6", fontWeight: "400", letterSpacing: "0" },
    s: { fontSize: "13px", lineHeight: "1.5", fontWeight: "400", letterSpacing: "0" },
  },
  caption: { fontSize: "12px", lineHeight: "1.4", fontWeight: "400", letterSpacing: "0.01em" },
  label: { fontSize: "13px", lineHeight: "1.4", fontWeight: "500", letterSpacing: "0" },
  numeric: { fontSize: "14px", lineHeight: "1", fontWeight: "500", letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" },
} as const;

export const studioIconSizes = {
  16: { width: 16, height: 16 },
  18: { width: 18, height: 18 },
  20: { width: 20, height: 20 },
  24: { width: 24, height: 24 },
  28: { width: 28, height: 28 },
  32: { width: 32, height: 32 },
} as const;

export interface StudioTheme {
  mode: "light" | "dark";
}

export const studioSpringConfig = {
  default: { type: "spring" as const, stiffness: 400, damping: 30, mass: 1 },
  gentle: { type: "spring" as const, stiffness: 300, damping: 25, mass: 1 },
  bouncy: { type: "spring" as const, stiffness: 500, damping: 20, mass: 1 },
  snappy: { type: "spring" as const, stiffness: 600, damping: 35, mass: 1 },
  heavy: { type: "spring" as const, stiffness: 400, damping: 40, mass: 1.5 },
} as const;

export const studioAnimationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: 8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideUp: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },
  slideDown: {
    initial: { y: "-100%" },
    animate: { y: 0 },
    exit: { y: "-100%" },
  },
  expand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
  },
  popIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
} as const;
