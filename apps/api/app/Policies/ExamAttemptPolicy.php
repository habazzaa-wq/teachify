<?php

namespace App\Policies;

use App\Models\ExamAttempt;
use App\Models\User;

class ExamAttemptPolicy
{
    public function __construct(
        private readonly ExamPolicy $exams,
    ) {}

    /**
     * Owner-scoped read of an attempt. Mirrors `update`/`submit` and the
     * ownership predicates in ExamSessionService::ensureAttemptOwnedByUser()
     * and ExamResultService::ensureOwnedByUser().
     */
    public function view(User $user, ExamAttempt $attempt): bool
    {
        return $attempt->tenant_id === currentTenant()->id && $attempt->user_id === $user->id;
    }

    public function update(User $user, ExamAttempt $attempt): bool
    {
        return $this->view($user, $attempt);
    }

    public function submit(User $user, ExamAttempt $attempt): bool
    {
        return $this->view($user, $attempt);
    }

    /**
     * Read access to an attempt's answer pages (Phase C).
     *
     * Two independent legs, either alone grants access:
     *
     *  1. Student leg — the attempt owner, using the exact predicate from
     *     `view()` (tenant + user match). This is the same ownership check the
     *     upload path and ExamResultService rely on, so a student can always
     *     review their own submitted pages (matching ExamResultService, which
     *     lets the owner read a finalized attempt's results).
     *
     *  2. Teacher leg — the tenant must match (cross-tenant attempts never
     *     resolve here) AND the user must be authorized to manage THIS exam via
     *     ExamPolicy::update(), the existing gate that protects every teacher
     *     exam-management endpoint today (see ExamController). This is a NEW
     *     grading-scoped ability: ExamAttemptPolicy previously only had
     *     owner-scoped abilities.
     */
    public function viewPages(User $user, ExamAttempt $attempt): bool
    {
        if ($this->view($user, $attempt)) {
            return true;
        }

        if ($attempt->tenant_id !== currentTenant()->id) {
            return false;
        }

        $exam = $attempt->exam()->first();

        if ($exam === null || $exam->tenant_id !== currentTenant()->id) {
            return false;
        }

        return $this->exams->update($user, $exam);
    }
}
