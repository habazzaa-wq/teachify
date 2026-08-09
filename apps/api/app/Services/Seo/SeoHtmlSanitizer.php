<?php

namespace App\Services\Seo;

use DOMDocument;
use DOMElement;
use DOMXPath;

/**
 * Whitelist-based HTML sanitizer for teacher-authored SEO content.
 *
 * Treats all input as untrusted. Removes scripts, event handlers, dangerous
 * embeds, `javascript:` URLs and any attribute/tag outside the allowlist.
 * Used on the backend for both `html` and `markdown` content before storage —
 * the frontend renderer is never the sole safety boundary.
 */
class SeoHtmlSanitizer
{
    /** @var array<string, array{attrs: array<int, string>, protocols: array<int, string>}> */
    private const ALLOWED = [
        'h1' => ['attrs' => [], 'protocols' => []],
        'h2' => ['attrs' => [], 'protocols' => []],
        'h3' => ['attrs' => [], 'protocols' => []],
        'h4' => ['attrs' => [], 'protocols' => []],
        'h5' => ['attrs' => [], 'protocols' => []],
        'h6' => ['attrs' => [], 'protocols' => []],
        'p' => ['attrs' => [], 'protocols' => []],
        'br' => ['attrs' => [], 'protocols' => []],
        'hr' => ['attrs' => [], 'protocols' => []],
        'strong' => ['attrs' => [], 'protocols' => []],
        'b' => ['attrs' => [], 'protocols' => []],
        'em' => ['attrs' => [], 'protocols' => []],
        'i' => ['attrs' => [], 'protocols' => []],
        'u' => ['attrs' => [], 'protocols' => []],
        's' => ['attrs' => [], 'protocols' => []],
        'ul' => ['attrs' => [], 'protocols' => []],
        'ol' => ['attrs' => [], 'protocols' => []],
        'li' => ['attrs' => [], 'protocols' => []],
        'blockquote' => ['attrs' => [], 'protocols' => []],
        'pre' => ['attrs' => ['class'], 'protocols' => []],
        'code' => ['attrs' => ['class'], 'protocols' => []],
        'figure' => ['attrs' => [], 'protocols' => []],
        'figcaption' => ['attrs' => [], 'protocols' => []],
        'caption' => ['attrs' => [], 'protocols' => []],
        'table' => ['attrs' => ['summary'], 'protocols' => []],
        'thead' => ['attrs' => [], 'protocols' => []],
        'tbody' => ['attrs' => [], 'protocols' => []],
        'tfoot' => ['attrs' => [], 'protocols' => []],
        'tr' => ['attrs' => [], 'protocols' => []],
        'th' => ['attrs' => ['colspan', 'rowspan', 'scope'], 'protocols' => []],
        'td' => ['attrs' => ['colspan', 'rowspan'], 'protocols' => []],
        'details' => ['attrs' => [], 'protocols' => []],
        'summary' => ['attrs' => [], 'protocols' => []],
        'span' => ['attrs' => ['class'], 'protocols' => []],
        'div' => ['attrs' => ['class'], 'protocols' => []],
        'section' => ['attrs' => ['class'], 'protocols' => []],
        'article' => ['attrs' => ['class'], 'protocols' => []],
        'a' => ['attrs' => ['href', 'title', 'rel', 'target'], 'protocols' => ['href' => ['http', 'https', 'mailto', 'tel', 'relative']]],
        'img' => ['attrs' => ['src', 'alt', 'width', 'height', 'title', 'loading', 'decoding'], 'protocols' => ['src' => ['http', 'https', 'relative']]],
    ];

    /** @var list<string> */
    private const BLOCKED_TAGS = [
        'script', 'style', 'iframe', 'object', 'embed', 'applet', 'form', 'input',
        'button', 'textarea', 'select', 'option', 'link', 'meta', 'base', 'svg',
        'math', 'template', 'frame', 'frameset', 'noscript', 'audio', 'video',
        'source', 'track', 'canvas', 'title', 'head', 'body',
    ];

