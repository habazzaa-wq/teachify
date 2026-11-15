import { describe, expect, it } from "vitest";
import { extractArticleHeadings } from "./article-headings";

describe("extractArticleHeadings", () => {
  it("extracts markdown and raw HTML headings with unique ids", () => {
    expect(extractArticleHeadings("## بداية\n<h3>تفاصيل المقال</h3>\n## بداية")).toEqual([
      { id: "بداية", text: "بداية", level: 2 },
      { id: "تفاصيل-المقال", text: "تفاصيل المقال", level: 3 },
      { id: "بداية-2", text: "بداية", level: 2 },
    ]);
  });

  it("ignores heading-like content inside fenced code", () => {
    expect(extractArticleHeadings("```md\n## not a heading\n```\n## Real heading")).toEqual([
      { id: "real-heading", text: "Real heading", level: 2 },
    ]);
  });
});
