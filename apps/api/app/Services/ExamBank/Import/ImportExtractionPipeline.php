<?php

namespace App\Services\ExamBank\Import;

use App\Models\QuestionImport;
use App\Services\ExamBank\Import\Vision\VisionExtractionStrategy;
use App\Services\ExamBank\Import\Vision\VisionProviderRateLimitedException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class ImportExtractionPipeline
{
    private ?string $visionFallbackReason = null;

    public function __construct(
        private readonly LocalHeuristicExtractionStrategy $localStrategy,
        private readonly VisionExtractionStrategy $visionStrategy,
        private readonly QuestionDocumentValidator $validator,
    ) {}

    public function run(QuestionImport $import): void
    {
        $this->visionFallbackReason = null;
        QuestionImportSettings::applyForTenant($import->tenant_id);
        $recorder = new ImportStageRecorder($import);
        $requested = $import->requested_mode ?? 'auto';
        if (!in_array($requested, ['auto','vision','local'], true)) $requested = 'auto';

        $used = null;
        $fallbackUsed = false;
        $fallbackReason = null;
        $document = null;
        $error = null;
        $stage = '';

        try {
            [$document, $used, $fallbackUsed, $fallbackReason] = $this->executeWithMode($import, $recorder, $requested);
        } catch (ExtractionFailure $failure) {
            Log::warning('question-import.extraction_failed', ['import_id'=>$import->id,'code'=>$failure->errorCode,'stage'=>$failure->stage]);
            // When an auto vision attempt already failed and we then fell back to
            // the local strategy (which also failed), reflect the real path.
            $usedMode = $requested;
            $strategy = $requested;
            $fbUsed = $fallbackUsed;
            $fbReason = $fallbackReason;
            if ($this->visionFallbackReason !== null) {
                $usedMode = 'local';
                $strategy = 'local';
                $fbUsed = true;
                $fbReason = $this->visionFallbackReason;
            }
            $message = $failure->getMessage();
            if ($this->visionFallbackReason !== null) {
                $message .= ' (تحوّلنا للمعالجة المحلية بسبب: '.$this->visionFallbackReason.')';
            }
            $import->forceFill([
                'status'=>QuestionImport::STATUS_FAILED,
                'requested_mode'=>$requested,
                'used_mode'=>$failure->errorCode === 'vision_unavailable' ? null : $usedMode,
                'fallback_used'=>$fbUsed,
                'fallback_reason'=>$fbReason,
                'strategy'=>$failure->errorCode === 'vision_unavailable' ? null : $strategy,
                'error'=>['code'=>$failure->errorCode,'stage'=>$failure->stage,'message'=>$message],
                'finished_at'=>now(),
            ])->save();
            return;
        } catch (ValidationException $ve) {
            $msg = $ve->errors()['file'][0] ?? $ve->getMessage();
            $code = str_contains($msg, 'الحد اليومي') ? 'vision_daily_limit' : (str_contains($msg, 'كثير جد') ? 'vision_rate_limited' : 'validation_failed');
            $import->forceFill([
                'status'=>QuestionImport::STATUS_FAILED,
                'requested_mode'=>$requested,
                'used_mode'=>$requested,
                'fallback_used'=>false,
                'fallback_reason'=>$code,
                'strategy'=>$requested === 'vision' ? 'vision' : ($used ?? $requested),
                'error'=>['code'=>$code,'stage'=>'vision_request','message'=>$msg],
                'finished_at'=>now(),
            ])->save();
            return;
        } catch (VisionProviderRateLimitedException $e) {
            Log::warning('question-import.provider_rate_limited', ['import_id'=>$import->id,'mode'=>$requested]);
            $import->forceFill([
                'status'=>QuestionImport::STATUS_FAILED,
                'requested_mode'=>$requested,
                'used_mode'=>$requested === 'vision' ? 'vision' : $requested,
                'fallback_used'=>false,
                'fallback_reason'=>'vision_provider_rate_limited',
                'strategy'=>'vision',
                'error'=>['code'=>'vision_provider_rate_limited','stage'=>'vision_request','message'=>'تم تجاوز حد مزود الرؤية. حاول لاحقاً.'],
                'finished_at'=>now(),
            ])->save();
            return;
        } catch (\Throwable $e) {
            Log::error('question-import.unexpected_error', ['import_id'=>$import->id,'stage'=>$stage,'exception'=>$e->getMessage(),'class'=>get_class($e)]);
            [$code, $message] = $this->classifyError($e);
            $import->forceFill([
                'status'=>QuestionImport::STATUS_FAILED,
                'requested_mode'=>$requested,
                'used_mode'=>$used ?? $requested,
                'fallback_used'=>$fallbackUsed || $this->visionFallbackReason !== null,
                'fallback_reason'=>$fallbackReason ?? $this->visionFallbackReason,
                'strategy'=>$used ?? $requested,
                'error'=>['code'=>$code,'stage'=>$stage ?: null,'message'=>$message,'detail'=>$e->getMessage()],
                'finished_at'=>now(),
            ])->save();
            return;
        }

        if ($document === null) {
            $import->forceFill([
                'status'=>QuestionImport::STATUS_FAILED,
                'used_mode'=>$used,
                'fallback_used'=>$fallbackUsed,
                'fallback_reason'=>$fallbackReason ?? 'unknown',
                'strategy'=>$used,
                'error'=> $error ?? ['code'=>'extraction_failed','stage'=>null,'message'=>'تعذر استخراج السؤال من الصورة لأسباب تقنية.'],
                'finished_at'=>now(),
            ])->save();
            return;
        }

        $errors = $this->validator->validate($document);
        $import->forceFill([
            'status'=> $errors===[] ? QuestionImport::STATUS_READY : QuestionImport::STATUS_FAILED,
            'document'=> $errors===[] ? $document : null,
            'used_mode'=>$used,
            'fallback_used'=>$fallbackUsed,
            'fallback_reason'=>$fallbackReason,
            'strategy'=>$used,
            'error'=> $errors===[] ? null : ['code'=>'validation_failed','stage'=>'compose','errors'=>$errors],
            'finished_at'=>now(),
        ])->save();
    }

    /**
     * @return array{0: ?array, 1: ?string, 2: bool, 3: ?string}
     */
    private function executeWithMode(QuestionImport $import, ImportStageRecorder $recorder, string $requested): array
    {
        if ($requested === 'local') {
            $doc = $this->localStrategy->extract($import, $recorder);
            return [$doc, 'local', false, null];
        }
        if ($requested === 'vision') {
            if (!$this->visionStrategy->available()) {
                throw new ExtractionFailure('vision_unavailable', 'vision_request', $this->visionStrategy->unavailabilityReason() ?? 'خدمة الاستخراج البصري غير متاحة.');
            }
            $doc = $this->visionStrategy->extract($import, $recorder);
            return [$doc, 'vision', false, null];
        }
        // auto
        if ($this->visionStrategy->available()) {
            try {
                $doc = $this->visionStrategy->extract($import, $recorder);
                return [$doc, 'vision', false, null];
            } catch (ValidationException $ve) {
                throw $ve;
            } catch (VisionProviderRateLimitedException $e) {
                throw $e;
            } catch (\Throwable $e) {
                Log::warning('question-import.auto_vision_fallback', ['import_id'=>$import->id,'error'=>$e->getMessage()]);
                $reason = $this->mapFallbackReason($e);
                $this->visionFallbackReason = $reason;
                $recorder->start('ingest', 'التبديل الى المعالجة المحلية');
                $recorder->finish('ingest', 'fallback');
                $doc = $this->localStrategy->extract($import, $recorder);
                return [$doc, 'local', true, $reason];
            }
        }
        $doc = $this->localStrategy->extract($import, $recorder);
        $reason = $this->visionStrategy->available() ? null : 'vision_unavailable';
        $fallback = !$this->visionStrategy->available();
        return [$doc, 'local', $fallback, $reason];
    }

    private function mapFallbackReason(\Throwable $e): string
    {
        $msg = $e->getMessage();
        if (str_contains($msg, 'Vision provider failed')) return 'vision_provider_error';
        if (str_contains($msg, 'validation failed')) return 'vision_validation_failed';
        if (str_contains($msg, 'Invalid vision')) return 'vision_invalid_response';
        return 'vision_failed';
    }

    /**
     * Maps an unexpected exception to an honest, specific error the teacher sees,
     * instead of the old blanket "image is unclear" message that blamed the
     * upload for infrastructure/code failures.
     *
     * @return array{0: string, 1: string} [code, user-facing Arabic message]
     */
    private function classifyError(\Throwable $e): array
    {
        $msg = $e->getMessage();

        if ($e instanceof \InvalidArgumentException) {
            return ['image_decode_failed', 'تعذر قراءة الصورة (قد تكون تالفة، أو أن مكتبة معالجة الصور GD غير مفعّلة على الخادم).'];
        }

        if (str_contains($msg, 'Local document validation failed') || str_contains($msg, 'Vision document validation failed')) {
            return ['validation_failed', 'لم يتمكّن المحرك من بناء سؤال صالح من هذه الصورة. جرّب صورة أوضح أو استخدم النمط البصري.'];
        }

        if (str_contains($msg, 'Vision provider failed') || str_contains($msg, 'Vision provider rate')) {
            return ['vision_provider_error', 'تعذر الاتصال بمزود الذكاء البصري أو أنه أرجع خطأ.'];
        }

        if (str_contains($msg, 'Invalid vision') || str_contains($msg, 'Invalid vision JSON')) {
            return ['vision_invalid_response', 'أرجع مزود الذكاء البصري استجابة غير صالحة.'];
        }

        return ['extraction_failed', 'تعذر استخراج السؤال من الصورة لأسباب تقنية. راجع سجلات الخادم أو جرّب نمط معالجة مختلفاً.'];
    }
}

final class ExtractionFailure extends RuntimeException
{
    public function __construct(public readonly string $errorCode, public readonly string $stage, ?string $message = null) { parent::__construct($message ?? $errorCode); }
}
