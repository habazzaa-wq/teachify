<?php

namespace App\Console\Commands;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Models\CourseSection;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantIntegration;
use App\Models\TenantProvisioningStep;
use App\Models\TenantSetting;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Platform\TenantCreationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seeds three isolated staging tenants (alpha, beta, gamma) with a bounded,
 * deterministic multi-tenant dataset sized for the load-test suite, and exports
 * per-student bearer tokens to a students.csv consumed by the k6 identity
 * rotation (load-tests/common.js).
 *
 * The dataset mirrors production shapes as closely as the seeders allow:
 *   - tenants created through TenantCreationService (roles/permissions/settings/
 *     domain/integrations/provisioning steps) so the platform provisioning path is
 *     exercised;
 *   - admin + 3 instructors + N students per tenant;
 *   - C enrolled_only published courses, each with one published exam lesson
 *     containing Q questions (all six ExamSessionService-supported types, always
 *     including at least one essay);
 *   - every student actively enrolled in every course (satisfies the
 *     enrolled_only access rule);
 *   - pre-seeded exam attempts (in_progress / grading / submitted) distributed
 *     over the first `attempts` students so dashboards and analytics are not
 *     empty;
 *   - students WITHOUT an in_progress attempt get a Sanctum token and are
 *     exported to the CSV, so k6 rotations never collide with a pre-existing
 *     active attempt and never trip the per-user throttles (start/submit are
 *     throttled at 10/min, progress/answer at 300/min).
 *
 * Deterministic: re-running with the same options produces the same rows, so
 * vaulted keys (answer keys) are stable across runs. Idempotency is enforced by
 * refusing to run when staging tenants already exist; use --reset to drop and
 * re-create them (dependency-ordered delete, no prod data is ever touched).
 */
class StagingSeedLoadTest extends Command
{
    protected $signature = 'staging:seed-load-test
        {--students=200 : students per tenant, bounded 4..600}
        {--courses=4 : exam courses per tenant, bounded 2..6}
        {--questions=20 : questions per exam, bounded 10..40}
        {--attempts=120 : pre-seeded attempts per tenant, bounded 0..students}
        {--output= : students.csv path (default storage/app/staging/students.csv)}
        {--password= : seed account password (default env STAGING_SEED_PASSWORD)}
        {--reset : drop existing staging tenants (alpha,beta,gamma) first}';

    protected $description = 'Seed isolated multi-tenant staging data for the load-test suite and export k6 student identities';

    private const STAGING_SLUGS = ['alpha', 'beta', 'gamma'];

    /**
     * @var list<array<string, string>>
     */
    private array $csvRows = [];

    /**
     * @return array<string, array{name: string, owner_name: string, owner_email: string}>
     */
    private function tenantPlans(): array
    {
        return [
            'alpha' => [
                'name' => 'Alpha Academy',
                'owner_name' => 'Alpha Owner',
                'owner_email' => 'owner@alpha.staging.local',
            ],
            'beta' => [
                'name' => 'Beta Academy',
                'owner_name' => 'Beta Owner',
                'owner_email' => 'owner@beta.staging.local',
            ],
            'gamma' => [
                'name' => 'Gamma Learning',
                'owner_name' => 'Gamma Owner',
                'owner_email' => 'owner@gamma.staging.local',
            ],
        ];
    }

    public function handle(TenantCreationService $creation): int
    {
        $options = $this->boundedOptions();

        if ($this->hasStagingTenants()) {
            if (! $this->option('reset')) {
                $this->error('Staging tenants already exist ('.implode(', ', $this->existingStagingSlugs()).').');
                $this->error('Re-run with --reset to drop and re-create them, or omit --reset to keep the dataset.');
                $this->line('  php artisan staging:seed-load-test --reset'.($this->userOptionsSuffix()));

                return self::FAILURE;
            }

            $this->wipeStagingTenants();
        }

        foreach ($this->tenantPlans() as $slug => $plan) {
            $this->info("Seeding tenant: {$slug}");
            $this->seedTenant($slug, $plan, $options);
        }

        $path = $this->writeCsv();

        $this->newLine();
        $this->info('Load-test seed complete.');
        $this->line('  tenants      : alpha, beta, gamma (platform-provisioning path)');
        $this->line('  students     : '.$options['students'].' per tenant ('.($options['students'] * 3).' total)');
        $this->line('  courses      : '.$options['courses'].' per tenant, enrolled_only, published');
        $this->line('  questions    : '.$options['questions'].' per exam (6 supported types, incl. essay)');
        $this->line('  attempts     : '.$options['attempts'].' pre-seeded per tenant');
        $this->line('  identities   : '.$path);

        return self::SUCCESS;
    }

