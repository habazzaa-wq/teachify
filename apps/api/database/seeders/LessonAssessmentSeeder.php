<?php

namespace Database\Seeders;

use App\Models\CourseLesson;
use App\Models\Exam;
use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class LessonAssessmentSeeder extends Seeder
{
    private Tenant $tenant;

    private int $totalLessons = 0;

    private int $lessonsLinked = 0;

    private int $lessonsSkipped = 0;

    private int $lessonsUnchanged = 0;

    private int $examsAvailable = 0;

    /** @var array<int, int> exam_id => usage count */
    private array $examUsage = [];

    public function run(): void
    {
        $startTime = microtime(true);

        $this->resolveTenant();

        $exams = $this->loadExams();
        $lessons = $this->loadLessons();

        if ($exams->isEmpty() || $lessons->isEmpty()) {
            $this->command->warn('  Skipped: No exams or no lessons found.');
            $this->printReport(microtime(true) - $startTime);

            return;
        }

        $this->examsAvailable = $exams->count();

        $this->assignExamsToLessons($lessons, $exams);

        $this->printReport(microtime(true) - $startTime);
    }

    private function resolveTenant(): void
    {
        $domain = TenantDomain::where('domain', 'hazem.academy.test')
            ->where('status', 'active')
            ->first();
        $this->tenant = $domain?->tenant ?? Tenant::firstOrFail();

        app()->instance(Tenant::class, $this->tenant);
        app()->instance('currentTenant', $this->tenant);
    }

    private function loadExams(): Collection
    {
        return Exam::where('tenant_id', $this->tenant->id)
            ->where('status', 'published')
            ->whereNull('deleted_at')
            ->get();
    }

    private function loadLessons(): Collection
    {
        return CourseLesson::where('tenant_id', $this->tenant->id)
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->get();
    }

    private function assignExamsToLessons(Collection $lessons, Collection $exams): void
    {
        $this->totalLessons = $lessons->count();

        $unlinked = $lessons->filter(fn (CourseLesson $l) => $l->exam_id === null);

        $alreadyLinked = $this->totalLessons - $unlinked->count();
        $this->lessonsUnchanged = $alreadyLinked;

        $targetLinked = (int) ceil($this->totalLessons * 0.6);
        $toAssign = max(0, $targetLinked - $alreadyLinked);

        $candidates = $unlinked->values();

        $shuffled = $candidates->shuffle();

        $selected = $shuffled->take($toAssign);

        $examIds = $exams->pluck('id')->values()->all();
        $examCount = count($examIds);

        foreach ($selected as $index => $lesson) {
            $examId = $examIds[$index % $examCount];

            $lesson->forceFill([
                'exam_id' => $examId,
                'lesson_type' => 'exam',
            ])->save();

            $this->lessonsLinked++;
            $this->examUsage[$examId] = ($this->examUsage[$examId] ?? 0) + 1;
        }

        $this->lessonsSkipped = $this->totalLessons - $this->lessonsLinked - $this->lessonsUnchanged;
    }

    private function printReport(float $elapsed): void
    {
        $elapsed = round($elapsed, 2);
        $linked = $this->lessonsLinked + $this->lessonsUnchanged;
        $withoutExam = $this->totalLessons - $linked;

        $usageValues = array_values($this->examUsage);
        $avgUsage = $this->examsAvailable > 0
            ? round(array_sum($usageValues) / $this->examsAvailable, 1)
            : 0;

        $mostUsedExam = '';
        $leastUsedExam = '';
        if ($this->examUsage) {
            $mostUsedId = array_search(max($this->examUsage), $this->examUsage);
            $leastUsedId = array_search(min($this->examUsage), $this->examUsage);
            $mostExam = Exam::where('tenant_id', $this->tenant->id)->find($mostUsedId);
            $leastExam = Exam::where('tenant_id', $this->tenant->id)->find($leastUsedId);
            $mostUsedExam = $mostExam ? "{$mostExam->title} ({$this->examUsage[$mostUsedId]}x)" : 'N/A';
            $leastUsedExam = $leastExam ? "{$leastExam->title} ({$this->examUsage[$leastUsedId]}x)" : 'N/A';
        }

        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════════════════');
        $this->command->info('  Lesson Assessment Integration Complete');
        $this->command->info('═══════════════════════════════════════════════════════');
        $this->command->info("  Lessons                  : {$this->totalLessons}");
        $this->command->info("  Lessons With Exams       : {$linked}");
        $this->command->info("  Lessons Without Exams    : {$withoutExam}");
        $this->command->info("  Exams Reused             : {$this->examsAvailable}");
        $this->command->info("  Average Usage Per Exam   : {$avgUsage}");
        $this->command->info("  Most Used Exam           : {$mostUsedExam}");
        $this->command->info("  Least Used Exam          : {$leastUsedExam}");
        $this->command->info("  Skipped Lessons          : {$this->lessonsSkipped}");
        $this->command->info("  Execution Time           : {$elapsed}s");
        $this->command->info('═══════════════════════════════════════════════════════');
    }
}
