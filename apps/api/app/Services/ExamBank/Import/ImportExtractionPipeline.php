<?php

namespace App\Services\ExamBank\Import;

use App\Models\QuestionImport;
use App\Services\ExamBank\Import\Ocr\OcrWordSet;
use App\Services\ExamBank\Import\Ocr\TesseractEngine;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Runs the full extraction pipeline for one import and persists the composed
 * document (or a structured failure) onto the QuestionImport row.
 *
 * Stages (recorded live via ImportStageRecorder):
 *   ingest → preprocess → layout → ocr → structure → math → diagram → compose
 *
 * Failure contract: `error` JSON always carries {code, stage} and, when
 * actionable for the teacher, an Arabic `message` (e.g. missing tesseract).
 */
final class ImportExtractionPipeline
{
    public function __construct(
        private readonly ImportFileStorage $fileStorage,
        private readonly PageAnalyzer $pageAnalyzer,
        private readonly LayoutBuilder $layoutBuilder,
        private readonly TesseractEngine $tesseract,
        private readonly DocumentComposer $composer,
        private readonly MathConverter $mathConverter,
        private readonly DiagramReconstructor $diagramReconstructor,
        private readonly QuestionDocumentValidator $validator,
    ) {}

    public function run(QuestionImport $import): void
    {
        $recorder = new ImportStageRecorder($import);
        $stage = '';

        try {
            $document = $this->extract($import, $recorder, $stage);
        } catch (ExtractionFailure $failure) {
            Log::warning('question-import.extraction_failed', [
                'import_id' => $import->id,
                'code' => $failure->errorCode,
                'stage' => $failure->stage,
            ]);

            $import->forceFill([
                'status' => QuestionImport::STATUS_FAILED,
                'error' => [
                    'code' => $failure->errorCode,
                    'stage' => $failure->stage,
                    'message' => $failure->getMessage(),
                ],
                'finished_at' => now(),
            ])->save();

            return;
        } catch (\Throwable $exception) {
            Log::error('question-import.unexpected_error', [
                'import_id' => $import->id,
                'stage' => $stage,
                'exception' => $exception->getMessage(),
            ]);

            $import->forceFill([
                'status' => QuestionImport::STATUS_FAILED,
                'error' => [
                    'code' => 'extraction_failed',
                    'stage' => $stage !== '' ? $stage : null,
                    'message' => 'تعذر تحليل الصورة. تأكد من وضوحها وأعد المحاولة.',
                ],
                'finished_at' => now(),
            ])->save();

            return;
        }

        $errors = $this->validator->validate($document);

        $import->forceFill([
            'status' => $errors === [] ? QuestionImport::STATUS_READY : QuestionImport::STATUS_FAILED,
            'document' => $errors === [] ? $document : null,
            'error' => $errors === []
                ? null
                : ['code' => 'validation_failed', 'stage' => 'compose', 'errors' => $errors],
            'finished_at' => now(),
        ])->save();
    }

    /**
     * @return array<string, mixed>
     *
     * @throws ExtractionFailure
     */
    private function extract(QuestionImport $import, ImportStageRecorder $stages, string &$stage): array
    {
        // ── 1) ingest ────────────────────────────────────────────────
        $stage = 'ingest';
        $stages->start('ingest');

        $bytes = $this->fileStorage->read($import);

        if ($bytes === null || strlen($bytes) < 64) {
            throw new ExtractionFailure('file_missing_or_empty', $stage, 'ملف الاستيراد مفقود أو فارغ.');
        }

        if ($this->detectImageMime($bytes) === null) {
            throw new ExtractionFailure('unsupported_file_type', $stage, 'نوع الملف غير مدعوم. يُسمح فقط بصور JPEG و PNG و TIFF و WebP.');
        }

        $absolutePath = $this->fileStorage->absolutePath($import);

        if ($absolutePath === null) {
            throw new ExtractionFailure('file_unreadable', $stage, 'لا يمكن قراءة ملف الاستيراد من التخزين.');
        }

        $stages->finish('ingest', number_format(strlen($bytes) / 1024, 0).' KB');

        // ── 2) preprocess: EXIF orientation + decode + analysis scale ──
        $stage = 'preprocess';
        $stages->start('preprocess');
        $analysis = $this->pageAnalyzer->decodeToAnalysisScale($bytes, $this->exifOrientation($absolutePath));
        $stages->finish('preprocess', $analysis['width'].'×'.$analysis['height']);

        try {
            // ── 3) layout: ink components on the analysis grid ─────────
            $stage = 'layout';
            $stages->start('layout');
            $components = $this->pageAnalyzer->findInkComponents($analysis['image']);
            $stages->finish('layout', count($components).' components');

            // ── 4) ocr: word-level recognition on the original file ────
            $stage = 'ocr';
            $wordSet = $this->runOcr($absolutePath, $stages);

            // ── 5) structure: lines → text blocks + graphic regions ────
            $stage = 'structure';
            $stages->start('structure');
            $lines = $this->layoutBuilder->buildLines($wordSet);
            $textBlocks = $this->layoutBuilder->buildBlocks($lines);
            $graphicRegions = $this->layoutBuilder->graphicRegions(
                $components,
                $this->scaleLines($lines, $analysis['scale']),
                $analysis['scale'],
            );
            $stages->finish('structure', count($textBlocks).' blocks, '.count($graphicRegions).' graphics');

            // ── 6) math: count convertible segments (conversion at compose)
            $stage = 'math';
            $stages->start('math');
            $mathSegments = 0;
            foreach ($textBlocks as $block) {
                $mathSegments += $this->countMathSegments((string) ($block['text'] ?? ''));
                foreach ((array) ($block['items'] ?? []) as $item) {
                    $mathSegments += $this->countMathSegments((string) ($item['text'] ?? ''));
                }
            }
            $stages->finish('math', $mathSegments.' segments');

            // ── 7) diagram: reconstruct each graphic region ────────────
            $stage = 'diagram';
            $stages->start('diagram');
            $diagramBlocks = [];

            foreach ($graphicRegions as $region) {
                $draft = $this->reconstructRegion($analysis['image'], $region, $analysis['scale'], $wordSet);
                $draft['region'] = ['x' => $region['x'], 'y' => $region['y'], 'w' => $region['w'], 'h' => $region['h']];
                $diagramBlocks[] = $draft;
            }
            $stages->finish('diagram', count($diagramBlocks).' regions');

            // ── 8) compose: final content_document ─────────────────────
            $stage = 'compose';
            $stages->start('compose');
            $document = $this->composer->compose($textBlocks, $diagramBlocks, $wordSet);
            $stages->finish('compose', count($document['blocks'] ?? []).' blocks');        } finally {
            imagedestroy($analysis['image']);
        }

        return $document;
    }