    /**
     * @param  array{name: string, owner_name: string, owner_email: string}  $plan
     * @param  array{students: int, courses: int, questions: int, attempts: int, password: string}  $options
     */
    private function seedTenant(string $slug, array $plan, array $options): void
    {
        $password = $options['password'];

        DB::transaction(function () use ($slug, $plan, $options, $password): void {
            $created = $this->tenantCreation()->create([
                'academy_name' => $plan['name'],
                'academy_slug' => $slug,
                'owner_name' => $plan['owner_name'],
                'owner_email' => $plan['owner_email'],
                'owner_password' => $password,
            ]);

            $tenant = $created['tenant'];
            $this->bindTenant($tenant, $created['membership']);
            $this->info("  created tenant #{$tenant->id} ({$plan['name']})");

            $roles = Role::query()
                ->where('tenant_id', $tenant->id)
                ->pluck('id', 'slug')
                ->all();

            $admin = $this->createMember($tenant, ['admin'], "admin@{$slug}.staging.local", 'Admin', $password, $roles);
            $instructors = [];
            foreach (range(1, 3) as $i) {
                $instructors[] = $this->createMember($tenant, ['instructor'], "instructor-{$i}@{$slug}.staging.local", "Instructor {$i}", $password, $roles);
            }

            $studentMemberships = [];
            foreach (range(1, $options['students']) as $i) {
                $studentMemberships[] = $this->createMember($tenant, ['student'], "student-{$i}@{$slug}.staging.local", "Student {$i}", $password, $roles);
            }

            $this->info('  students created');

            $lessons = $this->createCourseTree($tenant, $admin, $instructors, $options, $roles);

            foreach ($studentMemberships as $membership) {
                foreach ($lessons as $lesson) {
                    CourseEnrollment::create([
                        'tenant_id' => $tenant->id,
                        'course_id' => $lesson['course']->id,
                        'tenant_user_id' => $membership->id,
                        'status' => 'active',
                        'enrolled_at' => now()->subDays(rand(1, 20)),
                        'metadata' => ['source' => 'staging_seeder'],
                    ]);
                }
            }

            $this->info('  enrollments created ('.count($studentMemberships).' students x '.count($lessons).' courses)');

            $this->seedAttempts($tenant, $options, $studentMemberships, $lessons);

            $this->issueTokens($tenant, $options, $studentMemberships, $lessons, $slug);
        });
    }

    /**
     * Creates published courses + exam-backed lessons + exam questions.
     *
     * @param  array<int, TenantUser>  $instructors
     * @param  array{students: int, courses: int, questions: int, attempts: int, password: string}  $options
     * @param  array<string, int>  $roles
     * @return list<array{course: Course, lesson: CourseLesson, exam: Exam, examQuestions: list<ExamQuestion>}>
     */
    private function createCourseTree(Tenant $tenant, TenantUser $admin, array $instructors, array $options, array $roles): array
    {
        $exams = [];
        $createdBy = $admin->id;

        for ($c = 1; $c <= $options['courses']; $c++) {
            $courseTitle = "{$tenant->name} Course {$c}";

            $course = Course::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $createdBy,
                'primary_instructor_tenant_user_id' => $instructors[($c - 1) % count($instructors)]->id,
                'title' => $courseTitle,
                'slug' => Str::slug($courseTitle),
                'short_description' => $this->courseDescriptions()[$c % count($this->courseDescriptions())],
                'status' => 'published',
                'visibility' => 'enrolled_only',
                'difficulty' => 'intermediate',
                'language' => 'en',
                'duration' => 30,
                'pricing_type' => 'free',
                'price_amount' => 0,
                'price_currency' => 'USD',
                'certificate_enabled' => true,
                'featured' => false,
                'published_at' => now()->subDays(7),
            ]);