    public function sanitize(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return $html;
        }

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);

        $wrapped = '<?xml encoding="utf-8" ?>' . $html;
        $loaded = $dom->loadHTML($wrapped, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        if (! $loaded) {
            // Fall back to a hard text-only strip when the input is not parseable.
            return $this->stripAll($html);
        }

        $xpath = new DOMXPath($dom);

        // Remove dangerous tags entirely (including their contents).
        foreach ($xpath->query('//*') as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }
            if (in_array(strtolower($node->nodeName), self::BLOCKED_TAGS, true)) {
                $node->parentNode?->removeChild($node);
            }
        }

        // Sanitize remaining elements: allowed attrs + safe protocols + rel.
        foreach ($xpath->query('//*') as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }
            $tag = strtolower($node->nodeName);

            if (! array_key_exists($tag, self::ALLOWED)) {
                $node->parentNode?->removeChild($node);
                continue;
            }

            $rules = self::ALLOWED[$tag];
            $allowedAttrs = array_flip($rules['attrs']);

            foreach (iterator_to_array($node->attributes) as $attr) {
                /** @var \DOMAttr $attr */
                $name = strtolower($attr->nodeName);
                $value = $attr->value;

                if (! isset($allowedAttrs[$name])) {
                    $node->removeAttribute($attr->nodeName);
                    continue;
                }

                if (($name === 'href' || $name === 'src') && ! $this->safeUrl($value, $rules['protocols'][$name] ?? [])) {
                    $node->removeAttribute($attr->nodeName);
                    continue;
                }
            }

            if ($tag === 'a') {
                $this->hardenAnchor($node);
            }
        }

        $cleaned = $dom->saveHTML();
        // saveHTML() may re-add an XML declaration comment from the wrapper.
        $cleaned = preg_replace('/^<\?xml encoding="utf-8"\s*\?>\s*/', '', (string) $cleaned);

        // saveHTML() encodes non-ASCII text as numeric entities. Decode only
        // numeric references back to UTF-8 so Arabic content stays readable in
        // the database; named entities like &lt; / &amp; are left encoded to
        // keep the output safe to render as HTML later.
        $cleaned = $this->decodeNumericEntities((string) $cleaned);

        return $cleaned === '' ? null : trim($cleaned);
    }

    private function decodeNumericEntities(string $html): string
    {
        return preg_replace_callback(
            '/&#(?:x[0-9a-fA-F]+|\d+);/',
            fn (array $m) => html_entity_decode($m[0], ENT_QUOTES | ENT_XML1, 'UTF-8'),
            $html,
        ) ?? $html;
    }

    /**
     * @param array<int, string> $allowedProtocols
     */
    private function safeUrl(string $url, array $allowedProtocols): bool
    {
        $url = trim($url);
        if ($url === '' || $url === '#') {
            return true;
        }

        if (preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', $url, $m)) {
            $protocol = strtolower(rtrim($m[0], ':'));
            return in_array($protocol, $allowedProtocols, true);
        }

        // No scheme → treated as a relative/rooted URL.
        return in_array('relative', $allowedProtocols, true);
    }

    private function hardenAnchor(DOMElement $node): void
    {
        $href = $node->getAttribute('href');
        if (str_starts_with($href, '#') || ! preg_match('/^https?:\/\//i', $href)) {
            return;
        }

        $rel = preg_split('/\s+/', trim($node->getAttribute('rel')) ?: '', -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $rel = array_values(array_unique(array_merge($rel, ['noopener', 'nofollow'])));
        $node->setAttribute('rel', implode(' ', $rel));

        if (! in_array($node->getAttribute('target'), ['_blank'], true)) {
            $node->removeAttribute('target');
        }
    }

    private function stripAll(string $html): string
    {
        $withoutTags = preg_replace('/<[^>]*>/', '', $html) ?? '';
        return trim(html_entity_decode($withoutTags, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
}
