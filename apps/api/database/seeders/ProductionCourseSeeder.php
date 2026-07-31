<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\EducationalStage;
use App\Models\MediaAsset;
use App\Models\MediaAssetUsage;
use App\Models\Subject;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Courses\CourseService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Production Course Content Seeder.
 *
 * Seeds 30 real, published educational courses (10 per educational stage)
 * distributed evenly across the three subjects, reusing existing stages,
 * subjects, categories and instructors. Course images are rotated fairly
 * from the tenant media library and every assignment is tracked through
 * MediaAssetUsage.
 *
 * The seeder is fully idempotent: running it any number of times never
 * creates duplicate courses, categories, stages or media usage records.
 */
class ProductionCourseSeeder extends Seeder
{
    private Tenant $tenant;

    private TenantUser $instructor;

    private int $stagesUsed = 0;

    private int $stagesCreated = 0;

    private int $subjectsUsed = 0;

    private int $subjectsCreated = 0;

    private int $coursesCreated = 0;

    private int $coursesSkipped = 0;

    private int $imagesAssigned = 0;

    private int $categoriesReused = 0;

    private int $categoriesCreated = 0;

    private int $instructorsReused = 0;

    private int $instructorsCreated = 0;

    private int $usagesTracked = 0;

    public function run(): void
    {
        $startTime = microtime(true);

        $this->resolveTenant();
        $this->resolveInstructor();
        $this->bindTenantContext();

        DB::transaction(function (): void {
            $stages = $this->ensureStages();
            $subjects = $this->ensureSubjects();
            $categories = $this->ensureCategories();

            $courses = $this->seedCourses($stages, $subjects, $categories);

            $this->assignCourseImages($courses);
        });

        $this->printReport(round(microtime(true) - $startTime, 2));
    }

    // ═══════════════════════════════════════════════════
    // TENANT CONTEXT
    // ═══════════════════════════════════════════════════

    private function resolveTenant(): void
    {
        $domain = TenantDomain::where('is_primary', true)
            ->where('status', 'active')
            ->first();

        $this->tenant = $domain?->tenant
            ?? Tenant::where('status', 'active')->first()
            ?? Tenant::firstOrFail();
    }

    private function bindTenantContext(): void
    {
        app()->instance(Tenant::class, $this->tenant);
        app()->instance('currentTenant', $this->tenant);
        app()->instance('currentTenantMembership', $this->instructor);
    }

