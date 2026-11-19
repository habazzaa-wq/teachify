<?php

namespace App\Support;

/**
 * Keep client controlled page sizes bounded so one request cannot hydrate an
 * unbounded set of rows and relationships into PHP memory.
 */
final class Pagination
{
    public const MAX_PER_PAGE = 100;

    public static function perPage(mixed $value, int $default = 25, int $maximum = self::MAX_PER_PAGE): int
    {
        $maximum = max(1, min($maximum, self::MAX_PER_PAGE));
        $default = max(1, min($default, $maximum));
        $parsed = filter_var($value, FILTER_VALIDATE_INT);

        if ($parsed === false) {
            return $default;
        }

        return min(max($parsed, 1), $maximum);
    }
}
