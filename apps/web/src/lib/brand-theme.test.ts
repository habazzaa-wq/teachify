import { describe, expect, it } from "vitest";
import tailwindConfig from "../../tailwind.config";
import {
  buildBrandThemeCss,
  DASHBOARD_THEME_BODY_CLASS,
  resolveDashboardBrandColors,
} from "./brand-theme";
import { generateCommunityThemeColors, generateThemeColors } from "./color";

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

  it("keeps the public palette out of dashboard selectors", () => {
    const css = buildBrandThemeCss("#123ABC", "#DEF456", {
      primary: "#059669",
      secondary: "#FEF3C7",
    });
    const root = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? "";
    const tenant = css.match(/\.tenant-theme \{([\s\S]*?)\}/)?.[1] ?? "";
    const body = css.match(/body\.dashboard-theme[^{]*\{([\s\S]*?)\}/)?.[1] ?? "";

    expect(root).toContain("--brand-primary: #123ABC;");
    expect(root).not.toContain("--studio-panel:");
    for (const token of REQUIRED_DASHBOARD_TOKENS) {
      expect(tenant, `${token} missing on .tenant-theme`).toContain(`${token}:`);
      expect(body, `${token} missing on body.${DASHBOARD_THEME_BODY_CLASS}`).toContain(`${token}:`);
    }
    expect(css).not.toContain("undefined");
  });

  it("keeps the public navbar palette out of the student dashboard scope", () => {
    const css = buildBrandThemeCss("#123ABC", "#DEF456", {
      primary: "#059669",
      secondary: "#FEF3C7",
    });
    const community = css.match(/\.community-theme \{([\s\S]*?)\}/)?.[1] ?? "";
    const student = css.match(/\.student-theme \{([\s\S]*?)\}/)?.[1] ?? "";

    const publicAccent = generateCommunityThemeColors("#123ABC", "#DEF456")["--accent"];
    const dashboardAccent = generateThemeColors("#059669", "#FEF3C7")["--accent"];

    expect(publicAccent).not.toBe(dashboardAccent);
    expect(community).toContain(`--accent: ${publicAccent};`);
    expect(student).toContain(`--accent: ${dashboardAccent};`);
  });

  it("changes only the public tokens when the site colors change", () => {
    const first = buildBrandThemeCss("#123ABC", "#DEF456", {
      primary: "#059669",
      secondary: "#FEF3C7",
    });
    const second = buildBrandThemeCss("#ABCDEF", "#112233", {
      primary: "#059669",
      secondary: "#FEF3C7",
    });

    expect(first).toContain("--brand-primary: #123ABC;");
    expect(second).toContain("--brand-primary: #ABCDEF;");
    expect(second.match(/\.tenant-theme \{([\s\S]*?)\}/)?.[1]).toBe(
      first.match(/\.tenant-theme \{([\s\S]*?)\}/)?.[1],
    );
  });

  it("changes only dashboard tokens when the appearance colors change", () => {
    const first = buildBrandThemeCss("#123ABC", "#DEF456", {
      primary: "#059669",
      secondary: "#FEF3C7",
    });
    const second = buildBrandThemeCss("#123ABC", "#DEF456", {
      primary: "#DC2626",
      secondary: "#FEF2F2",
    });

    expect(second.match(/:root \{([\s\S]*?)\n\}/)?.[1]).toBe(
      first.match(/:root \{([\s\S]*?)\n\}/)?.[1],
    );
    expect(second.match(/\.tenant-theme \{([\s\S]*?)\}/)?.[1]).not.toBe(
      first.match(/\.tenant-theme \{([\s\S]*?)\}/)?.[1],
    );
  });

  it("falls back to dashboard defaults instead of the public site palette", () => {
    expect(resolveDashboardBrandColors(null)).toEqual({
      primary: "#D87B63",
      secondary: "#FFB50E",
    });
    expect(
      resolveDashboardBrandColors(
        { primary_color: null, secondary_color: "#00FF00" },
        { primary: "#123ABC", secondary: "#DEF456" },
      ),
    ).toEqual({ primary: "#123ABC", secondary: "#00FF00" });
  });
});
