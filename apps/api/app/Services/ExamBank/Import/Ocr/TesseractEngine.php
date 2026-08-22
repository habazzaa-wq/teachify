<?php

namespace App\Services\ExamBank\Import\Ocr;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\ValidationException;

/**
 * Self-hosted OCR via the Tesseract CLI (`ara+eng`).
 *
 * The engine is probed once per request; when the binary or a required
 * language pack is missing, available() reports false and callers must fail
 * the import with an explicit actionable message instead of producing fake
 * results. Word-level TSV output is used so layout reconstruction can rely on
 * real geometry and per-word confidences.
 */
class TesseractEngine
{
    private ?bool $available = null;

    /** @var list<string>|null */
    private ?array $availableLanguages = null;

    public function binary(): string
    {
        $binary = trim((string) config('question-import.ocr.binary', 'tesseract'));

        return $binary !== '' ? $binary : 'tesseract';
    }

    /**
     * Whether the OCR engine can actually run on this machine.
     */
    public function available(): bool
    {
        if ($this->available !== null) {
            return $this->available;
        }

        try {
            $probe = Process::timeout(10)->run([$this->binary(), '--version']);
        } catch (\Throwable) {
            return $this->available = false;
        }

        $this->available = $probe->successful()
            && str_contains(strtolower($probe->output().$probe->errorOutput()), 'tesseract');

        return $this->available;
    }

    /**
     * Human-readable explanation of why the engine is unavailable.
     */
    public function unavailabilityReason(): string
    {
        $langs = $this->languages();

        if ($langs === null) {
            return 'محرك التعرف الضوئي (Tesseract) غير مثبت على الخادم. يجب تثبيت الحزم: apt-get install -y tesseract-ocr tesseract-ocr-ara tesseract-ocr-eng';
        }

        $missing = array_values(array_diff(
            (array) config('question-import.ocr.languages', ['ara', 'eng']),
            $langs,
        ));

        if ($missing !== []) {
            return 'حزم لغة التعرف الضوئي غير مكتملة ('.implode(', ', $missing).'). ثبّت الحزم الناقصة: tesseract-ocr-'.implode(' tesseract-ocr-', $missing);
        }

        return 'محرك التعرف الضوئي غير متوفر.';
    }

    /**
     * @return list<string>|null installed language packs, null when probing failed
     */
    public function languages(): ?array
    {
        if ($this->availableLanguages !== null) {
            return $this->availableLanguages;
        }

        try {
            $probe = Process::timeout(10)->run([$this->binary(), '--list-langs']);
        } catch (\Throwable) {
            return null;
        }

        $lines = preg_split('/\r?\n/', trim($probe->output()."\n".$probe->errorOutput())) ?: [];

        // Output contains a header line then one language code per line.
        $langs = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_contains($line, 'List of available')) {
                continue;
            }
            if (preg_match('/^[a-z]{2,4}(_[a-z]+)?$/', $line)) {
                $langs[] = $line;
            }
        }

        $this->availableLanguages = $langs;

        return $this->availableLanguages;
    }

    /**
     * Runs OCR over an image file and returns word-level results.
     *
     * @throws ValidationException when the engine fails mid-run
     */
    public function recognizeFile(string $absolutePath, string $psm): OcrWordSet
    {
        $languages = implode('+', (array) config('question-import.ocr.languages', ['ara', 'eng']));
        $timeout = (int) config('question-import.ocr.timeout', 120);

        $result = Process::timeout($timeout)->run([
            $this->binary(),
            $absolutePath,
            'stdout',
            '-l', $languages,
            '--psm', $psm,
            'tsv',
        ]);

        if (! $result->successful() || trim($result->output()) === '') {
            Log::warning('question-import.ocr.failed', [
                'exit' => $result->exitCode(),
                'stderr' => mb_substr($result->errorOutput(), 0, 500),
            ]);

            throw ValidationException::withMessages([
                'import' => ['فشل تحليل النص في الصورة. تأكد من وضوح الصورة وأعد المحاولة.'],
            ]);
        }

        return TsvParser::parse($result->output());
    }
}
