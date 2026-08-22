<?php

namespace App\Services\ExamBank\Import\Vision;

use App\Services\ExamBank\Import\Svg\SvgSanitizer;

final class VisionDocumentNormalizer
{
    private const MAX_BLOCKS = 120;
    private const ALLOWED_TYPES = ['paragraph','heading','math','diagram','list','table','image','chemical_equation','callout','separator','unresolved_visual'];

    public function __construct(private readonly SvgSanitizer $sanitizer) {}

    public function normalize(array $raw): array
    {
        $doc = $this->coerceRoot($raw);
        $blocks = [];
        foreach (array_slice($doc['blocks'] ?? [], 0, self::MAX_BLOCKS) as $block) {
            if (!is_array($block)) continue;
            $type = $block['type'] ?? null;
            if (!in_array($type, self::ALLOWED_TYPES, true)) continue;
            $normalized = $this->normalizeBlock($type, $block);
            if ($normalized !== null) $blocks[] = $normalized;
        }
        if ($blocks === []) {
            $blocks[] = ['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'محتوى غير مستخرج — راجع الصورة الأصلية.']]];
        }
        return [
            'version' => 1,
            'direction' => in_array($doc['direction'] ?? null, ['rtl','ltr'], true) ? $doc['direction'] : 'rtl',
            'language' => in_array($doc['language'] ?? null, ['ar','en','mixed'], true) ? $doc['language'] : 'ar',
            'blocks' => $blocks,
        ];
    }

    private function coerceRoot(array $raw): array
    {
        if (isset($raw['document']) && is_array($raw['document'])) $raw = $raw['document'];
        if (isset($raw['content_document']) && is_array($raw['content_document'])) $raw = $raw['content_document'];
        return $raw;
    }

    private function normalizeBlock(string $type, array $block): ?array
    {
        return match ($type) {
            'paragraph' => $this->normParagraph($block),
            'heading' => $this->normHeading($block),
            'math' => $this->normMath($block),
            'diagram' => $this->normDiagram($block),
            'list' => $this->normList($block),
            'table' => $this->normTable($block),
            'image' => $this->normImage($block),
            'chemical_equation' => $this->normChemical($block),
            'callout' => $this->normCallout($block),
            'separator' => ['type' => 'separator'],
            'unresolved_visual' => $this->normUnresolved($block),
            default => null,
        };
    }

    private function normParagraph(array $b): ?array
    {
        $runs = $this->normRuns($b['runs'] ?? null, $b['text'] ?? null);
        return $runs === [] ? null : ['type' => 'paragraph', 'runs' => $runs];
    }

    private function normHeading(array $b): ?array
    {
        $level = in_array($b['level'] ?? null, [2,3], true) ? (int)$b['level'] : 2;
        $runs = $this->normRuns($b['runs'] ?? null, $b['text'] ?? null);
        if ($runs === []) return null;
        return ['type' => 'heading', 'level' => $level, 'runs' => $runs];
    }

    private function normMath(array $b): ?array
    {
        $latex = trim((string)($b['latex'] ?? $b['content'] ?? ''));
        if ($latex === '') return null;
        if (mb_strlen($latex) > 2000) $latex = mb_substr($latex, 0, 2000);
        return ['type' => 'math', 'latex' => $latex, 'display' => (bool)($b['display'] ?? true)];
    }

    private function normDiagram(array $b): ?array
    {
        $svg = trim((string)($b['svg'] ?? ''));
        if ($svg === '') return ['type' => 'unresolved_visual', 'reason' => 'svg_generation_failed', 'description' => $b['description'] ?? 'رسم غير مستخرج'];
        if (strlen($svg) > 65536) return ['type' => 'unresolved_visual', 'reason' => 'svg_too_large'];
        $sanitized = $this->sanitizer->sanitize($svg);
        if ($sanitized === null) return ['type' => 'unresolved_visual', 'reason' => 'unsafe_svg'];
        return ['type' => 'diagram', 'format' => 'svg', 'svg' => $sanitized];
    }

    private function normList(array $b): ?array
    {
        $items = $b['items'] ?? [];
        if (!is_array($items) || $items === []) return null;
        $norm = [];
        foreach ($items as $item) {
            if (!is_array($item)) continue;
            $runs = $this->normRuns($item['runs'] ?? null, $item['text'] ?? null);
            if ($runs === []) continue;
            $norm[] = ['marker' => trim((string)($item['marker'] ?? '-')), 'runs' => $runs];
        }
        return $norm === [] ? null : ['type' => 'list', 'ordered' => (bool)($b['ordered'] ?? false), 'items' => $norm];
    }

    private function normTable(array $b): ?array
    {
        $rows = $b['rows'] ?? [];
        if (!is_array($rows) || $rows === []) return null;
        $normRows = [];
        foreach (array_slice($rows, 0, 60) as $row) {
            if (!is_array($row)) continue;
            $normRows[] = array_map(fn($c) => trim((string)$c), array_values($row));
        }
        if ($normRows === []) return null;
        $colCount = count($normRows[0]);
        foreach ($normRows as $r) if (count($r) !== $colCount) return null;
        return ['type' => 'table', 'rows' => $normRows, 'headerRow' => (bool)($b['headerRow'] ?? false)];
    }

    private function normImage(array $b): ?array
    {
        $src = trim((string)($b['src'] ?? $b['url'] ?? ''));
        if ($src === '' || preg_match('/^\s*javascript:/i', $src)) return null;
        if (strlen($src) > 2048) return null;
        return ['type' => 'image', 'src' => $src, 'alt' => $b['alt'] ?? null, 'caption' => $b['caption'] ?? null];
    }

    private function normChemical(array $b): ?array
    {
        $content = trim((string)($b['content'] ?? $b['latex'] ?? ''));
        if ($content === '') return null;
        if (mb_strlen($content) > 2000) $content = mb_substr($content, 0, 2000);
        return ['type' => 'chemical_equation', 'content' => $content];
    }

    private function normCallout(array $b): ?array
    {
        $runs = isset($b['runs']) ? $this->normRuns($b['runs'], null) : [];
        $text = trim((string)($b['text'] ?? ''));
        if ($runs !== []) return ['type' => 'callout', 'runs' => $runs];
        if ($text !== '') return ['type' => 'callout', 'text' => $text];
        return null;
    }

    private function normUnresolved(array $b): array
    {
        return [
            'type' => 'unresolved_visual',
            'description' => trim((string)($b['description'] ?? $b['reason'] ?? 'عنصر بصري غير مستخرج')),
            'reason' => $b['reason'] ?? 'complex_or_unclear_diagram',
        ];
    }

    private function normRuns(?array $runs, ?string $fallbackText): array
    {
        if (is_array($runs) && $runs !== []) {
            $out = [];
            foreach ($runs as $run) {
                if (!is_array($run)) continue;
                $kind = $run['kind'] ?? null;
                if ($kind === 'inline_math') {
                    $latex = trim((string)($run['latex'] ?? ''));
                    if ($latex !== '') $out[] = ['kind' => 'inline_math', 'latex' => mb_substr($latex, 0, 500)];
                } elseif ($kind === 'text' || isset($run['text'])) {
                    $text = trim((string)($run['text'] ?? ''));
                    if ($text !== '') $out[] = ['kind' => 'text', 'text' => mb_substr($text, 0, 2000)];
                }
            }
            if ($out !== []) return $out;
        }
        if ($fallbackText !== null && trim($fallbackText) !== '') {
            return [['kind' => 'text', 'text' => mb_substr(trim($fallbackText), 0, 4000)]];
        }
        return [];
    }
}
