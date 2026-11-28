import { describe, expect, it } from "vitest";
import { HERO_BG_STYLE_OPTIONS, normalizeHeroSettings } from "./types";

describe("normalizeHeroSettings", () => {
  it("fills missing nested defaults without dropping boolean false", () => {
    const hero = normalizeHeroSettings({
      title: "أكاديمية النور",
      subtitle: null,
      isActive: false,
      socialLinks: { facebook: null, youtube: "https://youtu.be/x" },
      icons: { gifts: { label: null, visible: false } },
    });

    expect(hero.title).toBe("أكاديمية النور");
    expect(hero.subtitle).toBe("");
    expect(hero.isActive).toBe(false);
    expect(hero.socialLinks.facebook).toBe("");
    expect(hero.socialLinks.youtube).toBe("https://youtu.be/x");
    expect(hero.socialLinks.whatsapp).toBe("");
    expect(hero.icons.gifts.label).toBe("الهدايا");
    expect(hero.icons.gifts.visible).toBe(false);
    expect(hero.icons.chat).toEqual({ label: "محادثة مباشرة", visible: true });
    expect(hero.bgStyle).toBe("math");
  });

  it("keeps deliberately cleared strings empty", () => {
    const hero = normalizeHeroSettings({ subtitle: "", teacherName: "" });

    expect(hero.subtitle).toBe("");
    expect(hero.teacherName).toBe("");
  });

  it("keeps the GIS/geomatics background style selectable", () => {
    expect(normalizeHeroSettings({ bgStyle: "geomatics" }).bgStyle).toBe("geomatics");
    expect(HERO_BG_STYLE_OPTIONS.map((option) => option.value)).toContain("geomatics");
  });
});
