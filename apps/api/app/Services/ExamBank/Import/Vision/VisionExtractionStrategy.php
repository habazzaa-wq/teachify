<?php

namespace App\Services\ExamBank\Import\Vision;

use App\Models\QuestionImport;
use App\Services\ExamBank\Import\ExtractionStrategyInterface;
use App\Services\ExamBank\Import\ImportStageRecorder;
use App\Services\ExamBank\Import\QuestionDocumentValidator;
use Illuminate\Support\Facades\Log;

final class VisionExtractionStrategy implements ExtractionStrategyInterface
{
    public function __construct(
        private readonly VisionQuestionExtractorInterface $extractor,
        private readonly VisionDocumentNormalizer $normalizer,
        private readonly QuestionDocumentValidator $validator,
        private readonly VisionRateLimiter $rateLimiter,
    ) {}

    public function name(): string { return 'vision'; }

    public function available(): bool
    {
        if (!config('question-import.vision.enabled', false)) return false;
        return $this->extractor->available();
    }

    public function unavailabilityReason(): ?string
    {
        if (!config('question-import.vision.enabled', false)) return 'الاستخراج البصري معطل في الإعدادات.';
        return $this->extractor->unavailabilityReason();
    }

    public function extract(QuestionImport $import, ImportStageRecorder $recorder): array
    {
        $this->rateLimiter->check($import->tenant_id);

        $absolutePath = app(\App\Services\ExamBank\Import\ImportFileStorage::class)->absolutePath($import);
        if ($absolutePath === null) {
            throw new \RuntimeException('Source file missing for vision extraction');
        }
        $mime = $import->source['mime'] ?? 'image/jpeg';

        $recorder->start('vision_prepare', 'تجهيز الصورة للإرسال');
        $recorder->finish('vision_prepare');

        $recorder->start('vision_upload', 'رفع الصورة للتحليل');
        $recorder->finish('vision_upload');

        $recorder->start('vision_request', 'استخراج محتوى السؤال');
        $raw = $this->extractor->extract($absolutePath, $mime);
        $recorder->finish('vision_request');

        $recorder->start('vision_text', 'تحليل النصوص والمعادلات');
        $recorder->finish('vision_text');

        $recorder->start('vision_visual', 'تحليل الرسومات والجداول');
        $recorder->finish('vision_visual');

        $recorder->start('vision_compose', 'بناء السؤال المنظم');
        $recorder->finish('vision_compose');

        $recorder->start('vision_parse', 'معالجة الاستجابة');
        $document = $this->normalizer->normalize($raw);
        $recorder->finish('vision_parse', count($document['blocks'] ?? []).' blocks');

        $recorder->start('vision_validate', 'التحقق من البنية');
        $errors = $this->validator->validate($document);
        if ($errors !== [] && config('question-import.vision.max_retries', 1) > 0) {
            Log::warning('vision.validation_failed_retry', ['errors' => $errors]);
            $document = $this->normalizer->normalize($raw);
            $errors = $this->validator->validate($document);
        }
        if ($errors !== []) {
            throw new \RuntimeException('Vision document validation failed: '.implode(', ', $errors));
        }
        $recorder->finish('vision_validate', 'صالح');

        $recorder->start('vision_ready', 'جاهز للمراجعة');
        $recorder->finish('vision_ready');

        $this->rateLimiter->hit($import->tenant_id);

        return $document;
    }
}
