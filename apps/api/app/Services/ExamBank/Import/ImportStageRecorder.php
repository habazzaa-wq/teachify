<?php

namespace App\Services\ExamBank\Import;

use App\Models\QuestionImport;

/**
 * Records the real lifecycle stages of an import job into the database.
 *
 * Every stage entry is written when the corresponding backend work actually
 * starts and again when it finishes — the processing UI polls this state, so
 * there is a one-to-one mapping between what the teacher sees and work the
 * backend performs. No synthetic progress is ever produced.
 */
class ImportStageRecorder
{
    public const STAGES = [
        'ingest' => 'تم استلام الصورة',
        'preprocess' => 'جاري تجهيز الصورة',
        'layout' => 'جاري تحليل تخطيط الصفحة',
        'ocr' => 'جاري استخراج النص',
        'structure' => 'جاري بناء الفقرات والقوائم',
        'math' => 'جاري تحليل المعادلات',
        'diagram' => 'جاري تحليل الرسومات',
        'compose' => 'جاري بناء السؤال',
        'vision_prepare' => 'جاري تجهيز الصورة',
        'vision_upload' => 'جاري إرسال الصورة للتحليل',
        'vision_request' => 'جاري استخراج محتوى السؤال',
        'vision_text' => 'جاري تحليل النصوص والمعادلات',
        'vision_visual' => 'جاري تحليل الرسومات والجداول',
        'vision_compose' => 'جاري بناء السؤال بصيغة منظمة',
        'vision_parse' => 'جاري معالجة الاستجابة',
        'vision_validate' => 'جاري التحقق من النتيجة',
        'vision_ready' => 'جاهز للمراجعة',
    ];

    public const VISION_STAGES = ['vision_prepare','vision_upload','vision_request','vision_text','vision_visual','vision_compose','vision_parse','vision_validate','vision_ready'];
    public const LOCAL_STAGES = ['ingest','preprocess','layout','ocr','structure','math','diagram','compose'];

    /** @var array<string, array{key: string, label: string, status: string, detail?: string, startedAt: string, finishedAt?: string}> */
    private array $stages = [];

    public function __construct(private readonly QuestionImport $import) {}

    public function start(string $key, string $detail = ''): void
    {
        if (! isset(self::STAGES[$key])) {
            $this->stages[$key] = [
                'key' => $key,
                'label' => $key,
                'status' => 'running',
                'startedAt' => now()->toIso8601String(),
            ];
            if ($detail !== '') $this->stages[$key]['detail'] = $detail;
            $this->persist();
            return;
        }

        $this->stages[$key] = [
            'key' => $key,
            'label' => self::STAGES[$key],
            'status' => 'running',
            'startedAt' => now()->toIso8601String(),
        ];

        if ($detail !== '') {
            $this->stages[$key]['detail'] = $detail;
        }

        $this->persist();
    }

    public function finish(string $key, string $detail = ''): void
    {
        if (! isset($this->stages[$key])) {
            $this->stages[$key] = [
                'key' => $key,
                'label' => $key,
                'status' => 'done',
                'startedAt' => now()->toIso8601String(),
                'finishedAt' => now()->toIso8601String(),
            ];
            if ($detail !== '') $this->stages[$key]['detail'] = $detail;
            $this->persist();
            return;
        }

        $this->stages[$key]['status'] = 'done';
        $this->stages[$key]['finishedAt'] = now()->toIso8601String();

        if ($detail !== '') {
            $this->stages[$key]['detail'] = $detail;
        } else {
            unset($this->stages[$key]['detail']);
        }

        $this->persist();
    }

    public function skip(string $key, string $reason): void
    {
        if (! isset(self::STAGES[$key])) {
            $this->stages[$key] = [
                'key' => $key,
                'label' => $key,
                'status' => 'skipped',
                'detail' => $reason,
                'startedAt' => now()->toIso8601String(),
                'finishedAt' => now()->toIso8601String(),
            ];
            $this->persist();
            return;
        }

        $this->stages[$key] = [
            'key' => $key,
            'label' => self::STAGES[$key],
            'status' => 'skipped',
            'detail' => $reason,
            'startedAt' => now()->toIso8601String(),
            'finishedAt' => now()->toIso8601String(),
        ];

        $this->persist();
    }

    /**
     * @return list<array<string, mixed>> ordered stage list
     */
    public function orderedStages(): array
    {
        $ordered = [];

        foreach (self::STAGES as $key => $label) {
            if (isset($this->stages[$key])) {
                $ordered[] = $this->stages[$key];
            }
        }

        return $ordered;
    }

    private function persist(): void
    {
        // Refresh to avoid clobbering concurrent status writes; only the
        // stages column is touched here.
        QuestionImport::query()
            ->whereKey($this->import->id)
            ->update(['stages' => $this->orderedStages()]);
    }
}
