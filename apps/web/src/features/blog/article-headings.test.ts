import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { extractArticleHeadings, rehypeBlogHeadingIds } from "./article-headings";
import {
  blogSanitizeSchema,
  rehypeBlogSafeInlineStyles,
  rehypeBlogTextAlignment,
} from "./rendering";

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

  it("renders article heading ids with the complete sanitized markdown plugin chain", () => {
    const content = "## Real heading";
    const headings = extractArticleHeadings(content);
    const html = renderToStaticMarkup(
      createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeRaw,
          rehypeBlogTextAlignment,
          [rehypeSanitize, blogSanitizeSchema],
          [rehypeBlogHeadingIds, headings],
          rehypeBlogSafeInlineStyles,
        ],
      }, content),
    );

    expect(html).toContain('<h2 id="real-heading">Real heading</h2>');
  });
});
