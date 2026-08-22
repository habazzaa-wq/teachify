<?php

namespace App\Services\ExamBank\Import;

/**
 * Conservative text → LaTeX reconstruction.
 *
 * OCR output rarely contains structured math; this converter recognizes
 * common, unambiguous patterns (symbol maps, powers/indices, roots, simple
 * fractions and full equations) and converts them to LaTeX with a per-segment
 * confidence. Anything below the confidence floor is left as plain text —
 * the pipeline never invents math it cannot see clearly; the teacher review
 * workspace is where corrections happen.
 */
final class MathConverter
{
    private const CONFIDENCE_FLOOR = 0.55;

    /** @var array<string, string> single-character / token LaTeX map */
    private const SYMBOLS = [
        '×' => '\\times',
        '÷' => '\\div',
        '±' => '\\pm',
        '∓' => '\\mp',
        '≤' => '\\leq',
        '≥' => '\\geq',
        '≠' => '\\neq',
        '≈' => '\\approx',
        '∞' => '\\infty',
        '√' => '\\sqrt',
        '∑' => '\\sum',
        '∏' => '\\prod',
        '∫' => '\\int',
        '°' => '^{\\circ}',
        '∠' => '\\angle',
        '△' => '\\triangle',
        '⊥' => '\\perp',
        '∥' => '\\parallel',
        '∈' => '\\in',
        '∉' => '\\notin',
        '∪' => '\\cup',
        '∩' => '\\cap',
        '⊂' => '\\subset',
        '∴' => '\\therefore',
        '∵' => '\\because',
        '→' => '\\to',
        '⇒' => '\\Rightarrow',
        'α' => '\\alpha',
        'β' => '\\beta',
        'γ' => '\\gamma',
        'δ' => '\\delta',
        'θ' => '\\theta',
        'λ' => '\\lambda',
        'μ' => '\\mu',
        'π' => '\\pi',
        'ρ' => '\\rho',
        'σ' => '\\sigma',
        'φ' => '\\phi',
        'ω' => '\\omega',
        'Δ' => '\\Delta',
        'Ω' => '\\Omega',
    ];

    /**
     * How mathematical a piece of text looks (0..1).
     */
    public function mathDensity(string $text): float
    {
        if ($text === '') {
            return 0.0;
        }

        $mathChars = preg_match_all('/[0-9+\-*\/=^_()<>\[\]{}|.,:]/u', $text);
        $symbols = 0;
        foreach (array_keys(self::SYMBOLS) as $symbol) {
            $symbols += substr_count($text, $symbol);
        }
        $arabic = preg_match_all('/[\x{0600}-\x{06FF}]/u', $text);
        $latinWords = preg_match_all('/[A-Za-z]{3,}/u', $text);

        $length = mb_strlen($text);
        $density = min(1.0, ($mathChars + 2 * $symbols) / max(4, $length));

        // Heavy Arabic or long Latin words strongly indicate prose.
        $density *= max(0.15, 1 - ($arabic / max(4, $length)) * 1.6);

        if ($latinWords > 2) {
            $density *= 0.5;
        }

        return round($density, 3);
    }

    /**
     * Whether a whole line should become a display equation block.
     *
     * @param  list<string> $segments
     */
    public function isDisplayEquation(string $text): bool
    {
        return str_contains($text, '=')
            && ! str_contains($text, "\n")
            && $this->mathDensity($text) >= 0.45
            && preg_match('/[\p{L}\x{0600}-\x{06FF}]{6,}/u', preg_replace('/(\\\\[a-zA-Z]+|[a-zA-Z])+/u', '', $text) ?? $text) !== 1;
    }

