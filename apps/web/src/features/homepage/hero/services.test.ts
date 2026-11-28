import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, put } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));

vi.mock("@/services/api/axios", () => ({
  default: { get, put },
}));

import { heroService } from "./services";

describe("heroService.getHeroSettings", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("reads the effective public copy so fallback text is editable", async () => {
    get.mockResolvedValue({
      data: {
        hero: {
          title: "مرحبا بكم في Geo Top",
          subtitle: "منصة Geo Top التعليمية",
          isActive: false,
          socialLinks: { facebook: "https://fb.test/x" },
          icons: { gifts: { label: "الهدايا", visible: false } },
        },
      },
    });

    const settings = await heroService.getHeroSettings();

    expect(get).toHaveBeenCalledWith("/public/hero");
    expect(settings.title).toBe("مرحبا بكم في Geo Top");
    expect(settings.subtitle).toBe("منصة Geo Top التعليمية");
    expect(settings.isActive).toBe(false);
    expect(settings.socialLinks.facebook).toBe("https://fb.test/x");
    expect(settings.socialLinks.whatsapp).toBe("");
    expect(settings.icons.gifts.visible).toBe(false);
    expect(settings.icons.chat.visible).toBe(true);
  });
});

describe("heroService.updateHeroSettings", () => {
  beforeEach(() => {
    put.mockReset();
  });

  it("persists the whole hero under homepage.values", async () => {
    put.mockResolvedValue({ data: { message: "Settings updated." } });

    const hero = {
      title: "عنوان جديد",
      subtitle: "",
      teacherImage: "",
      teacherName: "",
      badge1Text: "معلم محترف",
      badge2Text: "خبرة 20+ سنة",
      isActive: true,
      socialLinks: { facebook: "", youtube: "", phone: "", whatsapp: "" },
      icons: {
        gifts: { label: "الهدايا", visible: true },
        facebook: { label: "فيس بوك", visible: true },
        chat: { label: "محادثة مباشرة", visible: true },
        youtube: { label: "يوتيوب", visible: true },
        bestStudents: { label: "أفضل الطلاب", visible: true },
        phone: { label: "رقم الهاتف", visible: true },
      },
      bgStyle: "math" as const,
    };

    await heroService.updateHeroSettings(hero);

    expect(put).toHaveBeenCalledWith("/settings/homepage", { values: { hero } });
  });
});
