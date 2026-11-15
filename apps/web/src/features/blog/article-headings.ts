import type { Element, Root, RootContent } from "hast";

export type ArticleHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function articleHeadingId(value: string): string {
  return stripMarkup(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-") || "section";
}

export function extractArticleHeadings(content: string): ArticleHeading[] {
  const headings: ArticleHeading[] = [];
  const usedIds = new Map<string, number>();
  const pattern = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1\s*>|^(#{2,3})[ \t]+(.+?)\s*#*\s*$/gm;
  const contentWithoutCode = content.replace(
    /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm,
    (fence) => fence.replace(/[^\n]/g, " "),
  );

  for (const match of contentWithoutCode.matchAll(pattern)) {
    const level = Number(match[1] ?? match[3]?.length) as 2 | 3;
    const text = stripMarkup(match[2] ?? match[4] ?? "");
    if (!text) continue;

    const baseId = articleHeadingId(text);
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    headings.push({ id: count ? `${baseId}-${count + 1}` : baseId, text, level });
  }

  return headings;
}

export function rehypeBlogHeadingIds(headings: ArticleHeading[]) {
  return (tree: Root) => {
    let headingIndex = 0;
    const visit = (nodes: RootContent[]) => {
      for (const node of nodes) {
        if (node.type === "element") {
          const element = node as Element;
          if (element.tagName === "h2" || element.tagName === "h3") {
            const heading = headings[headingIndex];
            headingIndex += 1;
            if (heading) element.properties.id = heading.id;
          }
        }
        if ("children" in node) visit(node.children as RootContent[]);
      }
    };

    visit(tree.children);
  };
}
