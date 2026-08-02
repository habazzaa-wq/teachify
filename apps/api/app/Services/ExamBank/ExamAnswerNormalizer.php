<?php

namespace App\Services\ExamBank;

/**
 * Shared helpers for normalizing student answers before validation/grading.
 */
final class ExamAnswerNormalizer
{
    /**
     * Normalizes a list of option ids to a canonical sorted list of strings so
     * that grading is order-independent and string/int ids compare equally.
     *
     * @param  iterable<mixed>  $ids
     * @return list<string>
     */
    public static function ids(iterable $ids): array
    {
        return collect($ids)
            ->map(fn (mixed $id): string => (string) $id)
            ->unique()
            ->sort()
            ->values()
            ->all();
    }
}