    /**
     * OCR is required for a usable document. When the engine is missing or
     * fails we fail loudly with an actionable message — never fake results.
     *
     * @throws ExtractionFailure
     */
    private function runOcr(string $absolutePath, ImportStageRecorder $stages): OcrWordSet
    {
        $stages->start('ocr');

        if (! $this->tesseract->available()) {
            $stages->skip('ocr', 'تم تخطي استخراج النص: محرك OCR غير متوفر');

            throw new ExtractionFailure('ocr_unavailable', 'ocr', $this->tesseract->unavailabilityReason());
        }

        $psm = (string) config('question-import.ocr.psm', '3');

        try {
            $wordSet = $this->tesseract->recognizeFile($absolutePath, $psm);
        } catch (ValidationException $exception) {
            $stages->skip('ocr', 'فشل استخراج النص من الصورة');

            throw new ExtractionFailure(
                'ocr_failed',
                'ocr',
                $exception->errors()['import'][0] ?? 'فشل تحليل النص في الصورة. تأكد من وضوح الصورة وأعد المحاولة.',
            );
        }

        $stages->finish('ocr', count($wordSet->words).' words · '.round($wordSet->meanConfidence, 1).'% conf');

        return $wordSet;
    }

    /**
     * Wraps DiagramReconstructor so one broken region never kills the import.
     *
     * @param  array{x: int, y: int, w: int, h: int}  $region  original scale
     * @return array<string, mixed> diagram or unresolved_visual draft
     */
    private function reconstructRegion(\GdImage $image, array $region, float $scale, OcrWordSet $words): array
    {
        try {
            return $this->diagramReconstructor->reconstruct($image, $region, $scale, $words->words);
        } catch (\Throwable $exception) {
            Log::notice('question-import.diagram_reconstruction_skipped', [
                'error' => $exception->getMessage(),
                'region' => $region,
            ]);

            return [
                'type' => 'unresolved_visual',
                'reason' => 'reconstruction_error',
                'confidence' => 0.0,
            ];
        }
    }

    /**
     * Converts line coordinates from original scale to analysis scale so they
     * can be intersected with ink components inside graphicRegions().
     *
     * @param  list<array{x1: float, x2: float, y1: float, y2: float}>  $lines
     * @return list<array{x1: float, x2: float, y1: float, y2: float}>
     */
    private function scaleLines(array $lines, float $scale): array
    {
        if ($scale <= 0 || $scale === 1.0) {
            return $lines;
        }

        return array_map(fn (array $line): array => [
            'x1' => $line['x1'] * $scale,
            'x2' => $line['x2'] * $scale,
            'y1' => $line['y1'] * $scale,
            'y2' => $line['y2'] * $scale,
        ], $lines);
    }

    private function countMathSegments(string $text): int
    {
        if (trim($text) === '') {
            return 0;
        }

        return count(array_filter(
            $this->mathConverter->segmentLine($text),
            fn (array $segment): bool => ($segment['kind'] ?? '') === 'inline_math',
        ));
    }

    /**
     * EXIF orientation for JPEG files; null otherwise.
     */
    private function exifOrientation(string $absolutePath): ?int
    {
        if (! is_callable('exif_read_data')) {
            return null;
        }

        $magic = @file_get_contents($absolutePath, false, null, 0, 3);

        if ($magic === false || ! str_starts_with($magic, "\xFF\xD8\xFF")) {
            return null;
        }

        try {
            $exif = @exif_read_data($absolutePath);
        } catch (\Throwable) {
            return null;
        }

        $orientation = $exif['Orientation'] ?? null;

        return is_numeric($orientation) ? (int) $orientation : null;
    }

    private function detectImageMime(string $binary): ?string
    {
        return match (true) {
            str_starts_with($binary, "\x89PNG\r\n\x1a\n") => 'image/png',
            str_starts_with($binary, "\xFF\xD8\xFF") => 'image/jpeg',
            str_starts_with($binary, 'II*'.chr(0)) || str_starts_with($binary, 'MM'.chr(0).'*') => 'image/tiff',
            str_starts_with($binary, 'RIFF') && substr($binary, 8, 4) === 'WEBP' => 'image/webp',
            default => null,
        };
    }
}

/**
 * Typed failure carrying a machine code, the failing stage and an optional
 * teacher-facing Arabic message.
 */
final class ExtractionFailure extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        public readonly string $stage,
        ?string $message = null,
    ) {
        parent::__construct($message ?? $errorCode);
    }
}