            $section = CourseSection::create([
                'tenant_id' => $tenant->id,
                'course_id' => $course->id,
                'course_module_id' => $this->createModule($tenant, $course, $createdBy)->id,
                'title' => "{$courseTitle} — Exam Section",
                'slug' => Str::slug("{$courseTitle} Exam Section"),
                'sort_order' => 1,
                'status' => 'published',
                'is_published' => true,
                'locked' => false,
            ]);

            $exam = Exam::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $createdBy,
                'title' => "{$courseTitle} Exam",
                'description' => "Load-test exam {$c} for {$tenant->name}.",
                'category' => 'load-test',
                'status' => 'published',
                'visibility' => 'public',
                'language' => 'en',
                'duration' => 30,
                'passing_score' => 60,
                'attempt_limit' => null,
                'shuffle_questions' => false,
                'shuffle_choices' => false,
                'show_results' => true,
                'show_correct_answers' => true,
                'allow_review' => true,
                'negative_marking' => false,
                'certificate_eligible' => true,
                'pinned' => false,
                'featured' => false,
            ]);
            $exam->forceFill(['published_at' => now()->subDays(7)])->save();

            $examQuestions = [];
            $questionTypes = ['single_choice', 'multiple_choice', 'true_false', 'numeric', 'essay', 'short_answer'];

            for ($q = 1; $q <= $options['questions']; $q++) {
                // Rotate through types but guarantee at least one essay and one
                // of each supported type per exam (types list is deterministic).
                $type = $questionTypes[($q - 1) % count($questionTypes)];
                $content = $this->contentFor($type, $q);

                $question = Question::create([
                    'tenant_id' => $tenant->id,
                    'created_by_tenant_user_id' => $createdBy,
                    'title' => "{$courseTitle} Question {$q} ({$type})",
                    'slug' => Str::slug("{$courseTitle} Question {$q} {$type}"),
                    'description' => null,
                    'type' => $type,
                    'difficulty' => 'medium',
                    'tags' => ['staging', 'load-test'],
                    'points' => 1,
                    'estimated_time' => 60,
                    'language' => 'en',
                    'status' => 'published',
                    'visibility' => 'public',
                    'shuffle_options' => false,
                    'explanation' => null,
                    'hint' => null,
                    'content' => $content,
                    'metadata' => ['source' => 'staging_seeder'],
                ]);

                $examQuestion = ExamQuestion::create([
                    'tenant_id' => $tenant->id,
                    'created_by_tenant_user_id' => $createdBy,
                    'exam_id' => $exam->id,
                    'question_id' => $question->id,
                    'section' => null,
                    'order' => $q,
                    'points' => 1,
                ]);
                $examQuestions[] = $examQuestion;
            }

            // Update exam aggregate counts.
            $exam->forceFill([
                'question_count' => $options['questions'],
                'total_points' => $options['questions'],
            ])->save();

            $lesson = CourseLesson::create([
                'tenant_id' => $tenant->id,
                'course_id' => $course->id,
                'course_section_id' => $section->id,
                'title' => "{$courseTitle} — Exam",
                'slug' => Str::slug("{$courseTitle} Exam"),
                'short_description' => 'Load-test exam lesson.',
                'type' => 'exam',
                'lesson_type' => 'exam',
                'status' => 'published',
                'visibility' => 'enrolled_only',
                'sort_order' => 1,
                'estimated_duration' => 30,
                'free_preview' => false,
                'downloadable' => false,
                'featured' => false,
                'comments_enabled' => false,
                'exam_id' => $exam->id,
                'published_at' => now()->subDays(7),
            ]);

            $exams[] = [
                'course' => $course,
                'lesson' => $lesson,
                'exam' => $exam,
                'examQuestions' => $examQuestions,
            ];

            $this->info("  course {$c}: lesson #{$lesson->id}, exam #{$exam->id} ({$options['questions']} questions)");
        }

        return $exams;
    }

    /**
     * course_sections.course_module_id is NOT NULL outside the `testing`
     * environment (2026_07_06_183200 migration), so every section needs a
     * real CourseModule — mirror of the production default-module flow.
     */
    private function createModule(Tenant $tenant, Course $course, int $createdBy): CourseModule
    {
        return CourseModule::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => "{$course->title} — Module",
            'slug' => Str::slug("{$course->title} Module"),
            'description' => null,
            'order' => 0,
            'status' => 'published',
            'is_published' => true,
            'featured' => false,
            'published_at' => now()->subDays(7),
        ]);
    }

    /**
     * @param  array<int, TenantUser>  $studentMemberships
     * @param  list<array{course: Course, lesson: CourseLesson, exam: Exam, examQuestions: list<ExamQuestion>}>  $lessons
     */
    private function seedAttempts(Tenant $tenant, array $options, array $studentMemberships, array $lessons): void
    {
        $attempts = $options['attempts'];

        if ($attempts === 0) {
            return;
        }

        $count = min($attempts, count($studentMemberships));
        $questionsPerExam = $options['questions'];

        for ($i = 0; $i < $count; $i++) {
            $membership = $studentMemberships[$i];
            $lesson = $lessons[$i % count($lessons)];
            $exam = $lesson['exam'];
            $examQuestions = $lesson['examQuestions'];
            $bucket = $i % 10;

            // Deterministic status mix:
            //   0-5   in_progress (60%)
            //   6-7   submitted   (20%)
            //   8-9   grading     (20%)
            if ($bucket < 6) {
                $this->seedInProgressAttempt($tenant, $membership, $exam, $examQuestions, $i % 8 === 0);
            } elseif ($bucket < 8) {
                $this->seedSubmittedAttempt($tenant, $membership, $exam, $examQuestions);
            } else {
                $this->seedGradingAttempt($tenant, $membership, $exam, $examQuestions);
            }
        }

        $this->info("  pre-seeded {$count} attempts (`--attempts`)");
    }

    private function seedInProgressAttempt(Tenant $tenant, TenantUser $membership, Exam $exam, array $examQuestions, bool $expired): void
    {
        $answeredCount = rand(0, count($examQuestions));
        $attempt = ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam->id,
            'user_id' => $membership->user_id,
            'is_official' => true,
            'is_practice' => false,
            'status' => 'in_progress',
            'current_question_index' => $answeredCount,
            'started_at' => now()->subMinutes(rand(2, 20)),
            'timer_ends_at' => $expired
                ? now()->subMinutes(rand(1, 25))
                : now()->addMinutes(rand(1, 25)),
            'included_exam_question_ids' => null,
        ]);

        foreach (array_slice($examQuestions, 0, $answeredCount) as $i => $examQuestion) {
            $this->seedAnswer($tenant, $attempt, $examQuestion, $i < 5, inProgress: true);
        }
    }

    private function seedSubmittedAttempt(Tenant $tenant, TenantUser $membership, Exam $exam, array $examQuestions): void
    {
        $answeredCount = count($examQuestions);
        $attempt = ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam->id,
            'user_id' => $membership->user_id,
            'is_official' => true,
            'is_practice' => false,
            'status' => 'submitted',
            'current_question_index' => $answeredCount,
            'started_at' => now()->subMinutes(rand(5, 45)),
            'submitted_at' => now()->subMinutes(rand(1, 40)),
            'timer_ends_at' => null,
            'duration_seconds' => rand(60, 1200),
        ]);

        $earned = 0;
        foreach ($examQuestions as $i => $examQuestion) {
            [$answer, $ok] = $this->seedAnswer($tenant, $attempt, $examQuestion, $i % 2 === 0, inProgress: false);
            if ($ok) {
                $earned++;
            }
        }

        $max = (int) $exam->total_points;
        $percentage = $max > 0 ? round(($earned / $max) * 100, 2) : 0.0;

        $attempt->forceFill([
            'score' => $earned,
            'max_score' => $max,
            'percentage' => $percentage,
            'passed' => $percentage >= (int) $exam->passing_score,
        ])->save();
    }

    private function seedGradingAttempt(Tenant $tenant, TenantUser $membership, Exam $exam, array $examQuestions): void
    {
        $answeredCount = rand(1, count($examQuestions));
        $attempt = ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam->id,
            'user_id' => $membership->user_id,
            'is_official' => true,
            'is_practice' => false,
            'status' => 'grading',
            'current_question_index' => $answeredCount,
            'started_at' => now()->subMinutes(rand(5, 30)),
            'timer_ends_at' => now()->subMinutes(rand(0, 10)),
            'submitted_at' => null,
            'duration_seconds' => rand(60, 900),
        ]);

        foreach (array_slice($examQuestions, 0, $answeredCount) as $i => $examQuestion) {
            $this->seedAnswer($tenant, $attempt, $examQuestion, $i % 2 === 0, inProgress: true);
        }
    }

    /**
     * @return array{0: mixed, 1: bool} answer + auto-correct-flag (self-checked choice/numeric)
     */
    private function seedAnswer(Tenant $tenant, ExamAttempt $attempt, ExamQuestion $examQuestion, bool $correct, bool $inProgress): array
    {
        $question = $examQuestion->question()->first();
        $content = $question->content;

        $answer = match ($question->type) {
            'single_choice', 'multiple_choice' => $this->choiceAnswer($content, $question->type, $correct),
            'true_false' => $correct ? 'true' : 'false',
            'numeric' => $correct ? (string) $content['correct'] : (string) (is_numeric($content['correct']) ? $content['correct'] + 7 : 13),
            'essay', 'short_answer' => 'Seeded '.$question->type.' answer text for load-test realism.',
            default => 'sample',
        };

        // Auto-checkable types can be marked correct immediately; essay and
        // short_answer always end up pending_manual_review (matches the real
        // grading flow where only choice/numeric/boolean are auto-graded).
        $autoGradable = in_array($question->type, ['single_choice', 'multiple_choice', 'true_false', 'numeric'], true);

        ExamAttemptAnswer::create([
            'tenant_id' => $tenant->id,
            'exam_attempt_id' => $attempt->id,
            'exam_question_id' => $examQuestion->id,
            'question_id' => $question->id,
            'answer' => $answer,
            'answer_mode' => 'inline',
            'grading_status' => $inProgress || ! $autoGradable ? 'pending_manual_review' : 'auto_graded',
            'is_correct' => $inProgress || ! $autoGradable ? null : $correct,
            'earned_points' => $inProgress || ! $autoGradable ? 0 : ($correct ? (int) $examQuestion->points : 0),
            'answered_at' => now()->subMinutes(rand(0, 30)),
        ]);

        return [$answer, $correct && $autoGradable];
    }

    private function choiceAnswer(array $content, string $type, bool $correct): array
    {
        $options = $content['options'] ?? [];

        if ($type === 'single_choice') {
            if ($options === []) {
                return ['opt-1'];
            }

            if ($correct) {
                return [collect($options)->firstWhere('correct', true)['id'] ?? $options[0]['id']];
            }

            return [collect($options)->firstWhere('correct', false)['id'] ?? $options[0]['id']];
        }

        // multiple_choice
        if ($options === []) {
            return ['opt-1'];
        }

        if ($correct) {
            $ids = collect($options)->where('correct', true)->pluck('id')->values()->take(2)->all();

            return $ids !== [] ? $ids : [$options[0]['id']];
        }

        $ids = collect($options)->where('correct', false)->pluck('id')->values()->take(2)->all();

        return $ids !== [] ? $ids : [$options[0]['id']];
    }

    /**
     * @param  array<int, TenantUser>  $studentMemberships
     * @param  list<array{course: Course, lesson: CourseLesson, exam: Exam, examQuestions: list<ExamQuestion>}>  $lessons
     */
    private function issueTokens(Tenant $tenant, array $options, array $studentMemberships, array $lessons, string $slug): void
    {
        // Students who already hold an in_progress attempt must NOT be exported,
        // otherwise the k6 rotation would pick up a live attempt that returns
        // the same id every iteration and skew the start-contention statistics.
        $busyStudentIds = ExamAttempt::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'in_progress')
            ->pluck('user_id')
            ->flip();

        $exported = 0;
        foreach ($studentMemberships as $membership) {
            if ($busyStudentIds->has($membership->user_id)) {
                continue;
            }

            $lesson = $lessons[$membership->id % count($lessons)];

            $token = $membership->user->createToken('staging-k6', ['*']);

            $this->csvRows[] = [
                'tenant_id' => (string) $tenant->id,
                'tenant_slug' => $slug,
                'student_tenant_user_id' => (string) $membership->id,
                'user_id' => (string) $membership->user_id,
                'email' => $membership->user->email,
                'password' => $options['password'],
                'first_name' => $membership->user->name,
                'last_name' => '',
                'token' => $token->plainTextToken,
                'lesson_id' => (string) $lesson['lesson']->id,
                'course_id' => (string) $lesson['course']->id,
                'exam_id' => (string) $lesson['exam']->id,
                'exam_title' => $lesson['exam']->title,
                'duration_minutes' => (string) $lesson['exam']->duration,
            ];
            $exported++;
        }

        $this->info("  exported {$exported} k6 identities (students without an active attempt)");
    }

    private function writeCsv(): string
    {
        $path = $this->outputPath();

        $lines = [
            'tenant_id,tenant_slug,student_tenant_user_id,user_id,email,password,first_name,last_name,token,lesson_id,course_id,exam_id,exam_title,duration_minutes',
        ];
        foreach ($this->csvRows as $row) {
            $lines[] = collect($row)->map(fn (string $v): string => '"'.str_replace('"', '""', $v).'"')->implode(',');
        }

        $dir = dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($path, implode("\n", $lines)."\n");

        return $path;
    }

    private function outputPath(): string
    {
        $output = $this->option('output');

        return $output ?: base_path('storage'.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'staging'.DIRECTORY_SEPARATOR.'students.csv');
    }

    private function createMember(Tenant $tenant, array $roleSlugs, string $email, string $name, string $password, array $roles): TenantUser
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);

        $membership = TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'joined_at' => now()->subDays(30),
        ]);

        foreach ($roleSlugs as $roleSlug) {
            $membership->roles()->attach($roles[$roleSlug], ['tenant_id' => $tenant->id]);
        }

        return $membership->refresh()->load('user');
    }

    private function bindTenant(Tenant $tenant, TenantUser $membership): void
    {
        app()->instance('currentTenant', $tenant);
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenantMembership', $membership);
    }

    private function tenantCreation(): TenantCreationService
    {
        return app(TenantCreationService::class);
    }

    /**
     * @return array{students: int, courses: int, questions: int, attempts: int, password: string}
     */
    private function boundedOptions(): array
    {
        return [
            'students' => $this->boundedIntOption('students', 4, 600),
            'courses' => $this->boundedIntOption('courses', 2, 6),
            'questions' => $this->boundedIntOption('questions', 10, 40),
            'attempts' => min($this->boundedIntOption('attempts', 0, 999), $this->boundedIntOption('students', 4, 600)),
            'password' => (string) $this->option('password') ?: (string) (env('STAGING_SEED_PASSWORD') ?: 'StagingSeed!2026'),
        ];
    }

    private function boundedIntOption(string $name, int $min, int $max): int
    {
        $value = max($min, min($max, (int) $this->option($name)));

        return $value;
    }

    private function userOptionsSuffix(): string
    {
        return sprintf(
            ' --students=%d --courses=%d --questions=%d --attempts=%d',
            $this->boundedIntOption('students', 4, 600),
            $this->boundedIntOption('courses', 2, 6),
            $this->boundedIntOption('questions', 10, 40),
            $this->boundedIntOption('attempts', 0, 999),
        );
    }

    private function hasStagingTenants(): bool
    {
        return Tenant::query()->whereIn('slug', self::STAGING_SLUGS)->exists();
    }

    /**
     * @return list<string>
     */
    private function existingStagingSlugs(): array
    {
        return Tenant::query()->whereIn('slug', self::STAGING_SLUGS)->pluck('slug')->all();
    }

    /**
     * Dependency-ordered removal of every row the staging seeder (and the
     * TenantCreationService) creates, so --reset can rebuild the dataset. Never
     * touches production data: it only touches tenants whose slug is one of the
     * reserved staging slugs (alpha/beta/gamma).
     */
    private function wipeStagingTenants(): void
    {
        $tenantIds = Tenant::query()->whereIn('slug', self::STAGING_SLUGS)->pluck('id')->all();

        foreach ($tenantIds as $tenantId) {
            $this->info("  wiping tenant #{$tenantId}");

            DB::table('exam_attempt_answers')->where('tenant_id', $tenantId)->delete();
            DB::table('exam_attempts')->where('tenant_id', $tenantId)->delete();
            DB::table('course_enrollments')->where('tenant_id', $tenantId)->delete();
            DB::table('course_lessons')->where('tenant_id', $tenantId)->delete();
            DB::table('course_sections')->where('tenant_id', $tenantId)->delete();
            DB::table('exam_questions')->where('tenant_id', $tenantId)->delete();
            DB::table('questions')->where('tenant_id', $tenantId)->delete();
            DB::table('exams')->where('tenant_id', $tenantId)->delete();
            DB::table('courses')->where('tenant_id', $tenantId)->delete();
            DB::table('tenant_domains')->where('tenant_id', $tenantId)->delete();
            DB::table('tenant_integrations')->where('tenant_id', $tenantId)->delete();
            DB::table('tenant_settings')->where('tenant_id', $tenantId)->delete();
            DB::table('tenant_provisioning_steps')->where('tenant_id', $tenantId)->delete();

            $tenantUserRows = DB::table('tenant_users')->where('tenant_id', $tenantId)->get(['id', 'user_id']);
            $tenantUserIds = $tenantUserRows->pluck('id')->all();
            $userIds = $tenantUserRows->pluck('user_id')->unique()->all();

            DB::table('role_tenant_user')->whereIn('tenant_user_id', $tenantUserIds)->delete();

            $roleIds = DB::table('roles')->where('tenant_id', $tenantId)->pluck('id')->all();
            DB::table('permission_role')->whereIn('role_id', $roleIds)->delete();
            DB::table('role_tenant_user')->whereIn('role_id', $roleIds)->delete();
            DB::table('roles')->where('tenant_id', $tenantId)->delete();

            DB::table('tenant_users')->where('tenant_id', $tenantId)->delete();

            // Delete user rows that belonged ONLY to staging tenants (production
            // users are never members of alpha/beta/gamma, so this is safe).
            foreach ($userIds as $userId) {
                $remainingMemberships = DB::table('tenant_users')->where('user_id', $userId)->count();
                if ($remainingMemberships === 0) {
                    DB::table('users')->where('id', $userId)->delete();
                }
            }

            DB::table('tenants')->where('id', $tenantId)->delete();
        }
    }

    /**
     * @return list<string>
     */
    private function courseDescriptions(): array
    {
        return [
            'A hands-on load-test course.',
            'Flattened schema with exam-backed lessons.',
            'A realistic enrolled-only catalog item.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function contentFor(string $type, int $seed): array
    {
        return match ($type) {
            'single_choice' => [
                'question' => "Single choice {$seed}",
                'options' => [
                    ['id' => 'opt-a', 'text' => 'Option A', 'correct' => $seed % 2 === 0],
                    ['id' => 'opt-b', 'text' => 'Option B', 'correct' => $seed % 2 !== 0],
                    ['id' => 'opt-c', 'text' => 'Option C', 'correct' => false],
                    ['id' => 'opt-d', 'text' => 'Option D', 'correct' => false],
                ],
            ],
            'multiple_choice' => [
                'question' => "Multiple choice {$seed}",
                'options' => [
                    ['id' => 'opt-a', 'text' => 'Option A', 'correct' => $seed % 2 === 0],
                    ['id' => 'opt-b', 'text' => 'Option B', 'correct' => true],
                    ['id' => 'opt-c', 'text' => 'Option C', 'correct' => false],
                    ['id' => 'opt-d', 'text' => 'Option D', 'correct' => $seed % 2 !== 0],
                ],
            ],
            'true_false' => [
                'question' => "True false {$seed}",
                'correct' => $seed % 2 === 0 ? 'true' : 'false',
            ],
            'numeric' => [
                'question' => "Numeric {$seed}",
                'correct' => 10 + ($seed % 40),
                'tolerance' => 0.5,
            ],
            'essay' => [
                'question' => "Essay {$seed}",
                'rubric' => 'Assess structure, evidence, and clarity.',
            ],
            'short_answer' => [
                'question' => "Short answer {$seed}",
                'correct' => 'Laravel',
                'acceptable_answers' => ['Laravel', 'laravel', 'Laravel PHP'],
            ],
        };
    }
}