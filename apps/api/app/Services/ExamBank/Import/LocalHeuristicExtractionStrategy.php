<?php

namespace App\Services\ExamBank\Import;

use App\Models\QuestionImport;
use App\Services\ExamBank\Import\Ocr\TesseractEngine;

final class LocalHeuristicExtractionStrategy implements ExtractionStrategyInterface
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

    public function name(): string { return 'local'; }
    public function available(): bool { return $this->tesseract->available(); }
    public function unavailabilityReason(): ?string { return $this->tesseract->unavailabilityReason(); }

    public function extract(QuestionImport $import, ImportStageRecorder $recorder): array
    {
        $bytes = $this->fileStorage->read($import);
        if ($bytes === null || strlen($bytes) < 64) throw new ExtractionFailure('file_missing_or_empty', 'ingest', 'ملف الاستيراد مفقود او فارغ.');
        $absolutePath = $this->fileStorage->absolutePath($import);
        if ($absolutePath === null) throw new ExtractionFailure('file_unreadable', 'ingest', 'لا يمكن قراءة ملف الاستيراد.');

        $recorder->start('ingest');
        $recorder->finish('ingest', number_format(strlen($bytes)/1024, 0).' KB');

        // Pixel analysis needs the GD extension. When it is unavailable we still
        // attempt a fully OCR-driven extraction (text + structure) so the import
        // does not hard-fail purely because of a missing graphics library.
        $gdAvailable = extension_loaded('gd') && function_exists('imagecreatefromstring');

        $components = [];
        $analysisScale = 1.0;
        $image = null;
        if ($gdAvailable) {
            $recorder->start('preprocess');
            try {
                $analysis = $this->pageAnalyzer->decodeToAnalysisScale($bytes, $this->exifOrientation($absolutePath));
            } catch (\Throwable $e) {
                throw new ExtractionFailure('image_decode_failed', 'preprocess', 'تعذر قراءة الصورة (قد تكون تالفة أو أن مكتبة معالجة الصور غير مفعّلة على الخادم).');
            }
            $recorder->finish('preprocess', $analysis['width'].'x'.$analysis['height']);
            $image = $analysis['image'];
            $analysisScale = $analysis['scale'];
        } else {
            $recorder->skip('preprocess', 'تم تخطي تحليل البكسل: مكتبة الصور GD غير متاحة');
        }

        try {
            $recorder->start('layout');
            if ($gdAvailable) {
                $components = $this->pageAnalyzer->findInkComponents($image);
            }
            $recorder->finish('layout', count($components).' components');

            $recorder->start('ocr');
            if (!$this->tesseract->available()) {
                $recorder->skip('ocr', 'تم تخطي استخراج النص: محرك OCR غير متوفر');
                throw new ExtractionFailure('ocr_unavailable', 'ocr', $this->tesseract->unavailabilityReason());
            }
            $psm = (string) config('question-import.ocr.psm', '3');
            try {
                $wordSet = $this->tesseract->recognizeFile($absolutePath, $psm);
            } catch (\Illuminate\Validation\ValidationException $e) {
                $recorder->skip('ocr', 'فشل استخراج النص');
                throw new ExtractionFailure('ocr_failed', 'ocr', $e->errors()['import'][0] ?? 'فشل تحليل النص.');
            }
            $recorder->finish('ocr', count($wordSet->words).' words');

            $recorder->start('structure');
            $lines = $this->layoutBuilder->buildLines($wordSet);
            $textBlocks = $this->layoutBuilder->buildBlocks($lines);
            $graphicRegions = $gdAvailable
                ? $this->layoutBuilder->graphicRegions($components, $this->scaleLines($lines, $analysisScale), $analysisScale)
                : [];
            $recorder->finish('structure', count($textBlocks).' blocks, '.count($graphicRegions).' graphics');

            $recorder->start('math');
            $mathSegments = 0;
            foreach ($textBlocks as $block) {
                $mathSegments += $this->countMathSegments((string)($block['text'] ?? ''));
                foreach ((array)($block['items'] ?? []) as $item) $mathSegments += $this->countMathSegments((string)($item['text'] ?? ''));
            }
            $recorder->finish('math', $mathSegments.' segments');

            if ($gdAvailable) {
                $recorder->start('diagram');
                $diagramBlocks = [];
                foreach ($graphicRegions as $region) {
                    try {
                        $draft = $this->diagramReconstructor->reconstruct($image, $region, $analysisScale, $wordSet->words);
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::notice('question-import.diagram_skipped', ['error' => $e->getMessage()]);
                        $draft = ['type' => 'unresolved_visual', 'reason' => 'reconstruction_error', 'confidence' => 0.0];
                    }
                    $draft['region'] = ['x' => $region['x'], 'y' => $region['y'], 'w' => $region['w'], 'h' => $region['h']];
                    $diagramBlocks[] = $draft;
                }
                $recorder->finish('diagram', count($diagramBlocks).' regions');
            } else {
                $diagramBlocks = [];
                $recorder->skip('diagram', 'تم تخطي تحليل الرسومات: مكتبة الصور غير متاحة');
            }

            $recorder->start('compose');
            $document = $this->composer->compose($textBlocks, $diagramBlocks, $wordSet);
            $recorder->finish('compose', count($document['blocks'] ?? []).' blocks');

            $errors = $this->validator->validate($document);
            if ($errors !== []) {
                throw new ExtractionFailure(
                    'local_validation_failed',
                    'compose',
                    'لم يتمكّن المحرك المحلي من بناء سؤال صالح من الصورة. ' . implode(' ', $errors),
                );
            }

            return $document;
        } finally {
            if ($gdAvailable && $image !== null) {
                imagedestroy($image);
            }
        }
    }

    private function exifOrientation(string $path): ?int
    {
        if (!is_callable('exif_read_data')) return null;
        $magic = @file_get_contents($path, false, null, 0, 3);
        if ($magic === false || !str_starts_with($magic, "\xFF\xD8\xFF")) return null;
        try { $exif = @exif_read_data($path); } catch (\Throwable) { return null; }
        $o = $exif['Orientation'] ?? null;
        return is_numeric($o) ? (int)$o : null;
    }

    private function scaleLines(array $lines, float $scale): array
    {
        if ($scale <= 0 || $scale === 1.0) return $lines;
        return array_map(fn(array $l): array => ['x1'=>$l['x1']*$scale,'x2'=>$l['x2']*$scale,'y1'=>$l['y1']*$scale,'y2'=>$l['y2']*$scale], $lines);
    }

    private function countMathSegments(string $text): int
    {
        if (trim($text) === '') return 0;
        return count(array_filter($this->mathConverter->segmentLine($text), fn(array $s): bool => ($s['kind'] ?? '') === 'inline_math'));
    }
}
