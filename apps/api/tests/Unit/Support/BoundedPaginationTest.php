<?php

namespace Tests\Unit\Support;

use App\Support\Pagination;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class BoundedPaginationTest extends TestCase
{
    public function test_invalid_values_use_the_configured_default(): void
    {
        self::assertSame(25, Pagination::perPage(null));
        self::assertSame(12, Pagination::perPage('invalid', 12));
        self::assertSame(12, Pagination::perPage('1.5', 12));
    }

    #[DataProvider('pageSizeCases')]
    public function test_page_size_is_clamped(mixed $input, int $default, int $maximum, int $expected): void
    {
        self::assertSame($expected, Pagination::perPage($input, $default, $maximum));
    }

    public static function pageSizeCases(): array
    {
        return [
            'zero becomes one' => [0, 25, 100, 1],
            'negative becomes one' => [-20, 25, 100, 1],
            'large request is capped' => [10000, 25, 100, 100],
            'endpoint cap is respected' => [100, 12, 48, 48],
            'invalid maximum remains safe' => [100, 25, 0, 1],
        ];
    }
}
