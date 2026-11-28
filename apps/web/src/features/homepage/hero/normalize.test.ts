import { describe, expect, it } from "vitest";
import { normalizeHeroSettings } from "./types";

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
});
