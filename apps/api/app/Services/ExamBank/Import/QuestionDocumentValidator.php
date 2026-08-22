<?php

namespace App\Services\ExamBank\Import;

use Illuminate\Support\Str;

/**
 * Validates structured question documents (content_document JSON) against the
 * version-1 contract shared with the frontend renderer.
 *
 * Used by:
 *  - the import pipeline right after DocumentComposer
 *  - QuestionController store/update when content_document is present
 *  - the review workspace "validate" action
 */
final class QuestionDocumentValidator
{
    private const MAX_BLOCKS = 120;
    private const MAX_JSON_BYTES = 131072; // 128 KB
    private const MAX_TEXT_RUN_CHARS = 4000;
    private const MAX_SVG_BYTES = 65536;
    public const SUPPORTED_VERSION = 1;

    /**
     * @return list<string> human-readable errors; empty means valid
     */
    public function validate(array $document): array
    {
        $errors = [];

        if (($document['version'] ?? null) !== self::SUPPORTED_VERSION) {
            $errors[] = 'صيغة المستند غير مدعومة. النسخة المدعومة هي '.self::SUPPORTED_VERSION.'.';

            return $errors;
        }

        if (! in_array($document['direction'] ?? null, ['rtl', 'ltr'], true)) {
            $errors[] = 'اتجاه المستند غير صالح (يجب أن يكون rtl أو ltr).';
        }

        if (! in_array($document['language'] ?? null, ['ar', 'en', 'mixed'], true)) {
            $errors[] = 'لغة المستند غير صالحة.';
        }

        $blocks = $document['blocks'] ?? null;

        if (! is_array($blocks)) {
            $errors[] = 'المستند لا يحتوي على كتل محتوى.';

            return $errors;
        }

        if ($blocks === []) {
            $errors[] = 'لا يمكن حفظ سؤال فارغ: أضف نص السؤال أو معادلة أو صورة.';

            return $errors;
        }

        if (count($blocks) > self::MAX_BLOCKS) {
            $errors[] = 'عدد كتل المحتوى يتجاوز الحد الأقصى ('.self::MAX_BLOCKS.' كتلة).';
        }

        foreach (array_values($blocks) as $index => $block) {
            $label = 'الكتلة '.($index + 1);

            if (! is_array($block)) {
                $errors[] = "$label: بنية غير صالحة.";

                continue;
            }
            if (($block['type'] ?? null) === 'legacy_image') {
                $block = ['type' => 'image', 'src' => $block['url'] ?? $block['src'] ?? '', 'alt' => $block['alt'] ?? null];
            }

            array_push($errors, ...array_map(
                fn (string $message): string => "$label: $message",
                $this->validateBlock($block),
            ));
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    public function validateJson(?string $json): array
    {
        if ($json === null || trim($json) === '') {
            return ['محتوى السؤال المنسق مطلوب.'];
        }

        if (strlen($json) > self::MAX_JSON_BYTES) {
            return ['حجم محتوى السؤال يتجاوز الحد الأقصى (128 كيلوبايت).'];
        }

        try {
            $decoded = json_decode($json, true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return ['بنية JSON غير صالحة في محتوى السؤال.'];
        }

        if (! is_array($decoded)) {
            return ['بنية JSON غير صالحة في محتوى السؤال.'];
        }

        return $this->validate($decoded);
    }

    /**
     * @param  array<string, mixed>  $block
     * @return list<string>
     */
    private function validateBlock(array $block): array
    {
        $type = $block['type'] ?? null;
        if ($type === 'legacy_image') {
            return $this->validateImage($block, true);
        }
        return match ($type) {
            'paragraph' => $this->validateRuns((array) ($block['runs'] ?? [])),
            'heading' => $this->validateHeading($block),
            'math' => $this->validateMath($block),
            'diagram' => $this->validateDiagram($block),
            'list' => $this->validateList($block),
            'table' => $this->validateTable($block),
            'image' => $this->validateImage($block, false),
            'chemical_equation' => $this->validateChemicalEquation($block),
            'callout' => $this->validateCallout($block),
            'separator' => [],
            'unresolved_visual' => $this->validateUnresolvedVisual($block),
            default => ['نوع كتلة غير معروف: '.(is_string($type) ? $type : 'غير محدد').'.'],
        };
    }

    /**
     * @return list<string>
     */
    private function validateHeading(array $block): array
    {
        $level = $block['level'] ?? null;
        if (! in_array($level, [2, 3], true)) {
            return ['مستوى العنوان يجب أن يكون 2 أو 3.'];
        }
        if (isset($block['runs']) && is_array($block['runs'])) {
            return $this->validateRuns($block['runs']);
        }
        $text = trim((string) ($block['text'] ?? ''));
        if ($text === '') return ['نص العنوان مطلوب.'];
        return [];
    }

    /**
     * @return list<string>
     */
    private function validateMath(array $block): array
    {
        $errors = [];

        $latex = trim((string) ($block['latex'] ?? ''));

        if ($latex === '') {
            $errors[] = 'كود المعادلة (LaTeX) مطلوب.';
        } elseif (mb_strlen($latex) > 2000) {
            $errors[] = 'كود المعادلة أطول من الحد المسموح (2000 حرف).';
        } elseif (($error = $this->latexBalanceError($latex)) !== null) {
            $errors[] = $error;
        }

        if (isset($block['display']) && ! is_bool($block['display'])) {
            $errors[] = 'خاصية display يجب أن تكون منطقية.';
        }

        $confidence = $block['confidence'] ?? null;

        if ($confidence !== null && (! is_numeric($confidence) || $confidence < 0 || $confidence > 1)) {
            $errors[] = 'قيمة الثقة يجب أن تكون بين 0 و 1.';
        }

        return $errors;
    }

    /**
     * Basic LaTeX delimiter balance — catches truncated conversions.
     */
    private function latexBalanceError(string $latex): ?string
    {
        foreach ([['{', '}'], ['[', ']'], ['(', ')']] as [$open, $close]) {
            // Ignore escaped braces \{ \}
            $opens = substr_count($latex, $open) - substr_count($latex, '\\'.$open);
            $closes = substr_count($latex, $close) - substr_count($latex, '\\'.$close);

            if ($opens !== $closes) {
                return 'أقواس المعادلة غير متوازنة ('.$open.$close.').';
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function validateDiagram(array $block): array
    {
        $format = $block['format'] ?? null;

        if ($format !== 'svg') {
            return ['صيغة الرسم يجب أن تكون svg.'];
        }

        $svg = (string) ($block['svg'] ?? '');

        if (trim($svg) === '') {
            return ['محتوى الرسم SVG مطلوب.'];
        }

        if (strlen($svg) > self::MAX_SVG_BYTES) {
            return ['حجم الرسم SVG يتجاوز الحد الأقصى (64 كيلوبايت).'];
        }

        if (stripos($svg, '<script') !== false || stripos($svg, 'javascript:') !== false || stripos($svg, '<foreignobject') !== false) {
            return ['محتوى الرسم يحتوي عناصر غير آمنة ولم يتم قبوله.'];
        }

        return [];
    }

    /**
     * @return list<string>
     */
    private function validateList(array $block): array
    {
        $items = $block['items'] ?? [];

        if (! is_array($items) || $items === []) {
            return ['القائمة فارغة: أضف عنصراً واحداً على الأقل.'];
        }

        $errors = [];

        foreach (array_values($items) as $index => $item) {
            if (! is_array($item)) {
                $errors[] = 'عنصر رقم '.($index + 1).' في القائمة غير صالح.';

                continue;
            }

            $errors = array_merge(
                $errors,
                array_map(
                    fn (string $message): string => 'عنصر القائمة '.($index + 1).": $message",
                    $this->validateRuns((array) ($item['runs'] ?? [])),
                ),
            );
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function validateTable(array $block): array
    {
        $rows = $block['rows'] ?? [];

        if (! is_array($rows) || count($rows) === 0) {
            return ['الجدول لا يحتوي صفوفاً.'];
        }

        if (count($rows) > 60) {
            return ['عدد صفوف الجدول يتجاوز الحد الأقصى (60 صفاً).'];
        }

        $columnCount = null;

        foreach (array_values($rows) as $rowIndex => $row) {
            if (! is_array($row)) {
                return ['صف رقم '.($rowIndex + 1).' في الجدول غير صالح.'];
            }

            $columnCount ??= count($row);

            if (count($row) !== $columnCount) {
                return ['صفوف الجدول غير متساوية في عدد الأعمدة.'];
            }
        }

        return [];
    }

    /**
     * @return list<string>
     */
    private function validateRuns(array $runs): array
    {
        $errors = [];

        $totalChars = 0;
        $hasContent = false;

        foreach ($runs as $run) {
            if (! is_array($run)) {
                $errors[] = 'جزء نصي ببنية غير صالحة.';

                continue;
            }

            match ($run['kind'] ?? null) {
                'text' => (function () use (&$totalChars, &$hasContent): void {
                    $totalChars += mb_strlen(trim((string) ($run['text'] ?? '')));
                    $hasContent = true;
                })(),
                'inline_math' => (function () use (&$hasContent, &$errors, $run): void {
                    if (trim((string) ($run['latex'] ?? '')) === '') {
                        $errors[] = 'معادلة سطرية بدون كود LaTeX.';
                    }
                    $hasContent = true;
                })(),
                default => $errors[] = 'نوع جزء نصي غير معروف.',
            };
        }

        if (! $hasContent) {
            $errors[] = 'الكتلة فارغة ولا تحتوي نصاً.';
        }

        if ($totalChars > self::MAX_TEXT_RUN_CHARS) {
            $errors[] = 'طول النص يتجاوز الحد الأقصى ('.self::MAX_TEXT_RUN_CHARS.' حرفاً).';
        }

        return $errors;
    }

    private function validateImage(array $block, bool $legacy): array
    {
        $url = trim((string) ($block['url'] ?? $block['src'] ?? ''));
        if ($url === '') {
            return ['رابط الصورة مطلوب.'];
        }
        if (strlen($url) > 2048) {
            return ['رابط الصورة طويل جداً.'];
        }
        if (preg_match('/^\s*javascript:/i', $url) || preg_match('/^\s*data:(?!image\/)/i', $url)) {
            return ['رابط الصورة غير آمن.'];
        }
        return [];
    }

    private function validateChemicalEquation(array $block): array
    {
        $content = trim((string) ($block['content'] ?? $block['latex'] ?? ''));
        if ($content === '') {
            return ['محتوى المعادلة الكيميائية مطلوب.'];
        }
        if (mb_strlen($content) > 2000) {
            return ['محتوى المعادلة الكيميائية طويل جداً.'];
        }
        return [];
    }

    private function validateCallout(array $block): array
    {
        $text = trim((string) ($block['text'] ?? ''));
        if ($text === '' && empty($block['runs'])) {
            return ['نص التنبيه مطلوب.'];
        }
        if (isset($block['runs'])) {
            return $this->validateRuns((array) $block['runs']);
        }
        return [];
    }

    private function validateUnresolvedVisual(array $block): array
    {
        if (isset($block['bounds']) && ! is_array($block['bounds'])) {
            return ['حدود العنصر البصري غير صالحة.'];
        }
        return [];
    }

    public static function normalizeLegacyBlocks(array $document): array
    {
        if (! isset($document['blocks']) || ! is_array($document['blocks'])) {
            return $document;
        }
        $document['blocks'] = array_map(function (array $block): array {
            if (($block['type'] ?? null) === 'legacy_image') {
                return [
                    'type' => 'image',
                    'src' => $block['url'] ?? $block['src'] ?? '',
                    'alt' => $block['alt'] ?? null,
                    'caption' => $block['caption'] ?? null,
                ];
            }
            return $block;
        }, $document['blocks']);
        return $document;
    }

    /**
     * Stable block id generator for composer/editor use.
     */
    public static function newBlockId(): string
    {
        return 'blk_'.Str::lower(Str::random(10));
    }
}