    /**
     * Converts a text segment to LaTeX when confident enough.
     *
     * @return array{latex: string, confidence: float}|null null when the segment is not confidently math
     */
    public function toLatex(string $text): ?array
    {
        $trimmed = trim($text);

        if ($trimmed === '' || ! $this->looksMathyEnough($trimmed)) {
            return null;
        }

        $confidence = 0.45;

        // 1. Escape LaTeX specials that we do not interpret structurally.
        $out = $this->escapeAndMapSymbols($trimmed, $confidence);

        // 2. Roots: √(expr), √expr, \sqrt already mapped prefix.
        $out = $this->convertRoots($out, $confidence);

        // 3. Powers and subscripts: x^2, x^{n+1}, a_1, a_{ij}.
        $out = $this->convertScripts($out, $confidence);

        // 4. Simple numeric fractions: a/b where both sides are short atoms.
        $out = $this->convertFractions($out, $confidence);

        // 5. Implicit multiplication cleanup for common cases like 2\pi.
        $out = str_replace(['\\left', '\\right'], '', $out);

        if (! $this->balancedBraces($out)) {
            $confidence *= 0.4;
        }

        $confidence = round(min(0.95, $confidence), 3);

        if ($confidence < self::CONFIDENCE_FLOOR) {
            return null;
        }

        return ['latex' => trim($out), 'confidence' => $confidence];
    }

