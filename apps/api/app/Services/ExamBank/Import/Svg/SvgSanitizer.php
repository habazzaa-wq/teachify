<?php

namespace App\Services\ExamBank\Import\Svg;

/**
 * Whitelist-based SVG sanitizer for teacher-imported diagram markup.
 *
 * Accepts only a strict geometric subset: svg/g/line/polyline/polygon/
 * rect/circle/ellipse/path/text/tspan. All event handlers, external
 * references, scripts, foreignObject, and unknown attributes are stripped.
 * Text content is HTML-escaped on output.
 */
final class SvgSanitizer
{
    private const ALLOWED_TAGS = [
        'svg', 'g', 'line', 'polyline', 'polygon', 'rect', 'circle',
        'ellipse', 'path', 'text', 'tspan', 'title',
    ];

    private const ALLOWED_ATTRS = [
        'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
        'width', 'height', 'points', 'd',
        'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
        'stroke-linejoin', 'opacity', 'fill-opacity', 'font-size', 'font-family',
        'font-weight', 'text-anchor', 'dominant-baseline', 'direction',
        'transform', 'viewbox', 'viewBox', 'xmlns', 'class',
    ];

    /**
     * @return string|null sanitized SVG or null when input is unusable
     */
    public function sanitize(string $svg): ?string
    {
        $svg = trim($svg);

        if ($svg === '' || ! str_contains($svg, '<svg')) {
            return null;
        }

        // Reject dangerous constructs outright before DOM parsing.
        if (preg_match('/<\s*(script|foreignObject|iframe|object|embed|use|image|animate|set)\b/i', $svg)
            || preg_match('/javascript\s*:/i', $svg)
            || preg_match('/data\s*:\s*text\/html/i', $svg)) {
            return null;
        }

        $dom = new \DOMDocument();

        libxml_use_internal_errors(true);
        $loaded = $dom->loadXML(
            '<?xml version="1.0" encoding="UTF-8"?>'.$this->closeVoidElements($svg),
            LIBXML_NONET | LIBXML_NOENT,
        );
        libxml_clear_errors();

        if (! $loaded) {
            return null;
        }

        $root = $dom->documentElement;

        if ($root === null || strtolower($root->nodeName) !== 'svg') {
            return null;
        }

        $this->sanitizeNode($root);

        $output = $dom->saveXML($root, LIBXML_NOEMPTYTAG);

        if ($output === false) {
            return null;
        }

        // Collapse the empty-tag expansion back to self-closing form.
        $output = str_replace('></line>', '/>', $output);
        $output = preg_replace('/><\/(line|rect|circle|ellipse|path|polyline|polygon)>/', '/>', $output) ?? $output;

        return $output;
    }

    private function sanitizeNode(\DOMElement $element): void
    {
        // Remove disallowed child elements first (deepest-first iteration).
        foreach (iterator_to_array($element->childNodes) as $child) {
            if ($child instanceof \DOMElement) {
                if (! in_array(strtolower($child->nodeName), self::ALLOWED_TAGS, true)) {
                    $child->parentNode?->removeChild($child);

                    continue;
                }

                $this->sanitizeNode($child);
            } elseif ($child instanceof \DOMText || $child instanceof \DOMCDATASection) {
                // Text nodes are fine; saveXML escapes them.
                continue;
            } elseif ($child instanceof \DOMComment || $child instanceof \DOMProcessingInstruction) {
                $child->parentNode?->removeChild($child);
            }
        }

        // Strip attributes not on the whitelist.
        foreach (iterator_to_array($element->attributes) as $attribute) {
            $name = strtolower($attribute->nodeName);

            if (! in_array($name, self::ALLOWED_ATTRS, true)) {
                $element->removeAttributeNode($attribute);

                continue;
            }

            // Defense-in-depth: no URL-ish or handler values even on whitelisted attrs.
            $value = trim($attribute->nodeValue ?? '');

            if (preg_match('/(javascript|vbscript|data\s*:|\bon\w+\s*=)/i', $value)) {
                $element->removeAttributeNode($attribute);
            }
        }
    }

    /**
     * XML requires explicit close tags where HTML tolerated <line> etc.
     * Pre-process common void SVG elements to self-closing so loadXML succeeds
     * on hand-authored fragments.
     */
    private function closeVoidElements(string $svg): string
    {
        return preg_replace_callback(
            '/<(line|rect|circle|ellipse|path|polyline|polygon)\b([^>]*?)\s*\/?>/i',
            fn (array $m): string => '<'.strtolower($m[1]).rtrim(' '.trim(preg_replace('/\s+/', ' ', $m[2]) ?? '')).'/>',
            $svg,
        ) ?? $svg;
    }
}
