<?php

namespace Tests\Unit;

use App\Services\ExamBank\ExamCacheService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * P2 verification: the immutable exam cache is tenant-scoped, version-bumped on
 * mutation, and never serves cross-tenant or stale content.
 */
class ExamCacheServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }


    public function test_question_set_miss_then_hit_then_invalidated_on_bump(): void
    {
        $cache = new ExamCacheService();
        $tenantId = 7;
        $examId = 11;

        $this->assertNull($cache->questionSet($tenantId, $examId, '', false));

        $payload = [['examQuestionId' => 1, 'content' => ['options' => []]]];
        $cache->setQuestionSet($tenantId, $examId, '', false, $payload);

        $this->assertSame($payload, $cache->questionSet($tenantId, $examId, '', false));

        // A different reveal-correct flag is a distinct key.
        $this->assertNull($cache->questionSet($tenantId, $examId, '', true));

        // Bumping the exam invalidates the cached question set.
        $cache->bump($tenantId, $examId);
        $this->assertNull($cache->questionSet($tenantId, $examId, '', false));
    }

    public function test_cache_is_isolated_across_tenants(): void
    {
        $cache = new ExamCacheService();
        $examId = 42;

        $cache->setQuestionSet(1, $examId, '', false, ['tenant' => 'one']);
        $cache->setQuestionSet(2, $examId, '', false, ['tenant' => 'two']);

        $this->assertSame(['tenant' => 'one'], $cache->questionSet(1, $examId, '', false));
        $this->assertSame(['tenant' => 'two'], $cache->questionSet(2, $examId, '', false));

        // Bumping tenant 1 does not affect tenant 2.
        $cache->bump(1, $examId);
        $this->assertNull($cache->questionSet(1, $examId, '', false));
        $this->assertSame(['tenant' => 'two'], $cache->questionSet(2, $examId, '', false));
    }

    public function test_meta_is_cached_and_invalidated_on_bump(): void
    {
        $cache = new ExamCacheService();
        $tenantId = 3;
        $examId = 9;

        $this->assertNull($cache->meta($tenantId, $examId));

        $meta = ['title' => 'Midterm', 'totalPoints' => 100];
        $cache->setMeta($tenantId, $examId, $meta);
        $this->assertSame($meta, $cache->meta($tenantId, $examId));

        $cache->bump($tenantId, $examId);
        $this->assertNull($cache->meta($tenantId, $examId));
    }

    public function test_subset_key_isolates_practice_from_full_exam(): void
    {
        $cache = new ExamCacheService();
        $tenantId = 5;
        $examId = 8;

        $cache->setQuestionSet($tenantId, $examId, '', false, ['subset' => 'full']);
        $cache->setQuestionSet($tenantId, $examId, '3-7-11', false, ['subset' => 'practice']);

        $this->assertSame(['subset' => 'full'], $cache->questionSet($tenantId, $examId, '', false));
        $this->assertSame(['subset' => 'practice'], $cache->questionSet($tenantId, $examId, '3-7-11', false));
    }
}
