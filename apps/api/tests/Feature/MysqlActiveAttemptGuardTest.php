<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Proves the MySQL-only unique functional index
 * `exam_attempts_active_attempt_guard_unique` enforces "at most one official
 * in_progress attempt per (tenant, user, exam)" at the database level. SQLite
 * cannot build functional indexes, so this is skipped outside MySQL and is the
 * regression companion to the P0 guard migration.
 */
class MysqlActiveAttemptGuardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL-only unique functional index guard is not present on SQLite.');
        }
    }

    private function seedTenantAndExam(): int
    {
        DB::table('tenants')->insert([
            'id' => 1, 'name' => 'Guard Tenant', 'slug' => 'guard-tenant-'.uniqid(),
            'status' => 'active', 'timezone' => 'Asia/Riyadh', 'language' => 'ar',
            'currency' => 'SAR', 'created_at' => now(), 'updated_at' => now(),
        ]);

        return DB::table('exams')->insertGetId([
            'tenant_id' => 1, 'title' => 'Guard Exam', 'slug' => 'guard-exam-'.uniqid(),
            'status' => 'published', 'language' => 'ar', 'passing_score' => 60,
            'total_points' => 0, 'show_results' => 1, 'show_correct_answers' => 1,
            'allow_review' => 1, 'shuffle_questions' => 0, 'shuffle_choices' => 0,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function test_second_official_in_progress_attempt_is_rejected(): void
    {
        $examId = $this->seedTenantAndExam();
        $tuple = [
            'tenant_id' => 1, 'exam_id' => $examId, 'user_id' => 4242,
            'status' => 'in_progress', 'is_practice' => 0, 'is_official' => 1,
            'started_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ];

        DB::table('exam_attempts')->insert($tuple);

        $this->expectException(QueryException::class);
        DB::table('exam_attempts')->insert($tuple);
    }

    public function test_practice_attempt_is_exempt_from_guard(): void
    {
        $examId = $this->seedTenantAndExam();

        DB::table('exam_attempts')->insert([
            'tenant_id' => 1, 'exam_id' => $examId, 'user_id' => 4243,
            'status' => 'in_progress', 'is_practice' => 0, 'is_official' => 1,
            'started_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);

        // A practice attempt for the same (tenant, user, exam) must be allowed.
        $practiceId = DB::table('exam_attempts')->insertGetId([
            'tenant_id' => 1, 'exam_id' => $examId, 'user_id' => 4243,
            'status' => 'in_progress', 'is_practice' => 1, 'is_official' => 0,
            'started_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->assertNotNull($practiceId);
        $this->assertSame(2, DB::table('exam_attempts')
            ->where('tenant_id', 1)->where('user_id', 4243)->where('exam_id', $examId)
            ->where('status', 'in_progress')->count());
    }
}
