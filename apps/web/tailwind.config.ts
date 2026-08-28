import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        studio: {
          bg: "hsl(var(--studio-bg))",
          surface: "hsl(var(--studio-surface))",
          soft: "hsl(var(--studio-soft))",
          border: "hsl(var(--studio-border))",
          muted: "hsl(var(--studio-muted))",
          fg: "hsl(var(--studio-fg))",
          "fg-muted": "hsl(var(--studio-fg-muted))",
          "fg-subtle": "hsl(var(--studio-fg-subtle))",
          accent: "hsl(var(--studio-accent))",
          "accent-fg": "hsl(var(--studio-accent-fg))",
          "accent-soft": "hsl(var(--studio-accent-soft))",
          "accent-border": "hsl(var(--studio-accent-border))",
          secondary: "hsl(var(--studio-secondary))",
          "secondary-soft": "hsl(var(--studio-secondary-soft))",
          "secondary-border": "hsl(var(--studio-secondary-border))",
          "sidebar-hover": "hsl(var(--studio-sidebar-hover))",
          ring: "hsl(var(--studio-ring))",
          info: "hsl(var(--studio-info))",
          success: "hsl(var(--studio-success))",
          warning: "hsl(var(--studio-warning))",
          danger: "hsl(var(--studio-danger))",
        },
        tenant: {
          bg: "hsl(var(--tenant-bg))",
          surface: "hsl(var(--tenant-surface))",
          soft: "hsl(var(--tenant-soft))",
          border: "hsl(var(--tenant-border))",
          muted: "hsl(var(--tenant-muted))",
          fg: "hsl(var(--tenant-fg))",
          "fg-muted": "hsl(var(--tenant-fg-muted))",
          accent: "hsl(var(--tenant-accent))",
          "accent-fg": "hsl(var(--tenant-accent-fg))",
          "accent-soft": "hsl(var(--tenant-accent-soft))",
          ring: "hsl(var(--tenant-ring))",
          sidebar: "hsl(var(--tenant-sidebar))",
          "sidebar-soft": "hsl(var(--tenant-sidebar-soft))",
          "sidebar-fg": "hsl(var(--tenant-sidebar-fg))",
          "sidebar-fg-muted": "hsl(var(--tenant-sidebar-fg-muted))",
          "sidebar-border": "hsl(var(--tenant-sidebar-border))",
          header: "hsl(var(--tenant-header))",
        },
        emerald: {
          DEFAULT: "hsl(var(--emerald))",
          foreground: "hsl(var(--emerald-foreground))",
        },
        blue: {
          DEFAULT: "hsl(var(--blue))",
          foreground: "hsl(var(--blue-foreground))",
        },
        amber: {
          DEFAULT: "hsl(var(--amber))",
          foreground: "hsl(var(--amber-foreground))",
        },
        purple: {
          DEFAULT: "hsl(var(--purple))",
          foreground: "hsl(var(--purple-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "1.75rem",
        "4xl": "2rem",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-left": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "shimmer": {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "brand-glow-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.9" },
        },
        "brand-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "brand-float": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-6px) scale(1.04)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-up": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "expand-in": {
          from: { opacity: "0", transform: "scale(0.95) translateY(-4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-2deg)" },
          "75%": { transform: "rotate(2deg)" },
        },
        "marquee-rtl": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "fade-in-down": "fade-in-down 0.3s ease-out",
        "fade-in-left": "fade-in-left 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "count-up": "count-up 0.6s ease-out",
        "spin-slow": "spin-slow 3s linear infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "scale-up": "scale-up 0.3s ease-out",
        "expand-in": "expand-in 0.2s ease-out",
        "wiggle": "wiggle 0.3s ease-in-out",
        "marquee-rtl": "marquee-rtl 32s linear infinite",
        "brand-glow-pulse": "brand-glow-pulse 2.4s ease-in-out infinite",
        "brand-shimmer": "brand-shimmer 1.8s linear infinite",
        "brand-float": "brand-float 5s ease-in-out infinite",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        "soft-xs": "0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px -4px rgb(0 0 0 / 0.08)",
        "soft-md": "0 2px 4px -1px rgb(0 0 0 / 0.05), 0 12px 28px -14px rgb(0 0 0 / 0.16)",
        "soft-lg": "0 6px 12px -4px rgb(0 0 0 / 0.08), 0 24px 48px -22px rgb(0 0 0 / 0.22)",
        "brand-sm": "0 6px 20px -10px color-mix(in srgb, var(--brand-primary) 45%, transparent)",
        "brand-md": "0 14px 38px -14px color-mix(in srgb, var(--brand-primary) 55%, transparent)",
        "brand-glow": "0 0 0 1px color-mix(in srgb, var(--brand-primary) 30%, transparent), 0 18px 50px -18px color-mix(in srgb, var(--brand-secondary) 45%, transparent)",
      },
    },
  },
  plugins: [animate],
};

export default config;
