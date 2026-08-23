<?php

namespace App\Services\ExamBank\Import\Vision;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class OpenAICompatibleVisionExtractor implements VisionQuestionExtractorInterface
{
    private const MAX_RESPONSE_BYTES = 131072;
    private const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

    public function available(): bool
    {
        return (bool) config('question-import.vision.enabled')
            && (bool) config('question-import.vision.api_key')
            && (bool) config('question-import.vision.endpoint');
    }

    public function unavailabilityReason(): ?string
    {
        if (!config('question-import.vision.enabled')) return 'الاستخراج البصري معطل في الاعدادات.';
        if (!config('question-import.vision.api_key') || !config('question-import.vision.endpoint')) return 'خدمة الاستخراج البصري غير مهيأة. يرجى ضبط مفاتيح API.';
        return null;
    }

    public function extract(string $imagePath, string $mime): array
    {
        $endpoint = trim((string) config('question-import.vision.endpoint'));
        $apiKey = (string) config('question-import.vision.api_key');
        $model = (string) config('question-import.vision.model', 'gpt-4o-mini');
        $timeout = (int) config('question-import.vision.timeout', 45);

        $bytes = @file_get_contents($imagePath);
        if ($bytes === false) throw new \RuntimeException('Cannot read image for vision extraction');
        if (strlen($bytes) > self::MAX_IMAGE_BYTES) throw new \RuntimeException('Image too large for vision extraction');
        $b64 = base64_encode($bytes);

        $systemPrompt = implode("\n", [
            'You are a faithful educational question extractor. Your sole task is to TRANSCRIBE, not to solve or teach.',
            'CRITICAL RULES - VIOLATION IS FAILURE:',
            '- Faithfully transcribe the source image exactly as written. Preserve every word, number, symbol, and structural element.',
            '- NEVER solve the question, answer it, explain it, or provide hints.',
            '- NEVER summarize, rewrite, or rephrase the question into a different question.',
            '- NEVER omit text because it seems unimportant, repetitive, or decorative.',
            '- NEVER invent, hallucinate, or guess missing content. If unreadable, describe what is unreadable.',
            '- Preserve Arabic exactly as it appears. Preserve English exactly. Preserve mixed RTL/LTR order and reading flow.',
            '- For mathematics: convert every mathematical expression into valid LaTeX.',
            '  Stacked fractions → \\frac{numerator}{denominator}',
            '  Square roots → \\sqrt{...}',
            '  Exponents/superscripts → x^{2}, subscripts → x_{n}',
            '  Sums, integrals, matrices as needed. Set display=true for block equations, false for inline.',
            '- For chemistry: use chemical_equation blocks with correct subscripts, superscripts, and arrows (\\rightarrow, \\rightleftharpoons, \\leftrightarrow).',
            '- For tables: reconstruct as structured table blocks with rows as arrays of cell strings. Preserve headers.',
            '- For lists: reconstruct ordered/unordered lists with markers.',
            '- For diagrams/geometry/physics visuals:',
            '  * If you can confidently reconstruct simple geometry (triangles, circles, arrows, axes, labels) as clean SVG, do so.',
            '  * If fidelity is uncertain, DO NOT INVENT. Return unresolved_visual with: reason, description (what you see), location/context.',
            '  * Never hallucinate measurements, labels, or shapes not visible.',
            '- Direction: detect rtl (Arabic) vs ltr (English) vs mixed.',
            '- Return STRICT JSON ONLY. No markdown, no code fences, no commentary.',
            'Required JSON schema:',
            '{"version":1,"direction":"rtl"|"ltr","language":"ar"|"en"|"mixed","blocks":[',
            '  {"type":"paragraph","runs":[{"kind":"text","text":"..."}|{"kind":"inline_math","latex":"..."}]},',
            '  {"type":"heading","level":2,"runs":[...]},',
            '  {"type":"math","latex":"...","display":true},',
            '  {"type":"diagram","format":"svg","svg":"<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>"},',
            '  {"type":"list","ordered":false,"items":[{"marker":"-","runs":[...] }]},',
            '  {"type":"table","rows":[["a","b"]],"headerRow":true},',
            '  {"type":"chemical_equation","content":"2H_2 + O_2 \\rightarrow 2H_2O"},',
            '  {"type":"callout","text":"..."},',
            '  {"type":"separator"},',
            '  {"type":"unresolved_visual","reason":"complex_or_unclear_diagram","description":"triangle with labels A,B,C at vertices and 5cm on base"}',
            ']}',
        ]);

        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => [
                    ['type' => 'text', 'text' => 'Extract this educational question image into the strict JSON content_document. Transcribe faithfully: do not solve, summarize, or invent. Preserve Arabic, math as LaTeX, chemistry, tables, and describe any unreconstructable visual as unresolved_visual.'],
                    ['type' => 'image_url', 'image_url' => ['url' => "data:$mime;base64,$b64"]],
                ]],
            ],
            'temperature' => 0.1,
            'max_tokens' => 4096,
            'response_format' => ['type' => 'json_object'],
        ];

        try {
            $response = Http::timeout($timeout)->withToken($apiKey)->withHeaders(['Accept' => 'application/json'])->post($endpoint, $payload);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::warning('vision.connection_failed', ['endpoint' => $this->redactedEndpoint($endpoint), 'error' => $e->getMessage()]);
            throw new \RuntimeException('Vision provider failed: '.$e->getMessage());
        }

        if (!$response->successful()) {
            Log::warning('vision.extraction_failed', ['status' => $response->status(), 'body' => substr($response->body(), 0, 2000), 'endpoint' => $this->redactedEndpoint($endpoint)]);
            if ((int) $response->status() === 429) {
                throw new VisionProviderRateLimitedException('Vision provider rate limited: 429');
            }
            throw new \RuntimeException('Vision provider failed: '.$response->status());
        }

        $body = $response->body();
        if (strlen($body) > self::MAX_RESPONSE_BYTES * 4) {
            Log::warning('vision.response_too_large', ['bytes' => strlen($body)]);
            throw new \RuntimeException('Invalid vision JSON: response too large');
        }

        $content = $response->json('choices.0.message.content');
        if ($content === null) {
            $content = $response->json('message.content');
        }
        if ($content === null) {
            $raw = $response->json();
            if (isset($raw['content']) && is_string($raw['content'])) $content = $raw['content'];
            elseif (isset($raw['response']) && is_string($raw['response'])) $content = $raw['response'];
        }
        if (!is_string($content)) {
            $content = is_array($content) ? json_encode($content) : null;
            if (!is_string($content)) throw new \RuntimeException('Invalid vision response: missing content');
        }
        $content = trim($content);
        if ($content === '') throw new \RuntimeException('Invalid vision response: empty content');
        if (strlen($content) > self::MAX_RESPONSE_BYTES) throw new \RuntimeException('Invalid vision JSON: content too large');
        if (str_starts_with($content, '```')) {
            $content = preg_replace('/^```(?:json)?\s*/', '', $content) ?? $content;
            $content = preg_replace('/\s*```$/', '', $content) ?? $content;
        }
        $content = trim($content);
        try {
            $decoded = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            Log::warning('vision.invalid_json', ['content' => substr($content, 0, 3000)]);
            throw new \RuntimeException('Invalid vision JSON: '.$e->getMessage());
        }
        if (!is_array($decoded)) throw new \RuntimeException('Invalid vision JSON: not an object');
        return $decoded;
    }

    private function redactedEndpoint(string $endpoint): string
    {
        $parsed = parse_url($endpoint);
        return ($parsed['host'] ?? 'configured').(isset($parsed['path']) ? $parsed['path'] : '');
    }
}
