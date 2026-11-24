import { describe, expect, it } from "vitest";
import tailwindConfig from "../../tailwind.config";
import { buildBrandThemeCss } from "./brand-theme";
import { generateThemeColors } from "./color";

const REQUIRED_DASHBOARD_TOKENS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--muted",
  "--muted-foreground",
  "--border",
  "--input",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--accent",
  "--ring",
  "--destructive",
  "--success",
  "--warning",
  "--info",
  "--sidebar",
  "--sidebar-foreground",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--studio-panel",
  "--studio-hover",
  "--studio-glass-toolbar",
  "--studio-glass-sidebar",
  "--studio-overlay",
];

describe("dashboard brand theme", () => {
  it.each([false, true])("generates a complete token set (dark=%s)", (dark) => {
    const tokens = generateThemeColors("#123ABC", "#DEF456", dark);

    for (const token of REQUIRED_DASHBOARD_TOKENS) {
      expect(tokens[token], `${token} missing in ${dark ? "dark" : "light"}`).toBeTruthy();
      expect(tokens[token]).not.toContain("undefined");
    }
  });

  it("derives chart colors from the two chosen colors", () => {
    const light = generateThemeColors("#123ABC", "#DEF456", false);
    const dark = generateThemeColors("#123ABC", "#DEF456", true);

    expect(light["--chart-1"]).toBe(light["--tenant-accent"]);
    expect(light["--chart-2"]).toBe(light["--tenant-secondary"]);
    expect(dark["--chart-1"]).toBe(dark["--tenant-accent"]);
    expect(light["--tenant-accent"]).not.toBe(dark["--tenant-accent"]);
  });

  it("picks readable foregrounds for light brand colors", () => {
    const bright = generateThemeColors("#FFB50E", "#F1F5F9", false);
    const dark = generateThemeColors("#123ABC", "#EEF2FF", false);

    expect(bright["--primary-foreground"]).toBe("0 0% 10%");
    expect(dark["--primary-foreground"]).toBe("0 0% 100%");
  });

  it("changes when the tenant changes its two colors", () => {
    const first = generateThemeColors("#123ABC", "#DEF456", false);
    const second = generateThemeColors("#059669", "#FEF3C7", false);

    expect(first["--tenant-accent"]).not.toBe(second["--tenant-accent"]);
    expect(first["--tenant-sidebar"]).not.toBe(second["--tenant-sidebar"]);
    expect(first["--studio-soft"]).not.toBe(second["--studio-soft"]);
  });

  it("exposes every dashboard utility class in Tailwind", () => {
    const colors = tailwindConfig.theme?.extend?.colors as Record<string, Record<string, unknown>>;

    for (const token of [
      "panel",
      "hover",
      "overlay",
      "glass-toolbar",
      "glass-toolbar-fg",
      "glass-toolbar-soft",
      "glass-toolbar-border",
      "glass-sidebar",
      "navbar",
      "navbar-contrast",
      "skeleton",
      "info",
      "success",
      "warning",
      "danger",
    ]) {
      expect(colors.studio, `studio-${token} missing from tailwind.config.ts`).toHaveProperty(token);
    }
  });

  it("emits the dashboard palette on :root and .dark so portals are themed", () => {
    const css = buildBrandThemeCss("#123ABC", "#DEF456");
    const root = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? "";
    const dark = css.match(/\.dark \{([\s\S]*?)\}/)?.[1] ?? "";
    const tenant = css.match(/\.tenant-theme \{([\s\S]*?)\}/)?.[1] ?? "";

    for (const token of REQUIRED_DASHBOARD_TOKENS) {
      expect(root, `${token} missing on :root`).toContain(`${token}:`);
      expect(dark, `${token} missing on .dark`).toContain(`${token}:`);
      expect(tenant, `${token} missing on .tenant-theme`).toContain(`${token}:`);
    }

    expect(css).not.toContain("undefined");
  });
});