    /**
     * Splits an RTL/LTR mixed line into ordered runs of prose and math.
     *
     * Math runs are maximal chunks dominated by math characters/symbols;
     * they are emitted as inline_math only when the LaTeX conversion is
     * confident enough, otherwise they stay plain text. Prose keeps its
     * original wording untouched.
     *
     * @return list<array{kind: 'text', text: string}|array{kind: 'inline_math', latex: string, confidence: float}>
     */
    public function segmentLine(string $lineText): array
    {
        // Split boundaries: whitespace around math-heavy tokens.
        $parts = preg_split('/(\s+)/u', $lineText, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [$lineText];

        $segments = [];
        $bufferProse = '';
        $bufferMath = [];

        $flushProse = function () use (&$segments, &$bufferProse): void {
            $value = trim($bufferProse);
            if ($value !== '') {
                $segments[] = ['kind' => 'text', 'text' => $value];
            }
            $bufferProse = '';
        };

        $flushMath = function () use (&$segments, &$bufferMath): void {
            if ($bufferMath === []) {
                return;
            }

            $value = implode(' ', $bufferMath);
            $converted = $this->toLatex($value);

            if ($converted !== null) {
                $segments[] = [
                    'kind' => 'inline_math',
                    'latex' => $converted['latex'],
                    'confidence' => $converted['confidence'],
                ];
            } else {
                // Honest fallback: keep the raw OCR text instead of inventing math.
                $segments[] = ['kind' => 'text', 'text' => $value];
            }

            $bufferMath = [];
        };

        foreach ($parts as $part) {
            if (trim($part) === '') {
                continue; // whitespace normalized at render time
            }

            $density = $this->mathDensity($part);
            $isNumberish = preg_match('/^[\d.,:%٪]+$/', $part) === 1;
            $isSymbolic = preg_match('/^[=+\-<>≤≥≠≈±×÷]+$/u', $part) === 1;

            if ($density >= 0.55 || $isSymbolic || ($isNumberish && $density >= 0.3)) {
                $flushProse();
                $bufferMath[] = $part;
            } else {
                $flushMath();
                $bufferProse .= ($bufferProse !== '' ? ' ' : '').$part;
            }
        }

        $flushProse();
        $flushMath();

        return $segments;
    }

    // ════════════════════════════════════════════════════════════

    private function looksMathyEnough(string $text): bool
    {
        $hasStructure = preg_match('/(=|\^|_|√|\\\\|\(|\[)/u', $text) === 1
            || preg_match('/[×÷±≤≥≠≈∞∑∫°Δθπαβ]/u', $text) === 1
            || preg_match('/\d\s*[\+\-\*\/]\s*\d/u', $text) === 1;

        return $hasStructure && mb_strlen($text) <= 400;
    }

    private function escapeAndMapSymbols(string $text, float &$confidence): string
    {
        $confidence += 0.08;

        $replaced = str_replace(
            array_keys(self::SYMBOLS),
            array_values(self::SYMBOLS),
            $text,
        );

        // Escape remaining raw LaTeX specials (%, #, &, $).
        $replaced = preg_replace('/(?<!\\\\)([%#&$])/', '\\\\$1', $replaced) ?? $replaced;

        return $replaced;
    }

    private function convertRoots(string $text, float &$confidence): string
    {
        // √ followed by parenthesized expression or a simple atom.
        $count = 0;
        $result = preg_replace_callback(
            '/(?:\\\\sqrt|√)\s*(?:\(([^()]+)\)|([A-Za-z0-9.\-]+))/u',
            function (array $m) use (&$count): string {
                $count++;
                $inner = $m[1] ?? $m[2];

                return '\\sqrt{'.trim($inner).'}';
            },
            $text,
        );

        if ($result !== null && $count > 0) {
            $confidence += 0.10 * min(3, $count);
            return $result;
        }

        return $text;
    }

    private function convertScripts(string $text, float &$confidence): string
    {
        $powerCount = 0;
        $indexCount = 0;

        $result = preg_replace_callback(
            '/([A-Za-z0-9\)\]])\s*\^\s*\(([^()]+)\)/u',
            fn (array $m): string => $m[1].'^{'.trim($m[2]).'}',
            $text,
        ) ?? $text;

        $result = preg_replace_callback(
            '/([A-Za-z0-9\)\]])\s*\^\s*(-?[A-Za-z0-9])/u',
            function (array $m) use (&$powerCount): string {
                $powerCount++;
                return $m[1].'^{'.$m[2].'}';
            },
            $result,
        ) ?? $result;

        $result = preg_replace_callback(
            '/([A-Za-z])\s*_\s*\(([^()]+)\)/u',
            fn (array $m): string => $m[1].'_{'.trim($m[2]).'}',
            $result,
        ) ?? $result;

        $result = preg_replace_callback(
            '/([A-Za-z])\s*_\s*([A-Za-z0-9])/u',
            function (array $m) use (&$indexCount): string {
                $indexCount++;
                return $m[1].'_{'.$m[2].'}';
            },
            $result,
        ) ?? $result;

        $confidence += 0.06 * min(4, $powerCount + $indexCount);

        return $result;
    }

    private function convertFractions(string $text, float &$confidence): string
    {
        // Only convert unambiguous short atoms on both sides: 3/4, x/2, (a+b)/2.
        $converted = 0;
        $result = preg_replace_callback(
            '/(?<![\w}])(?:\(([A-Za-z0-9+\-\s.*]{1,12})\)|([\d.]+'.'|[A-Za-z]))\s*\/\s*(?:\(([A-Za-z0-9+\-\s.*]{1,12})\)|([\d.]+|[A-Za-z]))/u',
            function (array $m) use (&$converted): string {
                $numerator = $m[1] ?? $m[2];
                $denominator = $m[3] ?? $m[4];

                if (trim($numerator) === '' || trim($denominator) === '') {
                    return $m[0];
                }

                // Skip dates and ratios that look like times (12:30 style never reaches here).
                $converted++;

                return '\\frac{'.trim($numerator).'}{'.trim($denominator).'}';
            },
            $text,
        );

        if ($result !== null && $converted > 0) {
            $confidence += 0.07 * min(3, $converted);
            return $result;
        }

        return $text;
    }

    private function balancedBraces(string $latex): bool
    {
        $depth = 0;
        $length = strlen($latex);

        for ($i = 0; $i < $length; $i++) {
            $char = $latex[$i];
            if ($char === '\\' && $i + 1 < $length) {
                $i++;
                continue;
            }
            if ($char === '{') {
                $depth++;
            } elseif ($char === '}') {
                $depth--;
                if ($depth < 0) {
                    return false;
                }
            }
        }

        return $depth === 0;
    }
}
