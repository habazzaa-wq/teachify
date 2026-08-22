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

        $recorder->start('preprocess');
        $analysis = $this->pageAnalyzer->decodeToAnalysisScale($bytes, $this->exifOrientation($absolutePath));
        $recorder->finish('preprocess', $analysis['width'].'x'.$analysis['height']);

        try {
            $recorder->start('layout');
            $components = $this->pageAnalyzer->findInkComponents($analysis['image']);
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
            $graphicRegions = $this->layoutBuilder->graphicRegions($components, $this->scaleLines($lines, $analysis['scale']), $analysis['scale']);
            $recorder->finish('structure', count($textBlocks).' blocks, '.count($graphicRegions).' graphics');

            $recorder->start('math');
            $mathSegments = 0;
            foreach ($textBlocks as $block) {
                $mathSegments += $this->countMathSegments((string)($block['text'] ?? ''));
                foreach ((array)($block['items'] ?? []) as $item) $mathSegments += $this->countMathSegments((string)($item['text'] ?? ''));
            }
            $recorder->finish('math', $mathSegments.' segments');

            $recorder->start('diagram');
            $diagramBlocks = [];
            foreach ($graphicRegions as $region) {
                try {
                    $draft = $this->diagramReconstructor->reconstruct($analysis['image'], $region, $analysis['scale'], $wordSet->words);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::notice('question-import.diagram_skipped', ['error' => $e->getMessage()]);
                    $draft = ['type' => 'unresolved_visual', 'reason' => 'reconstruction_error', 'confidence' => 0.0];
                }
                $draft['region'] = ['x' => $region['x'], 'y' => $region['y'], 'w' => $region['w'], 'h' => $region['h']];
                $diagramBlocks[] = $draft;
            }
            $recorder->finish('diagram', count($diagramBlocks).' regions');

            $recorder->start('compose');
            $document = $this->composer->compose($textBlocks, $diagramBlocks, $wordSet);
            $recorder->finish('compose', count($document['blocks'] ?? []).' blocks');

            $errors = $this->validator->validate($document);
            if ($errors !== []) throw new \RuntimeException('Local document validation failed: '.implode(', ', $errors));

            return $document;
        } finally {
            imagedestroy($analysis['image']);
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
