import type { JsonLdObject } from "@/lib/seo/jsonld";

/**
 * Renders JSON-LD structured data. `<` is escaped so an untrusted string in
 * the payload can never terminate the script tag.
 */
export function JsonLd({ data }: { data: JsonLdObject }) {
  const html = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
