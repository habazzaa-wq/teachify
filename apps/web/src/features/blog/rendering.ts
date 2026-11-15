import type { Root, RootContent } from "hast";
import { defaultSchema } from "rehype-sanitize";

const alignments = ["left", "center", "right", "justify"] as const;
const alignedElements = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6"]);
const safeColor = /^#[\da-f]{6}$/i;
const safeLineHeights = new Set(["1.25", "1.5", "1.8", "2"]);
const safeFontFamilies = new Set(["Arial", "Cairo", "Georgia", "Tahoma", "Times New Roman", "Verdana"]);

export const blogSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["dataColor", safeColor],
      ["dataFontSize", /^([1-4]?\d|50)px$/],
      ["dataFontFamily", [...safeFontFamilies]],
      ["dataLineHeight", [...safeLineHeights]],
    ],
    mark: [
      ...(defaultSchema.attributes?.mark ?? []),
      ["dataColor", safeColor],
    ],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      ["width", /^[1-9]\d{0,3}$/],
      ["height", /^[1-9]\d{0,3}$/],
    ],
    p: [...(defaultSchema.attributes?.p ?? []), ["align", ...alignments]],
    h1: [...(defaultSchema.attributes?.h1 ?? []), ["align", ...alignments]],
    h2: [...(defaultSchema.attributes?.h2 ?? []), ["align", ...alignments]],
    h3: [...(defaultSchema.attributes?.h3 ?? []), ["align", ...alignments]],
    h4: [...(defaultSchema.attributes?.h4 ?? []), ["align", ...alignments]],
    h5: [...(defaultSchema.attributes?.h5 ?? []), ["align", ...alignments]],
    h6: [...(defaultSchema.attributes?.h6 ?? []), ["align", ...alignments]],
  },
};

export function rehypeBlogTextAlignment() {
  return (tree: Root) => {
    const visit = (nodes: RootContent[]) => {
      for (const node of nodes) {
        if (node.type === "element") {
          const declarations = typeof node.properties.style === "string"
            ? Object.fromEntries(node.properties.style.split(";").map((declaration) => {
                const separator = declaration.indexOf(":");
                return separator < 0
                  ? ["", ""]
                  : [declaration.slice(0, separator).trim().toLowerCase(), declaration.slice(separator + 1).trim()];
              }))
            : {};

          if (alignedElements.has(node.tagName)) {
            const alignment = declarations["text-align"]?.toLowerCase();
            if (alignment === "left" || alignment === "center" || alignment === "right" || alignment === "justify") {
              node.properties.align = alignment;
            }
          }

          const color = declarations.color;
          const highlight = declarations["background-color"];
          if (node.tagName === "span" && color && safeColor.test(color)) {
            node.properties.dataColor = color;
          }
          if (node.tagName === "mark" && highlight && safeColor.test(highlight)) {
            node.properties.dataColor = highlight;
          }

          if (node.tagName === "span") {
            const fontSize = declarations["font-size"];
            if (fontSize && /^([1-4]?\d|50)px$/.test(fontSize)) {
              node.properties.dataFontSize = fontSize;
            }
            const lineHeight = declarations["line-height"];
            if (lineHeight && safeLineHeights.has(lineHeight)) {
              node.properties.dataLineHeight = lineHeight;
            }
            const family = declarations["font-family"]?.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
            if (family && safeFontFamilies.has(family)) node.properties.dataFontFamily = family;
          }

          delete node.properties.style;
        }
        if ("children" in node) visit(node.children as RootContent[]);
      }
    };

    visit(tree.children);
  };
}

export function rehypeBlogSafeInlineStyles() {
  return (tree: Root) => {
    const visit = (nodes: RootContent[]) => {
      for (const node of nodes) {
        if (node.type === "element") {
          const styles: string[] = [];
          const color = node.properties.dataColor;
          const fontSize = node.properties.dataFontSize;
          const fontFamily = node.properties.dataFontFamily;
          const lineHeight = node.properties.dataLineHeight;

          if (typeof color === "string" && safeColor.test(color)) {
            styles.push(`${node.tagName === "mark" ? "background-color" : "color"}: ${color}`);
          }
          if (node.tagName === "span" && typeof fontSize === "string" && /^([1-4]?\d|50)px$/.test(fontSize)) {
            styles.push(`font-size: ${fontSize}`);
          }
          if (node.tagName === "span" && typeof fontFamily === "string" && safeFontFamilies.has(fontFamily)) {
            styles.push(`font-family: ${fontFamily}`);
          }
          if (node.tagName === "span" && typeof lineHeight === "string" && safeLineHeights.has(lineHeight)) {
            styles.push(`line-height: ${lineHeight}`);
          }

          delete node.properties.dataColor;
          delete node.properties.dataFontSize;
          delete node.properties.dataFontFamily;
          delete node.properties.dataLineHeight;
          if (styles.length > 0) node.properties.style = styles.join("; ");
        }
        if ("children" in node) visit(node.children as RootContent[]);
      }
    };

    visit(tree.children);
  };
}