    private function resolveInstructor(): void
    {
        $this->instructor = TenantUser::where('tenant_id', $this->tenant->id)
            ->where('status', 'active')
            ->first();

        if ($this->instructor) {
            $this->instructorsReused++;

            return;
        }

        $user = User::create([
            'name' => 'مدرس الأكاديمية',
            'email' => 'instructor@' . Str::slug($this->tenant->name) . '.teachify.tech',
            'password' => bcrypt(Str::random(32)),
            'locale' => 'ar',
        ]);

        $this->instructor = TenantUser::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'job_title' => 'مدرّس',
            'joined_at' => now(),
        ]);

        $this->instructorsCreated++;
    }

    // ═══════════════════════════════════════════════════
    // EDUCATIONAL STAGES
    // ═══════════════════════════════════════════════════

    private function ensureStages(): array
    {
        $names = [
            'المرحلة الإعدادية',
            'المرحلة الثانوية',
            'المرحلة الجامعية',
        ];

        $existing = EducationalStage::where('tenant_id', $this->tenant->id)->get();
        $byName = $existing->keyBy(fn (EducationalStage $stage) => $stage->name);

        $sortOrder = (int) $existing->max('sort_order') + 1;
        $stages = [];

        foreach ($names as $name) {
            $stage = $byName->get($name);

            if (! $stage) {
                $stage = EducationalStage::create([
                    'tenant_id' => $this->tenant->id,
                    'created_by_tenant_user_id' => $this->instructor->id,
                    'name' => $name,
                    'description' => $this->stageDescription($name),
                    'is_active' => true,
                    'sort_order' => $sortOrder++,
                ]);

                $this->stagesCreated++;
            }

            $stages[$name] = $stage;
            $this->stagesUsed++;
        }

        return $stages;
    }

    private function stageDescription(string $name): string
    {
        return match ($name) {
            'المرحلة الإعدادية' => 'المرحلة التعليمية المتوسطة التي تسبق التعليم الثانوي وتؤسس للمفاهيم العلمية والأدبية الأساسية.',
            'المرحلة الثانوية' => 'المرحلة التعليمية التي تلي المرحلة الإعدادية وتهيئ الطلاب للالتحاق بالتعليم الجامعي.',
            'المرحلة الجامعية' => 'التعليم العالي الذي يلي التعليم الثانوي ويشمل برامج البكالوريوس والدراسات المتقدمة.',
            default => 'مرحلة تعليمية',
        };
    }

    // ═══════════════════════════════════════════════════
    // SUBJECTS
    // ═══════════════════════════════════════════════════

    private function ensureSubjects(): array
    {
        $names = ['الرياضيات', 'الفيزياء', 'الكيمياء'];

        $existing = Subject::where('tenant_id', $this->tenant->id)->get();
        $byName = $existing->keyBy(fn (Subject $subject) => $subject->name);

        $sortOrder = (int) $existing->max('sort_order') + 1;
        $subjects = [];

        foreach ($names as $name) {
            $subject = $byName->get($name);

            if (! $subject) {
                $subject = Subject::create([
                    'tenant_id' => $this->tenant->id,
                    'created_by_tenant_user_id' => $this->instructor->id,
                    'name' => $name,
                    'description' => $this->subjectDescription($name),
                    'is_active' => true,
                    'sort_order' => $sortOrder++,
                ]);

                $this->subjectsCreated++;
            }

            $subjects[$name] = $subject;
            $this->subjectsUsed++;
        }

        return $subjects;
    }

    private function subjectDescription(string $name): string
    {
        return match ($name) {
            'الرياضيات' => 'دورات الرياضيات التي تغطي الجبر والهندسة والتفاضل والتكامل والإحصاء في جميع المراحل التعليمية.',
            'الفيزياء' => 'دورات الفيزياء التي تغطي الميكانيكا والكهرباء والمغناطيسية والموجات والفيزياء الحديثة.',
            'الكيمياء' => 'دورات الكيمياء التي تغطي الروابط والتفاعلات والعضوية والكهروكيمياء في جميع المراحل التعليمية.',
            default => 'مادة علمية',
        };
    }

    // ═══════════════════════════════════════════════════
    // CATEGORIES
    // ═══════════════════════════════════════════════════

    private function ensureCategories(): array
    {
        $definitions = [
            'الرياضيات' => [
                'slug' => 'mathematics',
                'description' => 'دورات الرياضيات في جميع المراحل التعليمية',
                'color' => '#2563EB',
                'icon' => 'math',
            ],
            'الفيزياء' => [
                'slug' => 'physics',
                'description' => 'دورات الفيزياء والعلوم الطبيعية في جميع المراحل التعليمية',
                'color' => '#7C3AED',
                'icon' => 'physics',
            ],
            'الكيمياء' => [
                'slug' => 'chemistry',
                'description' => 'دورات الكيمياء والعلوم الكيميائية في جميع المراحل التعليمية',
                'color' => '#059669',
                'icon' => 'chemistry',
            ],
        ];

        $existing = Category::where('tenant_id', $this->tenant->id)->get();
        $categories = [];

        foreach ($definitions as $name => $definition) {
            $category = $existing->first(
                fn (Category $category) => $category->slug === $definition['slug']
                    || $category->name === $name
            );

            if ($category) {
                $this->categoriesReused++;
            } else {
                $category = Category::create([
                    'tenant_id' => $this->tenant->id,
                    'name' => $name,
                    'slug' => $definition['slug'],
                    'description' => $definition['description'],
                    'icon' => $definition['icon'],
                    'color' => $definition['color'],
                    'sort_order' => count($categories) + 1,
                    'active' => true,
                    'featured' => false,
                ]);

                $this->categoriesCreated++;
            }

            $categories[$name] = $category;
        }

        return $categories;
    }

    // ═══════════════════════════════════════════════════
    // COURSES
    // ═══════════════════════════════════════════════════

    /**
     * @param  array<string, EducationalStage>  $stages
     * @param  array<string, Subject>  $subjects
     * @param  array<string, Category>  $categories
     */
    private function seedCourses(array $stages, array $subjects, array $categories): Collection
    {
        $courseService = app(CourseService::class);
        $courses = new Collection();

        foreach ($this->courseDefinitions() as $definition) {
            $existing = Course::where('tenant_id', $this->tenant->id)
                ->where('slug', $definition['slug'])
                ->first();

            if ($existing) {
                $this->coursesSkipped++;
                $courses->push($existing);

                continue;
            }

            $stage = $stages[$definition['stage']];
            $subject = $subjects[$definition['subject']];
            $category = $categories[$definition['subject']];

            $course = $courseService->create($this->tenant, $this->instructor, [
                'title' => $definition['title'],
                'slug' => $definition['slug'],
                'subtitle' => $definition['subtitle'],
                'short_description' => $definition['short_description'],
                'description' => $definition['description'],
                'full_description' => $definition['full_description'],
                'difficulty' => $definition['difficulty'],
                'language' => 'ar',
                'duration' => $definition['duration'],
                'visibility' => 'public',
                'pricing_type' => $definition['pricing_type'],
                'price_amount' => $definition['price_amount'],
                'price_currency' => 'SAR',
                'discount_price' => $definition['discount_price'],
                'enrollment_limit' => $definition['enrollment_limit'],
                'certificate_enabled' => $definition['certificate_enabled'],
                'featured' => $definition['featured'],
                'seo_title' => $definition['seo_title'],
                'seo_description' => $definition['seo_description'],
                'seo_keywords' => $definition['seo_keywords'],
                'requirements' => $definition['requirements'],
                'learning_outcomes' => $definition['learning_outcomes'],
                'target_audience' => $definition['target_audience'],
                'educational_stage_id' => $stage->id,
                'subject_id' => $subject->id,
                'category_ids' => [$category->id],
            ]);

            $course->forceFill([
                'status' => 'published',
                'published_at' => now(),
            ])->save();

            $this->coursesCreated++;
            $courses->push($course);
        }

        return $courses;
    }

    // ═══════════════════════════════════════════════════
    // COURSE IMAGES
    // ═══════════════════════════════════════════════════

    /**
     * @param  Collection<int, Course>  $courses
     */
    private function assignCourseImages(Collection $courses): void
    {
        $images = MediaAsset::where('tenant_id', $this->tenant->id)
            ->where('status', 'ready')
            ->whereNull('archived_at')
            ->get()
            ->filter(fn (MediaAsset $asset) => $asset->isImage())
            ->values();

        if ($images->isEmpty()) {
            $this->command->warn('  No ready image assets found; course images were skipped.');

            return;
        }

        $imageCount = $images->count();
        $pointer = 0;

        foreach ($courses->sortBy('id') as $course) {
            if ($course->thumbnail_path && $course->cover_image_path) {
                continue;
            }

            $image = $images[$pointer % $imageCount];
            $pointer++;

            $path = $image->cdn_url ?: $image->storage_key;

            if (! $path) {
                continue;
            }

            $updates = [];

            if (! $course->thumbnail_path) {
                $updates['thumbnail_path'] = $path;
            }

            if (! $course->cover_image_path) {
                $updates['cover_image_path'] = $path;
            }

            if (! $updates) {
                continue;
            }

            $course->forceFill($updates)->save();
            $this->imagesAssigned++;

            MediaAssetUsage::updateOrCreate(
                [
                    'tenant_id' => $this->tenant->id,
                    'media_asset_id' => $image->id,
                    'usable_type' => Course::class,
                    'usable_id' => $course->id,
                    'purpose' => 'course_image',
                ],
                [
                    'sort_order' => 0,
                    'metadata' => ['assigned_by' => 'ProductionCourseSeeder'],
                ]
            );

            $this->usagesTracked++;
        }
    }

    // ═══════════════════════════════════════════════════
    // REPORT
    // ═══════════════════════════════════════════════════

    private function printReport(float $elapsed): void
    {
        $this->command->info('');
        $this->command->info('──────────────────────────────────────────');
        $this->command->info('  Production Course Seeder Complete');
        $this->command->info('──────────────────────────────────────────');
        $this->command->info('  Educational Stages  : ' . $this->stagesUsed);
        $this->command->info('  Stages Created      : ' . $this->stagesCreated);
        $this->command->info('  Subjects            : ' . $this->subjectsUsed);
        $this->command->info('  Subjects Created    : ' . $this->subjectsCreated);
        $this->command->info('  Courses Created     : ' . $this->coursesCreated);
        $this->command->info('  Courses Skipped     : ' . $this->coursesSkipped);
        $this->command->info('  Images Assigned     : ' . $this->imagesAssigned);
        $this->command->info('  Categories Reused   : ' . $this->categoriesReused);
        $this->command->info('  Categories Created  : ' . $this->categoriesCreated);
        $this->command->info('  Instructors Reused  : ' . $this->instructorsReused);
        $this->command->info('  Instructors Created : ' . $this->instructorsCreated);
        $this->command->info('  Media Usages Tracked: ' . $this->usagesTracked);
        $this->command->info('  Execution Time      : ' . $elapsed . 's');
        $this->command->info('──────────────────────────────────────────');
    }

    // ═══════════════════════════════════════════════════
    // COURSE DEFINITIONS
    // ═══════════════════════════════════════════════════

    private function courseDefinitions(): array
    {
        return [
            // ═══════════════════════════════════════════
            //  المرحلة الإعدادية
            // ═══════════════════════════════════════════
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الرياضيات',
                'slug' => 'real-numbers-and-operations',
                'title' => 'الأعداد الحقيقية والعمليات عليها',
                'subtitle' => 'أساسيات الأعداد وخصائصها وتمثيلها على خط الأعداد',
                'short_description' => 'دورة تأسيسية في الأعداد الحقيقية تغطي تصنيف الأعداد وترتيب العمليات والقوى والجذور مع تمارين تطبيقية.',
                'description' => 'فهم مفهوم الأعداد الحقيقية وتمثيلها على خط الأعداد، وإتقان العمليات الحسابية وترتيبها، والتعامل مع القوى والجذور التربيعية.',
                'full_description' => 'دورة تأسيسية شاملة في الأعداد الحقيقية مصممة لطلاب المرحلة الإعدادية. تبدأ الدورة بتصنيف الأعداد إلى طبيعية وصحيحة ونسبية وغير نسبية، ثم تنتقل إلى تمثيلها على خط الأعداد وخصائص العمليات الأربع وترتيب العمليات الحسابية. يتضمن البرنامج تدريباً مكثفاً على القوى والجذور التربيعية مع حل مسائل متنوعة تتراوح من السهلة إلى المتوسطة، وتنتهي الدورة بمراجعة عامة ونماذج اختبارات شاملة لضمان إتقان الطالب للمادة.',
                'difficulty' => 'beginner',
                'duration' => 18,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 149,
                'discount_price' => null,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الأعداد الحقيقية والعمليات عليها - المرحلة الإعدادية',
                'seo_description' => 'تعلم الأعداد الحقيقية وتمثيلها على خط الأعداد وإتقان العمليات والقوى والجذور مع تمارين ونماذج اختبارات شاملة للمرحلة الإعدادية.',
                'seo_keywords' => 'الأعداد الحقيقية, الأعداد النسبية, الجذور التربيعية, القوى, الرياضيات, المرحلة الإعدادية',
                'learning_outcomes' => [
                    'تصنيف الأعداد ضمن مجموعاتها العددية المختلفة',
                    'تمثيل الأعداد الحقيقية على خط الأعداد',
                    'إتقان العمليات الأربع وترتيب العمليات الحسابية',
                    'حساب القوى والجذور التربيعية والتكعيبية',
                    'حل مسائل واقعية باستخدام الأعداد الحقيقية',
                ],
                'requirements' => [
                    'المعرفة الأساسية بالعمليات الحسابية الأربع',
                    'الرغبة في تطوير المهارات الحسابية',
                    'التزام بحل التمارين الأسبوعية',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب الراغبون في تقوية أساسيات الرياضيات',
                    'الطلاب المقبلون على اختبارات الانتقال',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الفيزياء',
                'slug' => 'motion-and-forces',
                'title' => 'الحركة والقوى',
                'subtitle' => 'المفاهيم الفيزيائية الأساسية لوصف الحركة والتحكم فيها',
                'short_description' => 'دورة فيزيائية تأسيسية تفهم من خلالها مفهوم الحركة والسرعة والتسارع وتتعرف على القوى وتأثيراتها.',
                'description' => 'دراسة الحركة كمياً: الإزاحة والسرعة والتسارع، مع التعرف على مفهوم القوة وقياسها وتمثيلها.',
                'full_description' => 'دورة فيزيائية تأسيسية تهدف إلى بناء فهم كمي للحركة والقوى. تبدأ بمفاهيم الموقع والإزاحة والمسافة ثم تمييز السرعة المتوسطة واللحظية والتسارع، وتتناول التمثيل البياني للحركة وقراءة البيانات الفيزيائية. يقدم الجزء الثاني مقدمة في القوى وأنواعها وتمثيلها بالأسهم، مع تطبيقات يومية لفهم كيفية تأثير القوى على الأجسام في حياتنا.',
                'difficulty' => 'beginner',
                'duration' => 16,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 179,
                'discount_price' => 129,
                'enrollment_limit' => 700,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الحركة والقوى - مفاهيم الفيزياء الأساسية',
                'seo_description' => 'افهم الحركة والسرعة والتسارع والقوى من خلال دورة فيزيائية تأسيسية مبسطة مع أمثلة وتطبيقات عملية للمرحلة الإعدادية.',
                'seo_keywords' => 'الحركة, القوى, السرعة, التسارع, الفيزياء, المرحلة الإعدادية',
                'learning_outcomes' => [
                    'تمييز الكميات الفيزيائية الأساسية لوصف الحركة',
                    'حساب السرعة المتوسطة والتسارع',
                    'قراءة وتفسير الرسوم البيانية للحركة',
                    'التعرف على أنواع القوى وتأثيراتها على الأجسام',
                ],
                'requirements' => [
                    'معرفة أساسية بالعمليات الحسابية',
                    'الاهتمام بالظواهر الطبيعية',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب المقبلون على دراسة الفيزياء للمرة الأولى',
                    'الهواة المهتمون بالعلوم الطبيعية',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الكيمياء',
                'slug' => 'states-of-matter-and-changes',
                'title' => 'حالات المادة وتغيراتها',
                'subtitle' => 'من الحالة الصلبة إلى الغازية: كيف تتغير المادة؟',
                'short_description' => 'دورة كيميائية تأسيسية حول حالات المادة الثلاث والتغيرات الفيزيائية والكيميائية التي تطرأ عليها.',
                'description' => 'فهم حالات المادة الصلبة والسائلة والغازية وانتقالاتها، وتمييز التغيرات الفيزيائية عن الكيميائية.',
                'full_description' => 'دورة تأسيسية في علم الكيمياء تتناول حالات المادة الثلاث وخصائصها المجهرية والعيانية. يستعرض البرنامج انتقالات المادة بين الحالات بالذوبان والتجمد والتبخر والتكثف والتسامي مع تفسيرها على المستوى الجزيئي. كما يميز الطالب بين التغيرات الفيزيائية والتغيرات الكيميائية من خلال التجارب العملية والملاحظة، مع أمثلة من الحياة اليومية كالطهي والصدأ واحتراق الوقود.',
                'difficulty' => 'beginner',
                'duration' => 15,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 149,
                'discount_price' => null,
                'enrollment_limit' => 700,
                'certificate_enabled' => true,
                'seo_title' => 'دورة حالات المادة وتغيراتها - أساسيات الكيمياء',
                'seo_description' => 'تعلم حالات المادة وانتقالاتها والفرق بين التغيرات الفيزيائية والكيميائية من خلال دورة كيمياء تأسيسية للمرحلة الإعدادية.',
                'seo_keywords' => 'حالات المادة, التغيرات الفيزيائية, التغيرات الكيميائية, الكيمياء, المرحلة الإعدادية',
                'learning_outcomes' => [
                    'وصف حالات المادة الثلاث وخصائصها',
                    'تفسير انتقالات المادة بين الحالات جزيئياً',
                    'التمييز بين التغيرات الفيزيائية والكيميائية',
                    'ربط الظواهر اليومية بالمفاهيم الكيميائية',
                ],
                'requirements' => [
                    'المعرفة الأساسية بتركيب المادة',
                    'الاهتمام بالتجارب العملية',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب الجدد في مادة الكيمياء',
                    'المعلمون الراغبون في مادة تعليمية مساندة',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الرياضيات',
                'slug' => 'linear-equations-and-inequalities',
                'title' => 'المعادلات والمتباينات من الدرجة الأولى',
                'subtitle' => 'حل المعادلات الخطية والمتباينات وتمثيلها بيانياً',
                'short_description' => 'دورة عملية في حل المعادلات والمتباينات من الدرجة الأولى بمتغير واحد وتمثيلها على خط الأعداد.',
                'description' => 'إتقان حل المعادلات الخطية والمتباينات وبناء مسائل لفظية وحلها وتمثيل الحلول بيانياً.',
                'full_description' => 'دورة متخصصة في المعادلات والمتباينات من الدرجة الأولى. تبدأ بخطوات حل المعادلات الخطية بمتغير واحد وتطبيق خصائص المساواة، ثم تنتقل إلى بناء المعادلات من مسائل لفظية واقعية وحلها. يغطي الجزء الثاني المتباينات وتمثيل حلولها على خط الأعداد وحل أنظمة المعادلات الخطية بطريقتين الحذف والتعويض مع التطبيق على مسائل حياتية مثل الحسابات التجارية والقياس.',
                'difficulty' => 'beginner',
                'duration' => 20,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 199,
                'discount_price' => 149,
                'enrollment_limit' => 900,
                'certificate_enabled' => true,
                'seo_title' => 'دورة المعادلات والمتباينات من الدرجة الأولى - المرحلة الإعدادية',
                'seo_description' => 'أتقن حل المعادلات الخطية والمتباينات وتمثيلها بيانياً وحل المسائل اللفظية مع تدريبات متنوعة للمرحلة الإعدادية.',
                'seo_keywords' => 'المعادلات الخطية, المتباينات, حل المعادلات, الرياضيات, المرحلة الإعدادية',
                'learning_outcomes' => [
                    'حل المعادلات الخطية بمتغير واحد',
                    'بناء وحل المسائل اللفظية',
                    'حل المتباينات وتمثيلها على خط الأعداد',
                    'حل أنظمة المعادلات بالحذف والتعويض',
                    'تطبيق المعادلات على مسائل واقعية',
                ],
                'requirements' => [
                    'إتقان العمليات الحسابية الأساسية',
                    'معرفة أساسية بالأعداد الحقيقية',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب المقبلون على اختبارات الرياضيات',
                    'الراغبون في تقوية مهارات حل المسائل',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الفيزياء',
                'slug' => 'energy-forms-and-transformations',
                'title' => 'الطاقة وأشكالها وتحولاتها',
                'subtitle' => 'مصادر الطاقة وقانون بقائها وتحولاتها بين الأشكال المختلفة',
                'short_description' => 'دورة فيزيائية عن مفهوم الطاقة وأشكالها المتعددة ومصادرها وقانون بقاء الطاقة.',
                'description' => 'التعرف على مفهوم الطاقة وأشكالها ومصادر الطاقة المتجددة وغير المتجددة وقانون بقاء الطاقة.',
                'full_description' => 'دورة فيزيائية شاملة حول الطاقة: مفهومها ووحدات قياسها وأشكالها المتعددة كالطاقة الحركية والكامنة والحرارية والكهربائية والكيميائية. يستعرض البرنامج تحولات الطاقة من شكل إلى آخر مع تطبيق قانون حفظ الطاقة، ويناقش مصادر الطاقة المتجددة وغير المتجددة ومشروعات الطاقة المستدامة، مع أمثلة عملية من الأجهزة المنزلية والمحركات والأنشطة الرياضية.',
                'difficulty' => 'beginner',
                'duration' => 15,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 159,
                'discount_price' => 119,
                'enrollment_limit' => 600,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الطاقة وأشكالها وتحولاتها - فيزياء المرحلة الإعدادية',
                'seo_description' => 'تعلم مفهوم الطاقة وأشكالها ومصادرها وقانون حفظ الطاقة مع تطبيقات عملية من الحياة اليومية للمرحلة الإعدادية.',
                'seo_keywords' => 'الطاقة, حفظ الطاقة, مصادر الطاقة, الطاقة المتجددة, الفيزياء',
                'learning_outcomes' => [
                    'تعريف الطاقة ووحدات قياسها',
                    'تمييز أشكال الطاقة المختلفة',
                    'تطبيق قانون حفظ الطاقة على الأنظمة البسيطة',
                    'التمييز بين مصادر الطاقة المتجددة وغير المتجددة',
                    'تحليل تحولات الطاقة في الأجهزة اليومية',
                ],
                'requirements' => [
                    'معرفة أساسية بالفيزياء',
                    'الاهتمام بالبيئة والاستدامة',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب المهتمون بالطاقة والبيئة',
                    'الراغبون في فهم استهلاك الطاقة اليومي',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الكيمياء',
                'slug' => 'atom-and-periodic-table',
                'title' => 'الذرة والجدول الدوري',
                'subtitle' => 'بناء الذرة وترتيب العناصر واكتشاف الخصائص الدورية',
                'short_description' => 'دورة كيميائية تأسيسية تشرح بنية الذرة وتنظيم العناصر في الجدول الدوري وخصائصها الدورية.',
                'description' => 'فهم بنية الذرة والجسيمات المكونة لها وترتيب العناصر في الجدول الدوري والدلالة على خصائصها.',
                'full_description' => 'دورة تأسيسية في الكيمياء تركز على الذرة والجدول الدوري. تبدأ ببنية الذرة من البروتونات والنيوترونات والإلكترونات والعدد الذري والكتلي وتمثيلها الكيميائي. ثم يستعرض البرنامج تطور الجدول الدوري وتنظيم العناصر في مجموعات ودورات وفق عدد الإلكترونات في المدارات، ويفسر الاتجاهات الدورية كالحجم الذري والسالبية الكهربية والنشاط الكيميائي، مع تطبيقات على تحديد موقع العناصر وخصائصها.',
                'difficulty' => 'beginner',
                'duration' => 17,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 169,
                'discount_price' => null,
                'enrollment_limit' => 600,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الذرة والجدول الدوري - أساسيات الكيمياء',
                'seo_description' => 'افهم بنية الذرة وتنظيم العناصر في الجدول الدوري والخصائص الدورية مع شرح مبسط وأمثلة للمرحلة الإعدادية.',
                'seo_keywords' => 'الذرة, الجدول الدوري, العناصر, العدد الذري, الكيمياء',
                'learning_outcomes' => [
                    'وصف بنية الذرة وجسيماتها الأساسية',
                    'حساب العدد الذري والكتلي',
                    'تحديد موقع العناصر في الجدول الدوري',
                    'تفسير الاتجاهات الدورية للعناصر',
                ],
                'requirements' => [
                    'معرفة أساسية بالمادة وخصائصها',
                    'الاهتمام بالعناصر والمركبات',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب المقبلون على منهج الكيمياء',
                    'المتعلمون المهتمون بالعلوم',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الرياضيات',
                'slug' => 'basics-of-trigonometry',
                'title' => 'أساسيات حساب المثلثات',
                'subtitle' => 'النسب المثلثية في المثلث القائم وتطبيقاتها العملية',
                'short_description' => 'دورة تأسيسية في النسب المثلثية للمثلث القائم وإيجاد أطوال الأضلاع وقياس الزوايا.',
                'description' => 'إتقان النسب المثلثية الأساسية الجيب وجيب التمام والظل وحل المثلثات القائمة وتطبيقاتها.',
                'full_description' => 'دورة تأسيسية في حساب المثلثات تبدأ بالتعريف بالنسب المثلثية في المثلث القائم الزاوية: الجيب وجيب التمام والظل، وعلاقاتها مع الأضلاع والزوايا. يتدرب الطالب على إيجاد الأطوال والزوايا المجهولة في المثلثات القائمة وحل المسائل الواقعية كقياس الارتفاعات والمسافات. تُختتم الدورة بالتعرف على الزوايا الخاصة وتقريب النتائج باستخدام الآلة الحاسبة.',
                'difficulty' => 'beginner',
                'duration' => 16,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 189,
                'discount_price' => 139,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة أساسيات حساب المثلثات - النسب المثلثية للمثلث القائم',
                'seo_description' => 'تعلم النسب المثلثية الجيب وجيب التمام والظل وحل المثلثات القائمة مع تطبيقات عملية وتمارين للمرحلة الإعدادية.',
                'seo_keywords' => 'حساب المثلثات, النسب المثلثية, الجيب, جيب التمام, المثلث القائم',
                'learning_outcomes' => [
                    'تعريف النسب المثلثية الأساسية في المثلث القائم',
                    'إيجاد النسب المثلثية لأي زاوية حادة',
                    'حل المثلثات القائمة كاملة',
                    'تطبيق النسب المثلثية على مسائل واقعية',
                ],
                'requirements' => [
                    'معرفة أساسية بالهندسة والمثلثات',
                    'إتقان العمليات الحسابية',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب المقبلون على حساب المثلثات في الثانوية',
                    'الراغبون في أساسيات المساحة والقياس',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الفيزياء',
                'slug' => 'light-and-optical-phenomena',
                'title' => 'الضوء والظواهر الضوئية',
                'subtitle' => 'طبيعة الضوء وانعكاسه وانكساره وتطبيقاته',
                'short_description' => 'دورة فيزيائية عن طبيعة الضوء وقوانين الانعكاس والانكسار وتطبيقاتها في العدسات والمرايا.',
                'description' => 'فهم طبيعة الضوء وانتشاره وقوانين الانعكاس والانكسار وتكوين الصور بالمرايا والعدسات.',
                'full_description' => 'دورة فيزيائية تتناول الضوء وخصائصه. يبدأ البرنامج بشرح طبيعة الضوء وانتشاره المستقيم وسرعته في الأوساط المختلفة، ثم يدرس قوانين الانعكاس والانكسار وكيفية تشكل الصور في المرايا المستوية والمقعرة والمحدبة والعدسات المحدبة والمقعرة. تتضمن الدورة تطبيقات عملية من الأجهزة البصرية كالمجهر والتلسكوب والنظارات الطبية، مع تجارب محاكاة لتفسير الظواهر الضوئية في الطبيعة.',
                'difficulty' => 'beginner',
                'duration' => 14,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 159,
                'discount_price' => null,
                'enrollment_limit' => 600,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الضوء والظواهر الضوئية - فيزياء المرحلة الإعدادية',
                'seo_description' => 'تعلم طبيعة الضوء وقوانين الانعكاس والانكسار وتكوين الصور بالمرايا والعدسات مع تطبيقات عملية للمرحلة الإعدادية.',
                'seo_keywords' => 'الضوء, الانعكاس, الانكسار, العدسات, المرايا, الفيزياء',
                'learning_outcomes' => [
                    'وصف طبيعة الضوء وانتشاره',
                    'تطبيق قوانين الانعكاس والانكسار',
                    'تحديد خصائص الصور المتكونة في المرايا والعدسات',
                    'ربط الظواهر الضوئية بالأجهزة البصرية اليومية',
                ],
                'requirements' => [
                    'معرفة أساسية بالفيزياء',
                    'الاهتمام بالظواهر البصرية',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب المهتمون بالبصريات',
                    'محبو التجارب العلمية',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الكيمياء',
                'slug' => 'mixtures-and-solutions',
                'title' => 'المخاليط والمحاليل',
                'subtitle' => 'أنواع المخاليط وطرق فصلها وتركيز المحاليل',
                'short_description' => 'دورة كيميائية عن المخاليط والمحاليل وأنواعها وطرق فصل مكوناتها وحساب التركيز.',
                'description' => 'تمييز المخاليط المتجانسة وغير المتجانسة وطرق فصلها وفهم المحاليل وتركيزاتها.',
                'full_description' => 'دورة كيميائية عملية تتناول المخاليط والمحاليل. يستعرض البرنامج أنواع المخاليط المتجانسة وغير المتجانسة وخصائص كل منها، وطرق فصل مكوناتها بالترشيح والتبخير والتقطير والكروماتوغرافيا. ينتقل البرنامج بعد ذلك إلى المحاليل: المذيب والمذاب والذوبانية والعوامل المؤثرة فيها، وحساب التركيز بالكتلة والحجم، مع تطبيقات معملية وأنشطة عملية.',
                'difficulty' => 'beginner',
                'duration' => 15,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 149,
                'discount_price' => null,
                'enrollment_limit' => 600,
                'certificate_enabled' => true,
                'seo_title' => 'دورة المخاليط والمحاليل - كيمياء المرحلة الإعدادية',
                'seo_description' => 'تعلم أنواع المخاليط وطرق فصلها وحساب تركيز المحاليل والذوبانية مع تطبيقات معملية عملية.',
                'seo_keywords' => 'المخاليط, المحاليل, التركيز, الذوبان, فصل المخاليط, الكيمياء',
                'learning_outcomes' => [
                    'تمييز أنواع المخاليط وخصائصها',
                    'اختيار الطريقة المناسبة لفصل مكونات المخاليط',
                    'حساب تركيز المحاليل',
                    'تفسير العوامل المؤثرة في الذوبانية',
                ],
                'requirements' => [
                    'معرفة أساسية بحالات المادة',
                    'الاهتمام بالتجارب العملية',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب الجدد في الكيمياء',
                    'الراغبون في مهارات معملية أساسية',
                ],
            ],
            [
                'stage' => 'المرحلة الإعدادية',
                'subject' => 'الرياضيات',
                'slug' => 'introductory-statistics-and-probability',
                'title' => 'الإحصاء والاحتمالات الأساسي',
                'subtitle' => 'جمع البيانات وتمثيلها وتحليلها ومقدمة إلى الاحتمالات',
                'short_description' => 'دورة تأسيسية في الإحصاء الوصفي والاحتمالات مع تطبيقات على بيانات حقيقية.',
                'description' => 'تعلم جمع البيانات وتمثيلها بيانياً وحساب مقاييس النزعة المركزية والتشتت ومقدمة إلى الاحتمالات.',
                'full_description' => 'دورة تأسيسية في الإحصاء والاحتمالات تبدأ بجمع البيانات وتنظيمها في جداول وتمثيلها بالأعمدة والقطاعات والأشكال البيانية. ينتقل البرنامج إلى مقاييس النزعة المركزية: الوسط والوسيط والمنوال، ومقاييس التشتت: المدى والانحراف المتوسط، مع تفسير النتائج واستنتاج المعلومات. يقدم الجزء الأخير مقدمة إلى الاحتمالات والأحداث والفضاء العيني مع مسائل تطبيقية من الحياة اليومية.',
                'difficulty' => 'beginner',
                'duration' => 14,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 139,
                'discount_price' => null,
                'enrollment_limit' => 700,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الإحصاء والاحتمالات الأساسي - الرياضيات للمرحلة الإعدادية',
                'seo_description' => 'تعلم جمع البيانات وتمثيلها بيانياً وحساب الوسط والوسيط والمنوال ومقدمة إلى الاحتمالات مع تمارين تطبيقية.',
                'seo_keywords' => 'الإحصاء, الاحتمالات, الوسط الحسابي, البيانات, الرياضيات',
                'learning_outcomes' => [
                    'جمع البيانات وتنظيمها في جداول',
                    'تمثيل البيانات بأنواع الرسوم البيانية',
                    'حساب وتفسير مقاييس النزعة المركزية',
                    'حساب مقاييس التشتت البسيطة',
                    'حل مسائل أساسية في الاحتمالات',
                ],
                'requirements' => [
                    'معرفة أساسية بالكسور والنسب المئوية',
                    'الاهتمام بتحليل البيانات',
                ],
                'target_audience' => [
                    'طلاب المرحلة الإعدادية',
                    'الطلاب المقبلون على الإحصاء',
                    'الراغبون في فهم الأخبار والمعلومات بالأرقام',
                ],
            ],

            // ═══════════════════════════════════════════
            //  المرحلة الثانوية
            // ═══════════════════════════════════════════
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الرياضيات',
                'slug' => 'advanced-algebra',
                'title' => 'الجبر المتقدم',
                'subtitle' => 'الدوال والمقادير الجبرية والتطبيقات الجبرية المتقدمة',
                'short_description' => 'دورة في الجبر المتقدم تغطي الدوال والمتتابعات والمقادير الجبرية المركبة وحل المسائل اللفظية.',
                'description' => 'إتقان المهارات الجبرية المتقدمة: تبسيط المقادير الجبرية، الدوال، المتتابعات الحسابية والهندسية، وحل المعادلات الأكثر تعقيداً.',
                'full_description' => 'دورة متقدمة في الجبر لطلاب المرحلة الثانوية. تتناول تبسيط المقادير الجبرية والعوامل المشتركة والتحليل إلى عوامل، ثم مفهوم الدوال وتمثيلها وتطبيقاتها، والمتتابعات الحسابية والهندسية ومجاميعها. كما تغطي الدورة الأسس السالبة والكسور الجزئية وأنظمة المعادلات غير الخطية، مع تركيز على حل المسائل اللفظية وبناء النماذج الرياضية.',
                'difficulty' => 'intermediate',
                'duration' => 30,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 279,
                'discount_price' => 199,
                'enrollment_limit' => 1000,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الجبر المتقدم - الرياضيات للمرحلة الثانوية',
                'seo_description' => 'أتقن الجبر المتقدم: الدوال والمتتابعات والتحليل إلى عوامل وأنظمة المعادلات مع حل مسائل لفظية ونماذج رياضية.',
                'seo_keywords' => 'الجبر المتقدم, الدوال, المتتابعات, التحليل, الرياضيات, الثانوية',
                'learning_outcomes' => [
                    'تبسيط وتحليل المقادير الجبرية المركبة',
                    'دراسة الدوال وتمثيلها بيانياً',
                    'حل المتتابعات الحسابية والهندسية',
                    'حل أنظمة المعادلات غير الخطية',
                    'بناء نماذج رياضية لمسائل واقعية',
                ],
                'requirements' => [
                    'إتقان جبر المرحلة الإعدادية',
                    'معرفة أساسية بالمعادلات والمتباينات',
                    'الإلمام بمفهوم الدالة',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على اختبارات القدرات',
                    'الراغبون في دراسة الرياضيات الجامعية',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الفيزياء',
                'slug' => 'dynamics-and-newton-laws',
                'title' => 'الديناميكا وقوانين نيوتن',
                'subtitle' => 'من القوة إلى الحركة: قوانين نيوتن الثلاثة وتطبيقاتها',
                'short_description' => 'دورة في الديناميكا تشرح قوانين نيوتن للحركة والاحتكاك وحركة الأجسام في المستوى المائل.',
                'description' => 'فهم قوانين نيوتن الثلاثة وتطبيقها على حركة الأجسام وحساب القوى والاحتكاك والتسارع.',
                'full_description' => 'دورة فيزيائية متخصصة في الديناميكا. تبدأ بتلخيص القوانين التي وصف بها نيوتن حركة الأجسام: قانون القصور الذاتي، وقانون التسارع، وقانون الفعل ورد الفعل، وتطبيقها على أجسام متحركة. يتناول البرنامج قوة الاحتكاك وأنواعها وحسابها، وحركة الأجسام على المستوي المائل والحركة الدائرية، مع حل مسائل عددية وتمارين تطبيقية شاملة.',
                'difficulty' => 'intermediate',
                'duration' => 28,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 269,
                'discount_price' => null,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الديناميكا وقوانين نيوتن - فيزياء المرحلة الثانوية',
                'seo_description' => 'تعلم قوانين نيوتن للحركة والاحتكاك وحركة الأجسام على المستوي المائل مع حل مسائل عددية تطبيقية للمرحلة الثانوية.',
                'seo_keywords' => 'الديناميكا, قوانين نيوتن, القوة, التسارع, الاحتكاك, الفيزياء',
                'learning_outcomes' => [
                    'صياغة قوانين نيوتن الثلاثة',
                    'تطبيق قوانين نيوتن على حركة الأجسام',
                    'حساب قوة الاحتكاك وتأثيراتها',
                    'تحليل حركة الأجسام على المستوي المائل',
                    'حل مسائل عددية في الديناميكا',
                ],
                'requirements' => [
                    'معرفة أساسية بالحركة والقوى',
                    'إتقان الجبر الأساسي',
                    'معرفة بالمتجهات',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على الفيزياء الجامعية',
                    'الراغبون في فهم حركة الأجسام',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الكيمياء',
                'slug' => 'chemical-bonds',
                'title' => 'الروابط الكيميائية',
                'subtitle' => 'كيف ترتبط الذرات لتكوين المركبات؟',
                'short_description' => 'دورة في الروابط الكيميائية الأيونية والتساهمية والفلزية وخصائص المركبات الناتجة.',
                'description' => 'فهم كيفية ارتباط الذرات: الروابط الأيونية والتساهمية والفلزية، وكتابة الصيغ الكيميائية للمركبات.',
                'full_description' => 'دورة كيميائية متخصصة في الروابط الكيميائية. تبدأ بمراجعة بنية الذرة والإلكترونات في المدار الخارجي وقاعدة الثمانيات، ثم تشرح آلية تكوين الرابطة الأيونية بين الفلزات واللافلزات والرابطة التساهمية بين اللافلزات والرابطة الفلزية. يناقش البرنامج التنبؤ بنوع الرابطة من موقع العناصر، وكتابة الصيغ الكيميائية وتسمية المركبات، ومقارنة خواص المركبات الأيونية والتساهمية كالذوبان والتوصيل الكهربائي ودرجات الانصهار.',
                'difficulty' => 'intermediate',
                'duration' => 26,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 259,
                'discount_price' => 189,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الروابط الكيميائية - كيمياء المرحلة الثانوية',
                'seo_description' => 'تعلم الروابط الكيميائية الأيونية والتساهمية والفلزية وكتابة الصيغ الكيميائية ومقارنة خواص المركبات مع أمثلة مفصلة.',
                'seo_keywords' => 'الروابط الكيميائية, الرابطة الأيونية, الرابطة التساهمية, الصيغ الكيميائية, الكيمياء',
                'learning_outcomes' => [
                    'تفسير آلية تكوين أنواع الروابط الكيميائية',
                    'التنبؤ بنوع الرابطة بين العناصر',
                    'كتابة الصيغ الكيميائية للمركبات',
                    'مقارنة خواص المركبات الأيونية والتساهمية',
                    'استخدام قاعدة الثمانيات لتفسير الترابط',
                ],
                'requirements' => [
                    'معرفة بنية الذرة والجدول الدوري',
                    'الإلمام بتوزيع الإلكترونات',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على الكيمياء الجامعية',
                    'الراغبون في فهم تكوين المركبات',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الرياضيات',
                'slug' => 'quadratic-equations',
                'title' => 'المعادلات التربيعية',
                'subtitle' => 'طرق حل المعادلات التربيعية ودراسة الدالة التربيعية وتمثيلها',
                'short_description' => 'دورة متكاملة في المعادلات التربيعية: التحليل، القانون العام، إكمال المربع، وتمثيل الدالة.',
                'description' => 'إتقان حل المعادلات التربيعية بطرق متعددة وفهم الدالة التربيعية وتمثيلها البياني ورسم القطع المكافئ.',
                'full_description' => 'دورة شاملة في المعادلات التربيعية لطلاب المرحلة الثانوية. يتعرف الطالب على صور المعادلة التربيعية وطرق حلها: التحليل إلى عوامل، إكمال المربع، والقانون العام، مع مناقشة عدد الحلول وقيمة المميز. ينتقل البرنامج إلى الدالة التربيعية وتمثيلها البياني: رأس القطع المكافئ، محور التماثل، ونقاط التقاطع مع المحاور، وتطبيقات عملية كمسائل المقذوفات والمساحات القصوى.',
                'difficulty' => 'intermediate',
                'duration' => 28,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 249,
                'discount_price' => null,
                'enrollment_limit' => 900,
                'certificate_enabled' => true,
                'seo_title' => 'دورة المعادلات التربيعية - الرياضيات للمرحلة الثانوية',
                'seo_description' => 'تعلم حل المعادلات التربيعية بالتحليل وإكمال المربع والقانون العام وتمثيل الدالة التربيعية بيانياً مع تمارين شاملة.',
                'seo_keywords' => 'المعادلات التربيعية, التحليل, القانون العام, الدالة التربيعية, الرياضيات',
                'learning_outcomes' => [
                    'حل المعادلات التربيعية بطرق متعددة',
                    'تحديد عدد الحلول باستخدام المميز',
                    'تمثيل الدالة التربيعية بيانياً',
                    'تطبيق المعادلات التربيعية على مسائل واقعية',
                    'تحليل القطع المكافئ وخصائصه',
                ],
                'requirements' => [
                    'إتقان حل المعادلات الخطية',
                    'معرفة أساسية بالتحليل الجبري',
                    'الإلمام بتمثيل الدوال بيانياً',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على اختبارات الرياضيات',
                    'الراغبون في دراسة التفاضل',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الفيزياء',
                'slug' => 'electrostatics-and-current-electricity',
                'title' => 'الكهرباء الساكنة والتيارية',
                'subtitle' => 'الشحنة الكهربائية والقوانين الأساسية للدوائر الكهربائية',
                'short_description' => 'دورة في الكهرباء: الشحنات الكهربائية، قانون كولوم، التيار والمقاومة وقانون أوم والدوائر الكهربائية.',
                'description' => 'فهم الشحنات الكهربائية والقوى بينها والتيار الكهربائي والمقاومة وقانون أوم وتحليل الدوائر البسيطة.',
                'full_description' => 'دورة فيزيائية متخصصة في الكهرباء تبدأ بمفهوم الشحنة الكهربائية وطرق الشحن بالدلك والتلامس والحث، وقانون كولوم لحساب القوة بين الشحنات. ينتقل البرنامج إلى التيار الكهربائي وشدته واتجاهه، والجهد الكهربائي والمقاومة وقانون أوم، وربط المقاومات على التوالي والتوازي وحساب التيار والجهد في الدوائر البسيطة، مع تطبيقات على الأجهزة المنزلية ومخاطر الكهرباء وطرق الوقاية.',
                'difficulty' => 'intermediate',
                'duration' => 30,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 289,
                'discount_price' => 209,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الكهرباء الساكنة والتيارية - فيزياء المرحلة الثانوية',
                'seo_description' => 'تعلم الشحنات الكهربائية وقانون كولوم والتيار والمقاومة وقانون أوم وتحليل الدوائر الكهربائية مع أمثلة عملية.',
                'seo_keywords' => 'الكهرباء, الشحنة الكهربائية, قانون أوم, التيار الكهربائي, الدوائر الكهربائية, الفيزياء',
                'learning_outcomes' => [
                    'وصف الشحنات الكهربائية وطرق شحن الأجسام',
                    'تطبيق قانون كولوم في حساب القوى الكهربائية',
                    'حل مسائل قانون أوم',
                    'تحليل الدوائر الكهربائية البسيطة',
                    'تطبيق قواعد السلامة الكهربائية',
                ],
                'requirements' => [
                    'معرفة أساسية بالفيزياء',
                    'إتقان الجبر في الحسابات',
                    'معرفة بالطاقة وأشكالها',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على الهندسة الكهربائية',
                    'الراغبون في فهم الأجهزة الكهربائية',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الكيمياء',
                'slug' => 'chemical-calculations',
                'title' => 'الحسابات الكيميائية',
                'subtitle' => 'المول وحسابات المعادلات الكيميائية والمواد المتفاعلة المحددة',
                'short_description' => 'دورة في الحسابات الكيميائية: المول والكتلة المولية وموازنة المعادلات وحساباتها.',
                'description' => 'إتقان حسابات المول والكتلة المولية والموازنة الكيميائية وتطبيق حسابات المتفاعلات والنواتج.',
                'full_description' => 'دورة متخصصة في الحسابات الكيميائية لطلاب المرحلة الثانوية. يبدأ البرنامج بمفهوم المول وعلاقته بعدد أفوجادرو والكتلة المولية والكتلة الذرية، والتحويل بين الكتلة والمول وعدد الجزيئات. ثم يتناول موازنة المعادلات الكيميائية وكتابة النسب المولية، وحساب كمية المتفاعلات والنواتج، وتحديد المادة المتفاعلة المحددة والنسبة المئوية للمردود، مع تدريبات عددية متنوعة وأسلوب منهجي في الحل.',
                'difficulty' => 'intermediate',
                'duration' => 30,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 269,
                'discount_price' => null,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الحسابات الكيميائية - كيمياء المرحلة الثانوية',
                'seo_description' => 'تعلم حساب المول والكتلة المولية وموازنة المعادلات الكيميائية وتحديد المتفاعل المحدد مع تدريبات عددية شاملة.',
                'seo_keywords' => 'الحسابات الكيميائية, المول, الكتلة المولية, موازنة المعادلات, المتفاعل المحدد',
                'learning_outcomes' => [
                    'حساب المول والكتلة المولية',
                    'التحويل بين الكتلة والمول وعدد الجزيئات',
                    'موازنة المعادلات الكيميائية',
                    'حساب كميات المتفاعلات والنواتج',
                    'تحديد المتفاعل المحدد والمردود المئوي',
                ],
                'requirements' => [
                    'معرفة أساسية بالروابط الكيميائية',
                    'إتقان العمليات الحسابية',
                    'معرفة بالكتلة الذرية',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على الكيمياء الجامعية',
                    'الراغبون في الحسابات المعملية الدقيقة',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الرياضيات',
                'slug' => 'advanced-trigonometry',
                'title' => 'حساب المثلثات المتقدم',
                'subtitle' => 'الدوال المثلثية والمتطابقات وحل المثلثات',
                'short_description' => 'دورة متقدمة في حساب المثلثات: الدوال المثلثية للزوايا المتوسعة والمتطابقات وقوانين الجيب وجيب التمام.',
                'description' => 'دراسة الدوال المثلثية بشكل متقدم وحل المتطابقات وقانوني الجيب وجيب التمام لحل المثلثات.',
                'full_description' => 'دورة متقدمة في حساب المثلثات لطلاب المرحلة الثانوية. تغطي الدوال المثلثية للزوايا القياسية وغير القياسية والدائرة المثلثية وقياس الزوايا بالدرجات والراديان. يتدرب الطالب على إثبات المتطابقات المثلثية الأساسية وتبسيط المقادير، وتطبيق قانون الجيب وقانون جيب التمام لحل المثلثات العامة ومسائل المساحة والارتفاعات، مع تطبيقات هندسية وواقعية متنوعة.',
                'difficulty' => 'intermediate',
                'duration' => 26,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 239,
                'discount_price' => null,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة حساب المثلثات المتقدم - الرياضيات للمرحلة الثانوية',
                'seo_description' => 'تعلم الدوال المثلثية والدائرة المثلثية والمتطابقات وقانوني الجيب وجيب التمام لحل المثلثات مع تمارين متقدمة.',
                'seo_keywords' => 'حساب المثلثات, الدوال المثلثية, المتطابقات, قانون الجيب, قانون جيب التمام',
                'learning_outcomes' => [
                    'قياس الزوايا بالدرجات والراديان',
                    'تمثيل الدوال المثلثية على الدائرة المثلثية',
                    'إثبات وتطبيق المتطابقات المثلثية',
                    'حل المثلثات باستخدام قانوني الجيب وجيب التمام',
                    'تطبيق حساب المثلثات على مسائل هندسية',
                ],
                'requirements' => [
                    'إتقان أساسيات حساب المثلثات',
                    'معرفة بالهندسة التحليلية',
                    'الإلمام بالجبر المتقدم',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على اختبارات القدرات',
                    'الراغبون في دراسة الهندسة',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الفيزياء',
                'slug' => 'waves-and-sound',
                'title' => 'الموجات والصوت',
                'subtitle' => 'خصائص الموجات وسلوكها وفيزياء الصوت وتطبيقاتها',
                'short_description' => 'دورة في الموجات الميكانيكية وخصائصها وانتشار الصوت وخصائصه وتطبيقاته.',
                'description' => 'فهم الموجات وخصائصها: الطول الموجي والتردد والسعة، ودراسة انتشار الصوت وخصائصه.',
                'full_description' => 'دورة فيزيائية تتناول الموجات والصوت. تبدأ بتعريف الموجات وأنواعها المستعرضة والطولية، وخصائصها: الطول الموجي والتردد والسرعة والسعة وعلاقاتها، وانتقال الطاقة بالموجات. ينتقل البرنامج إلى الصوت: مصدره وانتشاره في الأوساط وسرعته وعلاقتها بدرجة الحرارة، وخصائصه الصوتية: درجة الصوت وشدته ونوعه، والانعكاس وتردد الرنين، مع تطبيقات على السونار والموجات فوق الصوتية والأدوات الموسيقية.',
                'difficulty' => 'intermediate',
                'duration' => 24,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 249,
                'discount_price' => null,
                'enrollment_limit' => 700,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الموجات والصوت - فيزياء المرحلة الثانوية',
                'seo_description' => 'تعلم الموجات وخصائصها وانتشار الصوت وخصائصه وتطبيقات الموجات فوق الصوتية مع شرح مبسط وأمثلة عملية.',
                'seo_keywords' => 'الموجات, الصوت, الطول الموجي, التردد, الرنين, الفيزياء',
                'learning_outcomes' => [
                    'تمييز أنواع الموجات وخصائصها',
                    'حساب سرعة الموجات وطولها الموجي',
                    'شرح انتشار الصوت وخصائصه',
                    'تطبيق مبادئ الموجات على الظواهر الصوتية',
                    'استخدام تقنيات الموجات في التطبيقات الحديثة',
                ],
                'requirements' => [
                    'معرفة أساسية بالحركة والاهتزاز',
                    'إتقان الجبر في الحسابات',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المهتمون بالصوتيات',
                    'الراغبون في فهم التكنولوجيا الصوتية',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الكيمياء',
                'slug' => 'acids-and-bases',
                'title' => 'الأحماض والقواعد',
                'subtitle' => 'خواص الأحماض والقواعد ومقياس الرقم الهيدروجيني والتفاعلات',
                'short_description' => 'دورة في الأحماض والقواعد: خواصها وتصنيفها والرقم الهيدروجيني والتفاعلات والمعايرة.',
                'description' => 'فهم الأحماض والقواعد وخصائصها والرقم الهيدروجيني وتفاعلات التعادل والمعايرة.',
                'full_description' => 'دورة كيميائية متخصصة في الأحماض والقواعد. يستعرض البرنامج خواص الأحماض والقواعد وتصنيفاتها ونظرياتها: أرينيوس وبرونستد لوري ولويس، ثم يشرح مقياس الرقم الهيدروجيني وحسابه وتفسير قيم الأوساط الحمضية والقاعدية والمتعادلة. يتناول البرنامج تفاعلات التعادل وإنتاج الأملاح وطرق إجراء المعايرة وتحديد تركيز المحاليل، مع تطبيقات على الأحماض والقواعد في الحياة اليومية والصناعة والجسم البشري.',
                'difficulty' => 'intermediate',
                'duration' => 28,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 279,
                'discount_price' => 199,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الأحماض والقواعد - كيمياء المرحلة الثانوية',
                'seo_description' => 'تعلم خواص الأحماض والقواعد والرقم الهيدروجيني ونظرياتها وتفاعلات التعادل والمعايرة مع أمثلة وتطبيقات عملية.',
                'seo_keywords' => 'الأحماض, القواعد, الرقم الهيدروجيني, التعادل, المعايرة, الكيمياء',
                'learning_outcomes' => [
                    'تمييز الأحماض والقواعد وخصائصها',
                    'تفسير نظريات الأحماض والقواعد',
                    'حساب الرقم الهيدروجيني للمحاليل',
                    'كتابة تفاعلات التعادل وتكوين الأملاح',
                    'إجراء عمليات المعايرة وحساب التركيز',
                ],
                'requirements' => [
                    'معرفة بالروابط الكيميائية والمحاليل',
                    'معرفة أساسية بالحسابات الكيميائية',
                    'الإلمام بخصائص الماء',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على الكيمياء الجامعية',
                    'الراغبون في فهم الكيمياء اليومية',
                ],
            ],
            [
                'stage' => 'المرحلة الثانوية',
                'subject' => 'الرياضيات',
                'slug' => 'analytic-geometry',
                'title' => 'الهندسة التحليلية',
                'subtitle' => 'ربط الهندسة بالجبر: الإحداثيات والخط المستقيم والدوائر',
                'short_description' => 'دورة في الهندسة التحليلية: المستوى الإحداثي والمعادلات الهندسية وتمثيل المنحنيات.',
                'description' => 'دراسة الهندسة باستخدام الجبر: النقطة والمسافة والإحداثيات والمعادلات الخطية ومعادلات الدوائر.',
                'full_description' => 'دورة في الهندسة التحليلية لطلاب المرحلة الثانوية تجمع بين الجبر والهندسة. يتعلم الطالب تمثيل النقاط في المستوى الإحداثي وحساب المسافة بين نقطتين وإحداثيات منتصف قطعة مستقيمة، ثم معادلة الخط المستقيم بميله ونقطة وميله، وبالصور المختلفة للخط المستقيم والعلاقة بين المستقيمات المتوازية والمتعامدة. يتناول الجزء الأخير معادلة الدائرة وتمثيلها ودراسة علاقات المستقيم والدائرة، مع تطبيقات عملية على النماذج الرياضية.',
                'difficulty' => 'intermediate',
                'duration' => 26,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 239,
                'discount_price' => null,
                'enrollment_limit' => 800,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الهندسة التحليلية - الرياضيات للمرحلة الثانوية',
                'seo_description' => 'تعلم الهندسة التحليلية: الإحداثيات والمسافة والمستقيمات والدوائر وتمثيلها بيانياً مع تمارين تطبيقية شاملة.',
                'seo_keywords' => 'الهندسة التحليلية, المستوى الإحداثي, الخط المستقيم, الدائرة, الرياضيات',
                'learning_outcomes' => [
                    'تمثيل النقاط وحساب المسافات في المستوى الإحداثي',
                    'كتابة معادلات الخط المستقيم',
                    'تحديد العلاقات بين المستقيمات',
                    'كتابة معادلة الدائرة وتحليلها',
                    'تطبيق الهندسة التحليلية في النماذج الرياضية',
                ],
                'requirements' => [
                    'معرفة أساسية بالجبر والخطوط',
                    'الإلمام بحساب المثلثات الأساسي',
                    'معرفة بالتمثيل البياني',
                ],
                'target_audience' => [
                    'طلاب المرحلة الثانوية',
                    'الطلاب المقبلون على التفاضل',
                    'الراغبون في دراسة الرياضيات التطبيقية',
                ],
            ],

            // ═══════════════════════════════════════════
            //  المرحلة الجامعية
            // ═══════════════════════════════════════════
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الرياضيات',
                'slug' => 'differential-calculus',
                'title' => 'التفاضل',
                'subtitle' => 'النهايات والاشتقاق وتطبيقات التفاضل',
                'short_description' => 'دورة جامعية في التفاضل: النهايات والاتصال والاشتقاق وقواعده وتطبيقاته في المثلى والمعدلات.',
                'description' => 'دراسة النهايات والاتصال ومفهوم المشتقة وقواعد الاشتقاق وتطبيقات التفاضل في الهندسة والمسائل العملية.',
                'full_description' => 'دورة جامعية شاملة في حساب التفاضل. تبدأ بالنهايات وحسابها جبرياً وبيانياً وحالات عدم التعيين، ومفهوم الاتصال للدوال. ثم يقدم البرنامج تعريف المشتقة وتفسيرها الهندسي كالميل لمماس المنحنى والفيزيائي كمعدل التغير، وقواعد الاشتقاق للدوال الجبرية والمثلثية والأسية واللوغاريتمية وقاعدة السلسلة. يختم البرنامج بتطبيقات التفاضل: المعدلات الزمنية المرتبطة، المسائل العظمى والصغرى، ودراسة منحنيات الدوال.',
                'difficulty' => 'advanced',
                'duration' => 42,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 399,
                'discount_price' => 299,
                'enrollment_limit' => 500,
                'certificate_enabled' => true,
                'seo_title' => 'دورة التفاضل - حساب التفاضل الجامعي المتقدم',
                'seo_description' => 'تعلم النهايات والاتصال والاشتقاق وقواعده وتطبيقات التفاضل في المسائل المثلى والمعدلات الزمنية مع أمثلة جامعية.',
                'seo_keywords' => 'التفاضل, النهايات, الاشتقاق, المشتقة, حساب التفاضل, الرياضيات',
                'learning_outcomes' => [
                    'حساب النهايات ودراسة الاتصال',
                    'اشتقاق الدوال الجبرية والمثلثية والأسية',
                    'تطبيق قاعدة السلسلة والاشتقاق الضمني',
                    'حل المسائل المثلى باستخدام التفاضل',
                    'حساب المعدلات الزمنية المرتبطة',
                    'دراسة منحنيات الدوال ونقاطها الحرجة',
                ],
                'requirements' => [
                    'إتقان الجبر وحساب المثلثات',
                    'معرفة أساسية بالدوال وتمثيلها',
                    'مستوى جيد في الرياضيات الثانوية',
                ],
                'target_audience' => [
                    'طلاب الجامعة في التخصصات العلمية',
                    'الطلاب المقبلون على الهندسة والعلوم',
                    'الراغبون في إتقان أساسيات التحليل الرياضي',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الفيزياء',
                'slug' => 'electromagnetism',
                'title' => 'الكهرومغناطيسية',
                'subtitle' => 'الكهرباء والمغناطيسية والعلاقة بينهما',
                'short_description' => 'دورة جامعية في الكهرومغناطيسية: المجالات الكهربائية والمغناطيسية والحث الكهرومغناطيسي.',
                'description' => 'دراسة المجالات الكهربائية والمغناطيسية وقانونا غاوس وأمبير والحث الكهرومغناطيسي وقانون فارادي.',
                'full_description' => 'دورة جامعية في الكهرومغناطيسية تبدأ بمجال الكهرباء الساكنة: قوة كولوم والمجال الكهربائي وطاقة الوضع والجهد، وقانون غاوس وتطبيقاته. ينتقل البرنامج إلى المجال المغناطيسي والقوة المغناطيسية على الشحنات المتحركة والتيارات، وقانون أمبير وتطبيقات الملفات، ثم الحث الكهرومغناطيسي وقانون فارادي وقانون لينز والحث الذاتي. يتضمن البرنامج أساسيات معادلات ماكسويل من منظور وصفي مع تطبيقات عملية من الأجهزة الحديثة.',
                'difficulty' => 'advanced',
                'duration' => 48,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 449,
                'discount_price' => null,
                'enrollment_limit' => 400,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الكهرومغناطيسية - الفيزياء الجامعية المتقدمة',
                'seo_description' => 'تعلم المجالات الكهربائية والمغناطيسية وقانون غاوس وأمبير والحث الكهرومغناطيسي وقانون فارادي مع تطبيقات جامعية.',
                'seo_keywords' => 'الكهرومغناطيسية, المجال الكهربائي, المجال المغناطيسي, الحث الكهرومغناطيسي, قانون فارادي',
                'learning_outcomes' => [
                    'حساب المجالات الكهربائية للشحنات والتوزيعات',
                    'تطبيق قانون غاوس على الأنظمة المتناظرة',
                    'حساب القوى المغناطيسية على الشحنات والتيارات',
                    'تطبيق قانون أمبير على الملفات والأسلاك',
                    'تحليل الحث الكهرومغناطيسي وقانون فارادي',
                ],
                'requirements' => [
                    'إتقان فيزياء الثانوية والتفاضل والتكامل',
                    'معرفة بالمتجهات وحسابها',
                    'مستوى جيد في الكهرباء',
                ],
                'target_audience' => [
                    'طلاب الفيزياء والهندسة الكهربائية',
                    'طلاب السنة الجامعية الأولى والثانية',
                    'الراغبون في دراسة الكهرومغناطيسية بعمق',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الكيمياء',
                'slug' => 'organic-chemistry',
                'title' => 'الكيمياء العضوية',
                'subtitle' => 'المركبات الهيدروكربونية والمجموعات الوظيفية وتفاعلاتها',
                'short_description' => 'دورة جامعية في الكيمياء العضوية: الألكانات والألكينات والألكاينات والمجموعات الوظيفية.',
                'description' => 'دراسة الكيمياء العضوية: تسمية المركبات، الهيدروكربونات، المجموعات الوظيفية، والتفاعلات العضوية الأساسية.',
                'full_description' => 'دورة جامعية شاملة في الكيمياء العضوية. تبدأ بمقدمة عن الكيمياء العضوية وخصائص ذرة الكربون والروابط والتشكلات، ثم التسمية النظامية للهيدروكربونات المشبعة وغير المشبعة والألكانات والألكينات والألكاينات وخصائصها وتفاعلاتها. يتناول البرنامج المجموعات الوظيفية الأساسية: الهاليدات والكحولات والإيثرات والألدهيدات والكيتونات والأحماض الكربوكسيلية والأمينات، مع دراسة آليات التفاعلات الأساسية الاستبدال والإضافة والحذف، وأمثلة تطبيقية من الصناعات البتروكيميائية والدوائية.',
                'difficulty' => 'advanced',
                'duration' => 46,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 429,
                'discount_price' => 329,
                'enrollment_limit' => 450,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الكيمياء العضوية - الكيمياء الجامعية المتقدمة',
                'seo_description' => 'تعلم الكيمياء العضوية: تسمية الهيدروكربونات والمجموعات الوظيفية وآليات التفاعلات مع أمثلة من الصناعة والدواء.',
                'seo_keywords' => 'الكيمياء العضوية, الهيدروكربونات, المجموعات الوظيفية, الألكانات, المركبات العضوية',
                'learning_outcomes' => [
                    'تسمية المركبات العضوية وفق النظام الدولي',
                    'وصف خواص الهيدروكربونات وتفاعلاتها',
                    'تمييز المجموعات الوظيفية وخواصها',
                    'تحليل آليات التفاعلات الأساسية',
                    'ربط الكيمياء العضوية بالتطبيقات الصناعية والدوائية',
                ],
                'requirements' => [
                    'معرفة أساسية بالروابط الكيميائية',
                    'إتقان الكيمياء العامة',
                    'معرفة بالجدول الدوري',
                ],
                'target_audience' => [
                    'طلاب الكيمياء والكيمياء الحيوية',
                    'طلاب الصيدلة والطب',
                    'الراغبون في تخصص الكيمياء العضوية',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الرياضيات',
                'slug' => 'integral-calculus',
                'title' => 'التكامل وتطبيقاته',
                'subtitle' => 'التكامل غير المحدد والمحدد وطرق التكامل وتطبيقاته الهندسية',
                'short_description' => 'دورة جامعية في التكامل: التكامل غير المحدد والمحدد وطرقه وتطبيقاته في المساحات والأحجام.',
                'description' => 'إتقان التكامل غير المحدد والمحدد وطرق التعويض والتكامل بالأجزاء وتطبيقاته الهندسية والفيزيائية.',
                'full_description' => 'دورة جامعية في التكامل تبنى على أساس التفاضل. تبدأ بمفهوم التكامل غير المحدد كمعكوس للاشتقاق وجدول التكاملات الأساسية، ثم التكامل المحدد ونظرية التفاضل والتكامل الأساسية وحساب المساحات تحت المنحنيات. يقدم البرنامج طرق التكامل: التعويض البسيط والتكامل بالأجزاء والتكامل بالكسور الجزئية، ثم تطبيقات التكامل المحدد في حساب المساحات بين المنحنيات وأحجام الأجسام الدورانية وأطوال المنحنيات، مع مسائل تطبيقية من الفيزياء والهندسة.',
                'difficulty' => 'advanced',
                'duration' => 44,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 399,
                'discount_price' => null,
                'enrollment_limit' => 450,
                'certificate_enabled' => true,
                'seo_title' => 'دورة التكامل وتطبيقاته - الرياضيات الجامعية المتقدمة',
                'seo_description' => 'تعلم التكامل غير المحدد والمحدد وطرق التعويض والتكامل بالأجزاء وتطبيقاته في المساحات والأحجام مع تمارين جامعية.',
                'seo_keywords' => 'التكامل, التكامل المحدد, التكامل بالأجزاء, المساحات, الحجوم, الرياضيات',
                'learning_outcomes' => [
                    'حساب التكاملات غير المحددة الأساسية',
                    'تطبيق نظرية التفاضل والتكامل الأساسية',
                    'استخدام طرق التعويض والتكامل بالأجزاء',
                    'حساب المساحات بين المنحنيات',
                    'حساب أحجام الأجسام الدورانية',
                    'تطبيق التكامل في مسائل فيزيائية وهندسية',
                ],
                'requirements' => [
                    'إتقان قواعد التفاضل',
                    'معرفة بالدوال الأسية والمثلثية',
                    'مستوى جيد في الجبر',
                ],
                'target_audience' => [
                    'طلاب الرياضيات والهندسة',
                    'طلاب العلوم والاقتصاد',
                    'الراغبون في دراسة التحليل الرياضي',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الفيزياء',
                'slug' => 'modern-physics',
                'title' => 'الفيزياء الحديثة',
                'subtitle' => 'النسبية وميكانيكا الكم وبنية الذرة والنواة',
                'short_description' => 'دورة جامعية في الفيزياء الحديثة: النسبية الخاصة وميكانيكا الكم والفيزياء النووية.',
                'description' => 'دراسة النسبية الخاصة وميكانيكا الكم والظاهرة الكهروضوئية والفيزياء النووية والجسيمات.',
                'full_description' => 'دورة جامعية تستعرض الثورات الفيزيائية في القرن العشرين. تبدأ بالنسبية الخاصة لأينشتاين: تمدد الزمن وتقلص الأطوال وتكافؤ الكتلة والطاقة. ينتقل البرنامج إلى ميكانيكا الكم: الإشعاع الحراري والظاهرة الكهروضوئية وتأثير كومبتون وموجات دي برولي ومبدأ الريبة وازدواجية الموجة والجسيم. يختتم البرنامج بالفيزياء النووية: النشاط الإشعاعي والنظائر والانشطار والاندماج النووي وتطبيقاتهما في الطاقة والطب.',
                'difficulty' => 'advanced',
                'duration' => 46,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 449,
                'discount_price' => 349,
                'enrollment_limit' => 350,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الفيزياء الحديثة - الفيزياء الجامعية المتقدمة',
                'seo_description' => 'تعلم النسبية الخاصة وميكانيكا الكم والظاهرة الكهروضوئية والفيزياء النووية مع شرح مفاهيم حديثة بطريقة مبسطة.',
                'seo_keywords' => 'الفيزياء الحديثة, النسبية, ميكانيكا الكم, الظاهرة الكهروضوئية, الفيزياء النووية',
                'learning_outcomes' => [
                    'تطبيق مفاهيم النسبية الخاصة',
                    'تفسير الظاهرة الكهروضوئية وتأثير كومبتون',
                    'وصف مبادئ ميكانيكا الكم وازدواجية الموجة والجسيم',
                    'تحليل النشاط الإشعاعي والانشطار والاندماج',
                    'ربط الفيزياء الحديثة بتطبيقات الطاقة والطب',
                ],
                'requirements' => [
                    'إتقان الفيزياء الكلاسيكية',
                    'معرفة بالتفاضل والتكامل',
                    'مستوى جيد في الكهرومغناطيسية',
                ],
                'target_audience' => [
                    'طلاب الفيزياء والهندسة النووية',
                    'طلاب السنة الجامعية المتقدمة',
                    'الراغبون في فهم الاكتشافات الحديثة',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الكيمياء',
                'slug' => 'chemical-equilibrium',
                'title' => 'الاتزان الكيميائي',
                'subtitle' => 'قوانين الاتزان وثابت الاتزان ومبدأ لوشاتيليه',
                'short_description' => 'دورة جامعية في الاتزان الكيميائي: ثابت الاتزان ومبدأ لوشاتيليه والعوامل المؤثرة.',
                'description' => 'فهم الاتزان الكيميائي الديناميكي وثابت الاتزان والعوامل المؤثرة فيه ومبدأ لوشاتيليه.',
                'full_description' => 'دورة جامعية متخصصة في الاتزان الكيميائي. تبدأ بمفهوم الاتزان الديناميكي وحالة الاتزان في التفاعلات العكوسة، وكتابة تعبير ثابت الاتزان وحسابه من التراكيز والضغوط الجزئية، وأنواع ثوابت الاتزان والعلاقة بينها. يشرح البرنامج مبدأ لوشاتيليه وتأثير تغير التركيز والضغط والحرارة على موضع الاتزان، مع تطبيقات على التفاعلات الصناعية كعملية هابر لتصنيع الأمونيا وعملية الاتصال لإنتاج حمض الكبريتيك، وتحليل المسائل العددية المرتبطة بها.',
                'difficulty' => 'advanced',
                'duration' => 40,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 389,
                'discount_price' => null,
                'enrollment_limit' => 400,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الاتزان الكيميائي - الكيمياء الجامعية المتقدمة',
                'seo_description' => 'تعلم الاتزان الكيميائي وثابت الاتزان ومبدأ لوشاتيليه وتأثير العوامل على موضع الاتزان مع تطبيقات صناعية.',
                'seo_keywords' => 'الاتزان الكيميائي, ثابت الاتزان, مبدأ لوشاتيليه, التفاعلات العكوسة, الكيمياء',
                'learning_outcomes' => [
                    'وصف الاتزان الديناميكي في التفاعلات',
                    'كتابة وحساب ثابت الاتزان',
                    'تطبيق مبدأ لوشاتيليه',
                    'تحليل تأثير العوامل على موضع الاتزان',
                    'تطبيق مفاهيم الاتزان في العمليات الصناعية',
                ],
                'requirements' => [
                    'إتقان الحسابات الكيميائية',
                    'معرفة بالغازات والمحاليل',
                    'معرفة أساسية بالديناميكا الحرارية',
                ],
                'target_audience' => [
                    'طلاب الكيمياء والهندسة الكيميائية',
                    'طلاب السنة الجامعية الثانية والثالثة',
                    'الراغبون في تخصص الكيمياء الصناعية',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الرياضيات',
                'slug' => 'matrices-and-linear-algebra',
                'title' => 'المصفوفات والجبر الخطي',
                'subtitle' => 'المصفوفات والمحددات والفضاءات المتجهة والتحويلات الخطية',
                'short_description' => 'دورة جامعية في الجبر الخطي: المصفوفات والمحددات وحل الأنظمة والفضاءات المتجهة.',
                'description' => 'دراسة المصفوفات وخصائصها والمحددات وحل أنظمة المعادلات والفضاءات المتجهة والتحويلات الخطية.',
                'full_description' => 'دورة جامعية في الجبر الخطي تبدأ بجبر المصفوفات: العمليات عليها وخواصها والمعكوس، ثم المحددات وحسابها وخصائصها. يتناول البرنامج حل أنظمة المعادلات الخطية بطريقة الحذف الغاوسي وطريقة معكوس المصفوفة وقاعدة كرامر. ينتقل بعدها إلى الفضاءات المتجهة والاستقلال الخطي والأساس والبعد، والتحويلات الخطية وتمثيلها بمصفوفات، مع تطبيقات عملية في الحوسبة والرسوميات والعلوم الهندسية والاقتصادية.',
                'difficulty' => 'advanced',
                'duration' => 45,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 399,
                'discount_price' => 299,
                'enrollment_limit' => 450,
                'certificate_enabled' => true,
                'seo_title' => 'دورة المصفوفات والجبر الخطي - الرياضيات الجامعية المتقدمة',
                'seo_description' => 'تعلم المصفوفات والمحددات وحل الأنظمة الخطية والفضاءات المتجهة والتحويلات الخطية مع تطبيقات عملية.',
                'seo_keywords' => 'المصفوفات, الجبر الخطي, المحددات, الفضاءات المتجهة, التحويلات الخطية',
                'learning_outcomes' => [
                    'إجراء العمليات على المصفوفات وحساب المعكوس',
                    'حساب المحددات وخصائصها',
                    'حل الأنظمة الخطية بالطرق المصفوفية',
                    'تحديد الأساس والبعد للفضاءات المتجهة',
                    'تحليل التحويلات الخطية وتمثيلها',
                    'تطبيق الجبر الخطي في التطبيقات العملية',
                ],
                'requirements' => [
                    'إتقان الجبر الثانوي',
                    'معرفة بحل المعادلات الخطية',
                    'مستوى جيد في التفكير التجريدي',
                ],
                'target_audience' => [
                    'طلاب الرياضيات والهندسة',
                    'طلاب علوم الحاسوب والاقتصاد',
                    'الراغبون في دراسة الرياضيات النظرية',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الفيزياء',
                'slug' => 'heat-and-thermodynamics',
                'title' => 'الحرارة والديناميكا الحرارية',
                'subtitle' => 'قوانين الديناميكا الحرارية وانتقال الحرارة والمحركات الحرارية',
                'short_description' => 'دورة جامعية في الحرارة والديناميكا الحرارية: درجة الحرارة وانتقال الحرارة والقوانين الثلاثة.',
                'description' => 'دراسة درجة الحرارة وتمدد الأجسام وانتقال الحرارة وقوانين الديناميكا الحرارية والإنتروبيا.',
                'full_description' => 'دورة جامعية في الديناميكا الحرارية تبدأ بمفهوم درجة الحرارة ومقاييسها وتمدد المواد الصلبة والسائلة والغازية، وكمية الحرارة والحرارة النوعية. يقدم البرنامج آليات انتقال الحرارة الثلاث: التوصيل والحمل والإشعاع. ينتقل بعدها إلى قوانين الديناميكا الحرارية: القانون الأول والطاقة الداخلية والشغل، والعمليات الديناميكية الحرارية للغاز المثالي، والقانون الثاني والإنتروبيا، وتطبيقات المحركات الحرارية والثلاجات، مع تحليل كفاءة الآلات الحرارية.',
                'difficulty' => 'advanced',
                'duration' => 44,
                'featured' => true,
                'pricing_type' => 'paid',
                'price_amount' => 429,
                'discount_price' => 329,
                'enrollment_limit' => 400,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الحرارة والديناميكا الحرارية - الفيزياء الجامعية المتقدمة',
                'seo_description' => 'تعلم درجة الحرارة وانتقال الحرارة وقوانين الديناميكا الحرارية والإنتروبيا والمحركات الحرارية مع أمثلة عملية.',
                'seo_keywords' => 'الحرارة, الديناميكا الحرارية, الإنتروبيا, انتقال الحرارة, المحركات الحرارية',
                'learning_outcomes' => [
                    'قياس درجة الحرارة وشرح تمدد الأجسام',
                    'تحليل آليات انتقال الحرارة',
                    'تطبيق القانون الأول للديناميكا الحرارية',
                    'تحليل القانون الثاني ومفهوم الإنتروبيا',
                    'تقييم كفاءة المحركات الحرارية والثلاجات',
                    'ربط الديناميكا الحرارية بالأنظمة الطبيعية',
                ],
                'requirements' => [
                    'إتقان الفيزياء الكلاسيكية',
                    'معرفة بالتفاضل والتكامل',
                    'معرفة أساسية بالغازات',
                ],
                'target_audience' => [
                    'طلاب الفيزياء والهندسة الميكانيكية',
                    'طلاب الطاقة المتجددة',
                    'الراغبون في فهم الطاقة الحرارية',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الكيمياء',
                'slug' => 'electrochemistry',
                'title' => 'الكهروكيمياء',
                'subtitle' => 'الخلايا الكهروكيميائية والجلفانية والإلكتروليتية',
                'short_description' => 'دورة جامعية في الكهروكيمياء: الخلايا الجلفانية وسلاسل الجهود والتحليل الكهربائي.',
                'description' => 'دراسة الخلايا الكهروكيميائية وتوليد الطاقة الكيميائية الكهربائية وقوانين فارادي للتحليل الكهربائي.',
                'full_description' => 'دورة جامعية في الكهروكيمياء تبدأ بالعلاقة بين التفاعلات الكيميائية والتيار الكهربائي والخلايا الجلفانية وتكوينها وتحديد جهود الأقطاب وسلسلة الجهود القياسية وحساب القوة الدافعة الكهربائية للخلايا. يشرح البرنامج التحليل الكهربائي لمحاليل الأملاح والذوبان المنصهر وقوانين فارادي وحساب كمية المادة المترسبة، مع تطبيقات صناعية مهمة كطلاء الفلزات وتنقية النحاس وإنتاج الألمنيوم والبطاريات وخلايا الوقود.',
                'difficulty' => 'advanced',
                'duration' => 42,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 399,
                'discount_price' => null,
                'enrollment_limit' => 400,
                'certificate_enabled' => true,
                'seo_title' => 'دورة الكهروكيمياء - الكيمياء الجامعية المتقدمة',
                'seo_description' => 'تعلم الخلايا الجلفانية والتحليل الكهربائي وقوانين فارادي وسلاسل الجهود مع تطبيقات صناعية وأمثلة تفصيلية.',
                'seo_keywords' => 'الكهروكيمياء, الخلايا الجلفانية, التحليل الكهربائي, قوانين فارادي, البطاريات',
                'learning_outcomes' => [
                    'وصف مكونات الخلايا الكهروكيميائية',
                    'حساب جهود الخلايا والقوة الدافعة الكهربائية',
                    'تطبيق قوانين فارادي في التحليل الكهربائي',
                    'تحليل تطبيقات الطلاء الكهربائي والصناعات',
                    'تقييم أنواع البطاريات وخلايا الوقود',
                ],
                'requirements' => [
                    'إتقان الحسابات الكيميائية',
                    'معرفة بالأكسدة والاختزال',
                    'معرفة أساسية بالكهرباء',
                ],
                'target_audience' => [
                    'طلاب الكيمياء والهندسة الكيميائية',
                    'طلاب تخصصات الطاقة',
                    'الراغبون في فهم البطاريات الحديثة',
                ],
            ],
            [
                'stage' => 'المرحلة الجامعية',
                'subject' => 'الرياضيات',
                'slug' => 'vectors-and-vector-calculus',
                'title' => 'المتجهات والتحليل المتجهي',
                'subtitle' => 'جبر المتجهات وتطبيقاته في الهندسة والفيزياء',
                'short_description' => 'دورة جامعية في المتجهات: العمليات المتجهية والضرب القياسي والاتجاهي وتطبيقاتها الهندسية.',
                'description' => 'دراسة المتجهات وتمثيلها والعمليات عليها والضرب القياسي والاتجاهي وتطبيقاتها في الفضاء والفيزياء.',
                'full_description' => 'دورة جامعية في جبر المتجهات تبدأ بتعريف الكميات القياسية والمتجهة وتمثيل المتجهات في المستوي والفضاء الثلاثي الأبعاد والعمليات على المتجهات: الجمع والطرح والضرب في عدد، ومركبات المتجه والزوايا بين المتجهات. يتناول البرنامج الضرب القياسي وحساب الزوايا والإسقاطات والضرب الاتجاهي وتطبيقاته في حساب المساحات، والضرب المختلط وحساب الحجوم، مع تطبيقات المتجهات في الفيزياء والهندسة ومسائل القوى والحركة.',
                'difficulty' => 'advanced',
                'duration' => 38,
                'featured' => false,
                'pricing_type' => 'paid',
                'price_amount' => 369,
                'discount_price' => 269,
                'enrollment_limit' => 450,
                'certificate_enabled' => true,
                'seo_title' => 'دورة المتجهات والتحليل المتجهي - الرياضيات الجامعية المتقدمة',
                'seo_description' => 'تعلم المتجهات وتمثيلها والضرب القياسي والاتجاهي وتطبيقاتها في الهندسة والفيزياء مع تمارين جامعية شاملة.',
                'seo_keywords' => 'المتجهات, الضرب القياسي, الضرب الاتجاهي, التحليل المتجهي, الرياضيات',
                'learning_outcomes' => [
                    'تمثيل المتجهات في المستوي والفضاء',
                    'إجراء العمليات على المتجهات',
                    'تطبيق الضرب القياسي والاتجاهي',
                    'حساب المساحات والحجوم باستخدام المتجهات',
                    'تطبيق المتجهات في مسائل الفيزياء والهندسة',
                ],
                'requirements' => [
                    'معرفة بالجبر والهندسة',
                    'معرفة أساسية بحساب المثلثات',
                    'مستوى جيد في الرياضيات الثانوية',
                ],
                'target_audience' => [
                    'طلاب الرياضيات والفيزياء والهندسة',
                    'طلاب السنة الجامعية الأولى',
                    'الراغبون في أساسيات التحليل المتجهي',
                ],
            ],
        ];
    }
}
