<?php

namespace App\Services\ExamBank\Import\Ocr;

use InvalidArgumentException;

/**
 * Parses Tesseract TSV output into word records.
 *
 * TSV columns: level, page_num, block_num, par_num, line_num, word_num,
 * left, top, width, height, conf, text. Only level-5 rows (word) are kept.
 */
final class TsvParser
{
    public static function parse(string $tsv): OcrWordSet
    {
        $lines = preg_split('/\r?\n/', $tsv) ?: [];
        if ($lines === []) {
            throw new InvalidArgumentException('Empty TSV payload.');
        }

        $header = str_getcsv(array_shift($lines), "\t");
        $index = array_flip($header);

        $words = [];
        $confidenceSum = 0;
        $confidenceCount = 0;
        $maxRight = 0;
        $maxBottom = 0;

        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }

            $cols = str_getcsv($line, "\t");
            if (count($cols) < 12) {
                continue;
            }

            $level = (int) ($cols[$index['level']] ?? 0);
            if ($level !== 5) {
                continue;
            }

            $text = trim($cols[$index['text']] ?? '');
            if ($text === '') {
                continue;
            }

            $left = (float) ($cols[$index['left']] ?? 0);
            $top = (float) ($cols[$index['top']] ?? 0);
            $width = (float) ($cols[$index['width']] ?? 0);
            $height = (float) ($cols[$index['height']] ?? 0);

            $confRaw = $cols[$index['conf']] ?? '-1';
            $confidence = is_numeric($confRaw) ? max(0.0, min(100.0, (float) $confRaw)) : null;

            if ($confidence !== null && $confidence > 0) {
                $confidenceSum += $confidence;
                $confidenceCount++;
            }

            $words[] = new OcrWord(
                text: $text,
                x: $left,
                y: $top,
                width: $width,
                height: $height,
                confidence: $confidence,
                lineNumber: (int) ($cols[$index['line_num']] ?? 0),
            );

            $maxRight = max($maxRight, $left + $width);
            $maxBottom = max($maxBottom, $top + $height);
        }

        return new OcrWordSet(
            words: $words,
            meanConfidence: $confidenceCount > 0 ? round($confidenceSum / $confidenceCount, 1) : 0.0,
            imageWidth: (int) ceil($maxRight),
            imageHeight: (int) ceil($maxBottom),
        );
    }
}
