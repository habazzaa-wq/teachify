<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Exam attempt hardening:
 *
 * 1. Index (tenant_id, user_id, status) for the hot activeAttempt() lookup
 *    (tenant scope + user + in_progress), which previously had no covering
 *    index and degraded as attempts grew.
 *
 * 2. Duplicate-active-attempt invariant (MySQL only): a unique functional
 *    index over (tenant, user, exam) while an attempt is officially
 *    "in_progress" makes the database reject a second concurrent official
 *    attempt per exam even if future code bypasses the application-level
 *    row locks. The expression yields NULL for non-active rows, so the unique
 *    constraint only governs in_progress attempts.
 *
 *    Practice attempts are deliberately exempt: starting untimed practice is
 *    legal while another official attempt is in progress.
 *
 *    SQLite (test database) does not support functional indexes, so the
 *    invariant exists only on MySQL; application logic enforces the same rule
 *    everywhere else.
 */
return new class extends Migration
{
    private const GUARD_INDEX = 'exam_attempts_active_attempt_guard_unique';

    public function up(): void
    {
        if (!Schema::hasIndex('exam_attempts', 'exam_attempts_tenant_user_status_index')) {
            Schema::table('exam_attempts', function (Blueprint $table) {
                $table->index(['tenant_id', 'user_id', 'status'], 'exam_attempts_tenant_user_status_index');
            });
        }

        if ($this->isMysql()) {
            // Rows predating the invariant may hold several simultaneous
            // official in-progress attempts per (tenant, user, exam); the
            // unique index below would refuse to build over them. Resolve
            // exactly like start() does: keep the oldest in-progress attempt,
            // close the newer ones as submitted (they are graded lazily by
            // the normal expiry path).
            DB::statement(sprintf(
                'UPDATE `%1$s` newer
                 JOIN `%1$s` keeper
                   ON keeper.`tenant_id` = newer.`tenant_id`
                  AND keeper.`user_id` = newer.`user_id`
                  AND keeper.`exam_id` = newer.`exam_id`
                  AND keeper.`id` = (
                      SELECT `min_id` FROM (
                          SELECT MIN(oldest.`id`) AS `min_id` FROM `%1$s` oldest
                           WHERE oldest.`tenant_id` = newer.`tenant_id`
                             AND oldest.`user_id` = newer.`user_id`
                             AND oldest.`exam_id` = newer.`exam_id`
                             AND oldest.`status` = \'in_progress\'
                             AND oldest.`is_practice` = 0
                      ) AS `guard_keep`
                  )
                 SET newer.`status` = \'submitted\',
                     newer.`submitted_at` = NOW()
                 WHERE newer.`status` = \'in_progress\'
                   AND newer.`is_practice` = 0
                   AND newer.`id` <> keeper.`id`',
                $this->prefixTable(),
            ));

            if (!Schema::hasIndex('exam_attempts', self::GUARD_INDEX)) {
                // Enforce "at most one official in_progress attempt per
                // (tenant, user, exam)" at the DB level via a unique
                // functional index. A stored generated column is avoided on
                // purpose: adding one to a table that already has foreign
                // keys fails on MySQL with errno 1215.
                DB::statement(sprintf(
                    'ALTER TABLE `%s` ADD UNIQUE INDEX `%s` ((IF(`status` = \'in_progress\' AND `is_practice` = 0, CONCAT_WS(\':\', `tenant_id`, `user_id`, `exam_id`), NULL)))',
                    $this->prefixTable(),
                    self::GUARD_INDEX,
                ));
            }
        }
    }

    public function down(): void
    {
        if ($this->isMysql()) {
            if (Schema::hasIndex('exam_attempts', self::GUARD_INDEX)) {
                DB::statement(sprintf(
                    'ALTER TABLE `%s` DROP INDEX `%s`',
                    $this->prefixTable(),
                    self::GUARD_INDEX,
                ));
            }
        }

        if (Schema::hasIndex('exam_attempts', 'exam_attempts_tenant_user_status_index')) {
            Schema::table('exam_attempts', function (Blueprint $table) {
                $table->dropIndex('exam_attempts_tenant_user_status_index');
            });
        }
    }

    private function isMysql(): bool
    {
        return Schema::getConnection()->getDriverName() === 'mysql';
    }

    private function prefixTable(): string
    {
        return (Schema::getConnection()->getTablePrefix().'exam_attempts');
    }
};
