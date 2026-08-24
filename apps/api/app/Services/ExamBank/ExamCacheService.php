<?php

namespace App\Services\ExamBank;

use Illuminate\Support\Facades\Cache;

/**
 * Tenant-scoped, immutable-only cache for published exam payloads.
 *
 * Only data that NEVER varies per-student is cached here:
 *  - exam metadata (title, duration, scoring rules, …)
 *  - the sanitized published question content for a given (exam, question subset, reveal-correct flag)
 *
 * Per-attempt state (answers, isCorrect, timers, grading) is NEVER cached.
 *
 * Invalidation is version-based: every mutation that changes an exam's question
 * composition or published content bumps a per-exam version counter, which
 * transparently orphans every previously cached question-set key (the version is
 * part of the key). Metadata has its own short-TTL key that is forgotten on bump.
 */
final class ExamCacheService
{
    public const META_TTL_SECONDS = 60;

    public const QUESTION_SET_TTL_SECONDS = 300;

    private function metaKey(int $tenantId, int $examId): string
    {
        return "exam:{$tenantId}:{$examId}:meta";
    }

    private function versionKey(int $tenantId, int $examId): string
    {
        return "exam:{$tenantId}:{$examId}:v";
    }

    private function questionSetKey(int $tenantId, int $examId, string $subsetKey, bool $revealCorrect, int $version): string
    {
        return "exam:{$tenantId}:{$examId}:qs:{$version}:{$subsetKey}:" . ($revealCorrect ? '1' : '0');
    }

    /**
     * Short-TTL snapshot of stable exam metadata. Returns null on a miss.
     */
    public function meta(int $tenantId, int $examId): mixed
    {
        return Cache::get($this->metaKey($tenantId, $examId));
    }

    /**
     * @param  mixed  $value
     */
    public function setMeta(int $tenantId, int $examId, mixed $value): void
    {
        Cache::put($this->metaKey($tenantId, $examId), $value, self::META_TTL_SECONDS);
    }

    public function forgetMeta(int $tenantId, int $examId): void
    {
        Cache::forget($this->metaKey($tenantId, $examId));
    }

    /**
     * Immutable published question content for a (exam, subset, reveal-correct)
     * tuple, or null on a miss.
     */
    public function questionSet(int $tenantId, int $examId, string $subsetKey, bool $revealCorrect): mixed
    {
        $version = $this->version($tenantId, $examId);

        return Cache::get($this->questionSetKey($tenantId, $examId, $subsetKey, $revealCorrect, $version));
    }

    /**
     * @param  mixed  $value
     */
    public function setQuestionSet(int $tenantId, int $examId, string $subsetKey, bool $revealCorrect, mixed $value): void
    {
        $version = $this->version($tenantId, $examId);

        Cache::put(
            $this->questionSetKey($tenantId, $examId, $subsetKey, $revealCorrect, $version),
            $value,
            self::QUESTION_SET_TTL_SECONDS,
        );
    }

    /**
     * Invalidate EVERY cached representation of an exam (metadata + all question
     * subsets / reveal flags) by advancing the version counter. Safe to call on
     * any composition or publish-status change.
     */
    public function bump(int $tenantId, int $examId): void
    {
        Cache::increment($this->versionKey($tenantId, $examId));
        $this->forgetMeta($tenantId, $examId);
    }

    private function version(int $tenantId, int $examId): int
    {
        return (int) Cache::get($this->versionKey($tenantId, $examId), 0);
    }
}
