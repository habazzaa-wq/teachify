<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseInstructor;
use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Models\CourseSection;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Courses\CourseService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder
{
    private Tenant $tenant;
    private TenantUser $creator;
    private int $coursesCreated = 0;
    private int $coursesSkipped = 0;
    private int $modulesCreated = 0;
    private int $modulesSkipped = 0;
    private int $sectionsCreated = 0;
    private int $sectionsSkipped = 0;
    private int $lessonsCreated = 0;
    private int $lessonsSkipped = 0;
    private int $categoriesCreated = 0;
    private int $categoriesReused = 0;
    private int $instructorsCreated = 0;
    private int $instructorsReused = 0;

    public function run(): void
    {
        $startTime = microtime(true);

        $this->resolveTenant();
        $this->resolveInstructors();
        $this->bindTenantContext();

        DB::transaction(function (): void {
            $this->seedCategories();
            $this->seedCourses();
        });

        $elapsed = round(microtime(true) - $startTime, 2);

        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('  Production Course Seeder - Summary');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info("  Courses Created       : {$this->coursesCreated}");
        $this->command->info("  Courses Skipped       : {$this->coursesSkipped}");
        $this->command->info("  Modules Created       : {$this->modulesCreated}");
        $this->command->info("  Modules Skipped       : {$this->modulesSkipped}");
        $this->command->info("  Sections Created      : {$this->sectionsCreated}");
        $this->command->info("  Sections Skipped      : {$this->sectionsSkipped}");
        $this->command->info("  Lessons Created       : {$this->lessonsCreated}");
        $this->command->info("  Lessons Skipped       : {$this->lessonsSkipped}");
        $this->command->info("  Categories Reused     : {$this->categoriesReused}");
        $this->command->info("  Categories Created    : {$this->categoriesCreated}");
        $this->command->info("  Instructors Reused    : {$this->instructorsReused}");
        $this->command->info("  Instructors Created   : {$this->instructorsCreated}");
        $this->command->info("  Execution Time        : {$elapsed}s");
        $this->command->info('═══════════════════════════════════════════');
    }

    private function resolveTenant(): void
    {
        $domain = TenantDomain::where('domain', 'hazem.academy.test')
            ->where('status', 'active')
            ->first();
        $this->tenant = $domain?->tenant ?? Tenant::firstOrFail();
    }

    private function resolveInstructors(): void
    {
        $this->creator = TenantUser::where('tenant_id', $this->tenant->id)
            ->where('status', 'active')
            ->first();

        if (! $this->creator) {
            $user = User::create([
                'name' => 'المدرس الافتراضي',
                'email' => 'instructor@' . Str::slug($this->tenant->name) . '.test',
                'password' => bcrypt('password'),
                'locale' => 'ar',
            ]);
            $this->creator = TenantUser::create([
                'tenant_id' => $this->tenant->id,
                'user_id' => $user->id,
                'status' => 'active',
                'job_title' => 'مدرّس',
                'joined_at' => now(),
            ]);
            $this->instructorsCreated++;
        } else {
            $this->instructorsReused++;
        }
    }

    private function bindTenantContext(): void
    {
        app()->instance(Tenant::class, $this->tenant);
        app()->instance('currentTenant', $this->tenant);
        app()->instance('currentTenantMembership', $this->creator);
    }

    // ═══════════════════════════════════════════════════
    // CATEGORIES
    // ═══════════════════════════════════════════════════

    private function seedCategories(): void
    {
        $definitions = [
            ['name' => 'تطوير الويب', 'slug' => 'web-development', 'description' => 'تطوير تطبيقات الويب والواجهات الأمامية والخلفية', 'color' => '#4F46E5', 'icon' => 'web', 'sort_order' => 1],
            ['name' => 'البرمجة', 'slug' => 'programming', 'description' => 'لغات البرمجة والخوارزميات وهياكل البيانات', 'color' => '#059669', 'icon' => 'code', 'sort_order' => 2],
            ['name' => 'DevOps', 'slug' => 'devops', 'description' => 'عمليات تطوير البرمجيات ونشرها وتشغيلها', 'color' => '#DC2626', 'icon' => 'devops', 'sort_order' => 3],
            ['name' => 'أنظمة Linux', 'slug' => 'linux-systems', 'description' => 'أنظمة التشغيل Linux والإدارة وال保全', 'color' => '#F59E0B', 'icon' => 'linux', 'sort_order' => 4],
            ['name' => 'ضمان الجودة', 'slug' => 'quality-assurance', 'description' => 'اختبار البرمجيات وضمان الجودة', 'color' => '#10B981', 'icon' => 'testing', 'sort_order' => 5],
            ['name' => 'هندسة البرمجيات', 'slug' => 'software-engineering', 'description' => 'مبادئ وهندسة تطوير البرمجيات', 'color' => '#8B5CF6', 'icon' => 'engineering', 'sort_order' => 6],
            ['name' => 'تصميم الأنظمة', 'slug' => 'system-design', 'description' => 'تصميم الأنظمة الموزعة والقابلة للتوسع', 'color' => '#EC4899', 'icon' => 'system', 'sort_order' => 7],
            ['name' => 'العمارة النظيفة', 'slug' => 'clean-architecture', 'description' => 'مبادئ العمارة النظيفة وتقسيم الطبقات', 'color' => '#06B6D4', 'icon' => 'clean', 'sort_order' => 8],
            ['name' => 'PHP', 'slug' => 'php', 'description' => 'لغة PHP وتطوير تطبيقات الويب', 'color' => '#777BB4', 'icon' => 'php', 'sort_order' => 9],
            ['name' => 'JavaScript', 'slug' => 'javascript', 'description' => 'لغة JavaScript وأطر العملassociated', 'color' => '#F7DF1E', 'icon' => 'js', 'sort_order' => 10],
        ];

        foreach ($definitions as $def) {
            $existing = Category::where('tenant_id', $this->tenant->id)
                ->where('slug', $def['slug'])
                ->first();
            if ($existing) {
                $this->categoriesReused++;
                continue;
            }
            Category::create([
                'tenant_id' => $this->tenant->id,
                'name' => $def['name'],
                'slug' => $def['slug'],
                'description' => $def['description'],
                'icon' => $def['icon'],
                'color' => $def['color'],
                'sort_order' => $def['sort_order'],
                'active' => true,
                'featured' => false,
            ]);
            $this->categoriesCreated++;
        }
    }

    // ═══════════════════════════════════════════════════
    // COURSES
    // ═══════════════════════════════════════════════════

    private function seedCourses(): void
    {
        $modulesBySlug = $this->modules();
        foreach ($this->courseDefinitions() as $courseData) {
            $courseData['modules'] = $modulesBySlug[$courseData['slug']] ?? [];
            $this->seedSingleCourse($courseData);
        }
    }

    private function courseDefinitions(): array
    {
        return [
            // ───────────────────────────────────────────
            // 1. Laravel من الصفر إلى الاحتراف
            // ───────────────────────────────────────────
            [
                'title' => 'Laravel من الصفر إلى الاحتراف',
                'slug' => 'laravel-from-scratch-to-mastery',
                'subtitle' => 'دورة شاملة لتعلم إطار عمل Laravel لبناء تطبيقات ويب احترافية',
                'short_description' => 'تعلم Laravel من الأساسيات إلى المستويات المتقدمة مع مشاريع عملية حقيقية',
                'description' => 'دورة متكاملة تغطي كل ما تحتاجه لاحتراف إطار عمل Laravel، من التأسيس إلى بناء تطبيقات إنتاجية.',
                'full_description' => 'هذه الدورة هي دليلك الشامل لإتقان إطار عمل Laravel. تبدأ من صفر وتصل إلى بناء تطبيقات ويب متكاملة باستخدام أحدث الممارسات والتقنيات. ستتعلم بناء واجهات برمجة التطبيقات، إدارة قواعد البيانات، المصادقة والتفويض، النشر والإنتاج، وأكثر من ذلك بكثير.',
                'difficulty' => 'beginner',
                'language' => 'ar',
                'duration' => 45,
                'pricing_type' => 'paid',
                'price_amount' => 4999,
                'price_currency' => 'SAR',
                'discount_price' => 2999,
                'enrollment_limit' => 500,
                'certificate_enabled' => true,
                'featured' => true,
                'seo_title' => 'دورة Laravel الشاملة - من المبتدئ إلى المحترف | تعلم PHP مع Laravel',
                'seo_description' => 'تعلم إطار عمل Laravel من الصفر إلى الاحتراف. دورة شاملة تغطي بناء تطبيقات الويب، واجهات البرمجة، قواعد البيانات، والمصادقة. شهادة إتمام معتمدة.',
                'seo_keywords' => 'Laravel, PHP, تعلم Laravel, برمجة ويب, تطوير تطبيقات, إطار عمل PHP',
                'learning_outcomes' => ['بناء تطبيقات ويب متكاملة باستخدام Laravel', 'فهم بنية MVC وتطبيقها بشكل صحيح', 'تطوير واجهات برمجة التطبيقات (APIs) باستخدام RESTful', 'إدارة قواعد البيانات باستخدام Eloquent ORM', 'تطبيق أنظمة المصادقة والتفويض', 'نشر التطبيقات على خوادم إنتاجية', 'استخدام Artisan CLI بكفاءة', 'تطبيق أنماط التصميم والعمارة النظيفة'],
                'requirements' => ['معرفة أساسية بـ PHP', 'فهم HTML و CSS', 'جهاز كمبيوتر مع متصفح إنترنت', 'الرغبة في التعلم والتطور'],
                'target_audience' => ['مطورو PHP المبتدئون والمتقدمون', 'المطورون الراغبون في تعلم Laravel', 'طلاب علوم الحاسوب', 'المطورون الذين يريدون بناء مشاريع عملية'],
                'category_slugs' => ['web-development', 'php'],
            ],
            // ───────────────────────────────────────────
            // 2. تطوير REST APIs باستخدام Laravel
            // ───────────────────────────────────────────
            [
                'title' => 'تطوير REST APIs باستخدام Laravel',
                'slug' => 'rest-api-development-with-laravel',
                'subtitle' => 'بناء واجهات برمجة تطبيقات احترافية وموثوقة',
                'short_description' => 'تعلم بناء واجهات برمجة التطبيقات RESTful باستخدام Laravel مع أفضل الممارسات',
                'description' => 'دورة متقدمة في بناء REST APIs احترافية باستخدام Laravel، تغطي التوثيق والأمان والأداء.',
                'full_description' => 'في هذه الدورة ستتعلم كيفية بناء واجهات برمجة تطبيقات RESTful احترافية باستخدام Laravel. ستغطي مواضيع متقدمة مثل التوثيق التلقائي، أنظمة المصادقة.Token-based، التعامل مع الأخطاء، تحسين الأداء، واختبار الـ APIs.',
                'difficulty' => 'intermediate',
                'language' => 'ar',
                'duration' => 35,
                'pricing_type' => 'paid',
                'price_amount' => 3999,
                'price_currency' => 'SAR',
                'discount_price' => 2499,
                'enrollment_limit' => 400,
                'certificate_enabled' => true,
                'featured' => true,
                'seo_title' => 'تطوير REST APIs بـ Laravel - دورة شاملة لواجهات البرمجة',
                'seo_description' => 'تعلم بناء REST APIs احترافية باستخدام Laravel. تغطي التوثيق، المصادقة، الأمان، تحسين الأداء، واختبار APIs.',
                'seo_keywords' => 'REST API, Laravel API, واجهات برمجة التطبيقات, API Development, Laravel',
                'learning_outcomes' => ['تصميم وبناء REST APIs متوافقة مع المعايير', 'تطبيق أنظمة المصادقة(Token-based)', 'توثيق APIs تلقائياً باستخدام OpenAPI', 'معالجة الأخطاء بشكل احترافي', 'تحسين أداء APIs', 'اختبار APIs بشكل شامل'],
                'requirements' => ['معرفة جيدة بـ Laravel', 'فهم أساسي لـ REST', 'معرفة بـ PHP'],
                'target_audience' => ['مطورو Laravel', 'مطورو الخلفية', 'المطورون الراغبون في بناء APIs احترافية'],
                'category_slugs' => ['web-development', 'php'],
            ],
            // ───────────────────────────────────────────
            // 3. PHP الحديثة للمحترفين
            // ───────────────────────────────────────────
            [
                'title' => 'PHP الحديثة للمحترفين',
                'slug' => 'modern-php-for-professionals',
                'subtitle' => 'استكشف ميزات PHP 8.x الجديدة وأفضل الممارسات',
                'short_description' => 'أتقن أحدث ميزات PHP 8 وطبق أفضل الممارسات في مشاريعك',
                'description' => 'دورة متقدمة في PHP الحديثة تغطي الميزات الجديدة، أنماط التصميم، والأداء.',
                'full_description' => 'هذه الدورة مخصصة للمطورين الذين يملكون خلفية في PHP ويريدون تطوير مهاراتهم. ستتعلم أحدث ميزات PHP 8 مثل Named Arguments، Attributes، Fibers، وستطبق أنماط التصميم المتقدمة مثل SOLID و Design Patterns.',
                'difficulty' => 'advanced',
                'language' => 'ar',
                'duration' => 40,
                'pricing_type' => 'paid',
                'price_amount' => 3499,
                'price_currency' => 'SAR',
                'discount_price' => 1999,
                'enrollment_limit' => 350,
                'certificate_enabled' => true,
                'featured' => false,
                'seo_title' => 'PHP 8 للمحترفين - دورة متقدمة في PHP الحديثة',
                'seo_description' => 'أتقن ميزات PHP 8 الجديدة: Named Arguments, Attributes, Fibers, Enums, وطبق مبادئ SOLID وأنماط التصميم.',
                'seo_keywords' => 'PHP 8, PHP للمحترفين, PHP الحديثة, SOLID, أنماط التصميم, PHP Advanced',
                'learning_outcomes' => ['استخدام ميزات PHP 8 الجديدة بكفاءة', 'تطبيق مبادئ SOLID في الأكواد', 'استخدام Attributes و Named Arguments', 'بناء تطبيقات باستخدام Fibers', 'تطبيق أنماط التصميم المتقدمة', 'تحسين أداء تطبيقات PHP'],
                'requirements' => ['خبرة سابقة في PHP (سنتين على الأقل)', 'فهم البرمجة الكائنية', 'معرفة بـ Composer'],
                'target_audience' => ['مطورو PHP المحترفون', 'المطورون الراغبون في تعلم PHP 8', 'مطورو Laravel الذين يريدون تعميق معرفتهم بـ PHP'],
                'category_slugs' => ['php', 'programming'],
            ],
            // ───────────────────────────────────────────
            // 4. React.js للمشاريع العملية
            // ───────────────────────────────────────────
            [
                'title' => 'React.js للمشاريع العملية',
                'slug' => 'reactjs-for-practical-projects',
                'subtitle' => 'بناء واجهات مستخدم تفاعلية بأحدث تقنيات React',
                'short_description' => 'تعلم بناء واجهات المستخدم بـ React مع مشاريع عملية واقعية',
                'description' => 'دورة شاملة في React.js من الأساسيات إلى بناء مشاريع متكاملة باستخدام Hooks و Context API.',
                'full_description' => 'ستتعلم في هذه الدورة بناء واجهات مستخدم تفاعلية باستخدام React.js. تغطي المكونات الوظيفية، Hooks، إدارة الحالة، التوجيه، التعامل مع APIs، واختبار المكونات. المشروع النهائي يتضمن بناء لوحة تحكم متكاملة.',
                'difficulty' => 'intermediate',
                'language' => 'ar',
                'duration' => 38,
                'pricing_type' => 'paid',
                'price_amount' => 4499,
                'price_currency' => 'SAR',
                'discount_price' => 2799,
                'enrollment_limit' => 450,
                'certificate_enabled' => true,
                'featured' => true,
                'seo_title' => 'دورة React.js الشاملة - تعلم بناء واجهات المستخدم الحديثة',
                'seo_description' => 'تعلم React.js من الأساسيات إلى المشاريع العملية. تغطي Components, Hooks, State Management, Routing, Testing.',
                'seo_keywords' => 'React.js, React, واجهات المستخدم, Frontend, JavaScript, تعلم React',
                'learning_outcomes' => ['بناء مكونات React وظيفية وتفاعلية', 'استخدام Hooks المتقدمة', 'إدارة الحالة باستخدام Context API و Redux', 'التوجيه باستخدام React Router', 'التعامل مع واجهات البرمجة', 'اختبار المكونات باستخدام Jest'],
                'requirements' => ['معرفة أساسية بـ JavaScript', 'فهم HTML و CSS', 'معرفة بـ ES6+'],
                'target_audience' => ['مطورو الواجهات الأمامية', 'المطورون الراغبون في تعلم React', 'طلاب تطوير الويب'],
                'category_slugs' => ['javascript', 'web-development'],
            ],
            // ───────────────────────────────────────────
            // 5. Next.js والتطبيقات الاحترافية
            // ───────────────────────────────────────────
            [
                'title' => 'Next.js والتطبيقات الاحترافية',
                'slug' => 'nextjs-professional-applications',
                'subtitle' => 'بناء تطبيقات ويب احترافية مع Server-Side Rendering',
                'short_description' => 'أتقن Next.js وابنِ تطبيقات ويب سريعة ومحسّنة لل��索 Engine',
                'description' => 'دورة متقدمة في Next.js تغطي SSR، SSG، API Routes، والنشر على منصات السحابة.',
                'full_description' => 'ستتعلم بناء تطبيقات ويب احترافية باستخدام Next.js. تغطي Server-Side Rendering، Static Site Generation، API Routes، Middleware، Authentication، والنشر على Vercel و Docker. المشروع النهائي هو بناء منصة SaaS متكاملة.',
                'difficulty' => 'advanced',
                'language' => 'ar',
                'duration' => 42,
                'pricing_type' => 'paid',
                'price_amount' => 4999,
                'price_currency' => 'SAR',
                'discount_price' => 3299,
                'enrollment_limit' => 300,
                'certificate_enabled' => true,
                'featured' => false,
                'seo_title' => 'Next.js للمحترفين - بناء تطبيقات ويب سريعة ومحسّنة',
                'seo_description' => 'تعلم Next.js من الأساسيات إلى الإنتاج. SSR, SSG, API Routes, Middleware, Authentication, Deployment.',
                'seo_keywords' => 'Next.js, React, SSR, SSG, Server-Side Rendering, تطبيقات ويب',
                'learning_outcomes' => ['بناء تطبيقات Next.js متكاملة', 'تطبيق SSR و SSG بشكل صحيح', 'بناء API Routes و Middleware', 'إضافة نظام مصادقة كامل', 'تحسين أداء التطبيقات', 'نشر التطبيقات على بيئة إنتاجية'],
                'requirements' => ['معرفة جيدة بـ React.js', 'فهم أساسيات JavaScript المتقدمة', 'معرفة بـ Node.js'],
                'target_audience' => ['مطرو React الراغبون في التقدم', 'مطورو الواجهات الأمامية المحترفون', 'المطورون الراغبون في بناء تطبيقات سريعة'],
                'category_slugs' => ['javascript', 'web-development'],
            ],
            // ───────────────────────────────────────────
            // 6. Docker وبيئات التشغيل
            // ───────────────────────────────────────────
            [
                'title' => 'Docker وبيئات التشغيل',
                'slug' => 'docker-and-containerization',
                'subtitle' => 'إتقان الحاويات ونشر التطبيقات بثقة',
                'short_description' => 'تعلم Docker من الأساسيات إلى النشر الإنتاجي مع Docker Compose',
                'description' => 'دورة شاملة في Docker تغطي الحاويات، Dockerfile، Docker Compose، ونشر التطبيقات.',
                'full_description' => 'ستتعلم في هذه الدورة إنشاء وإدارة حاويات Docker. تغطي كتابة Dockerfiles فعّالة، إدارة تطبيقات متعددة الحاويات باستخدام Docker Compose، إدارة الصور، والنشر على بيئات إنتاجية مع مراقبة الأداء.',
                'difficulty' => 'intermediate',
                'language' => 'ar',
                'duration' => 30,
                'pricing_type' => 'paid',
                'price_amount' => 3499,
                'price_currency' => 'SAR',
                'discount_price' => 2199,
                'enrollment_limit' => 400,
                'certificate_enabled' => true,
                'featured' => true,
                'seo_title' => 'دورة Docker الشاملة - تعلم الحاويات ونشر التطبيقات',
                'seo_description' => 'تعلم Docker من الصفر: الحاويات, Dockerfile, Docker Compose, الصور, السجلات, والنشر الإنتاجي.',
                'seo_keywords' => 'Docker, حاويات, Containerization, DevOps, Docker Compose, نشر التطبيقات',
                'learning_outcomes' => ['إنشاء وإدارة حاويات Docker', 'كتابة Dockerfiles فعّالة وآمنة', 'إدارة تطبيقات متعددة بـ Docker Compose', 'تحسين حجم الصور والأداء', 'نشر التطبيقات على بيئات إنتاجية', 'مراقبة الحاويات وحل المشكلات'],
                'requirements' => ['معرفة أساسية بسطر الأوامر', 'فهم لغة برمجة واحدة على الأقل', 'معرفة أساسية بشبكات الكمبيوتر'],
                'target_audience' => ['مطورو البرمجيات', 'مديرو العمليات (DevOps)', 'مديرو الأنظمة', 'طلاب تكنولوجيا المعلومات'],
                'category_slugs' => ['devops'],
            ],
            // ───────────────────────────────────────────
            // 7. Linux للمطورين
            // ───────────────────────────────────────────
            [
                'title' => 'Linux للمطورين',
                'slug' => 'linux-for-developers',
                'subtitle' => 'أتقن سطر الأوامر وأدوات Linux الأساسية للمطورين',
                'short_description' => 'تعلم أوامر Linux الأساسية وال Adminstration لإدارة الخوادم وتطوير البرمجيات',
                'description' => 'دورة عملية في Linux مصممة خصيصاً للمطورين، تغطي الأدوات الأساسية وإدارة النظام.',
                'full_description' => 'ستتعلم في هذه الدورة التعامل مع نظام Linux بكفاءة. تغطي أوامر سطر الأوامر الأساسية، إدارة العمليات والملفات، إدارة المستخدمين والصلاحيات، networking، كتابة السكربتات Bash، واستخدام Docker على Linux.',
                'difficulty' => 'beginner',
                'language' => 'ar',
                'duration' => 28,
                'pricing_type' => 'paid',
                'price_amount' => 2999,
                'price_currency' => 'SAR',
                'discount_price' => 1799,
                'enrollment_limit' => 500,
                'certificate_enabled' => true,
                'featured' => false,
                'seo_title' => 'Linux للمطورين - دورة شاملة في سطر الأوامر وإدارة النظام',
                'seo_description' => 'تعلم Linux من الصفر: سطر الأوامر, إدارة العمليات, networking, Bash Scripting, Docker على Linux.',
                'seo_keywords' => 'Linux, سطر الأوامر, Bash, Linux Administration, DevOps, إدارة الخوادم',
                'learning_outcomes' => ['الإجادة في استخدام أوامر Linux الأساسية', 'إدارة العمليات والملفات والخدمات', 'فهم إدارة المستخدمين والصلاحيات', 'استخدام أدوات الشبكات', 'كتابة سكربتات Bash', 'تثبيت وإدارة Docker على Linux'],
                'requirements' => ['جهاز كمبيوتر (Windows أو Mac أو Linux)', 'الرغبة في تعلم سطر الأوامر', 'معرفة أساسية بالحاسوب'],
                'target_audience' => ['المطورون الجدد في Linux', 'مطورو البرمجيات الذين يريدون تعلم Linux', 'طلاب تكنولوجيا المعلومات', 'مديرو الأنظمة المبتدئون'],
                'category_slugs' => ['linux-systems', 'devops'],
            ],
            // ───────────────────────────────────────────
            // 8. اختبار البرمجيات الاحترافي
            // ───────────────────────────────────────────
            [
                'title' => 'اختبار البرمجيات الاحترافي',
                'slug' => 'professional-software-testing',
                'subtitle' => 'من اختبار الوحدات إلى الاختبارات الأوتوماتيكية الشاملة',
                'short_description' => 'تعلم اختبار البرمجيات بشكل احترافي مع PHPUnit و Jest و Cypress',
                'description' => 'دورة شاملة في اختبار البرمجيات تغطي Unit Testing، Integration Testing، E2E Testing، و CI/CD.',
                'full_description' => 'ستتعلم في هذه الدورة بناء اختبارات برمجيات احترافية. تغطي اختبار الوحدات باستخدام PHPUnit، اختبار HTTP في Laravel، اختبار الواجهات الأمامية باستخدام Jest و React Testing Library، واختبارات End-to-End باستخدام Cypress.',
                'difficulty' => 'intermediate',
                'language' => 'ar',
                'duration' => 32,
                'pricing_type' => 'paid',
                'price_amount' => 3999,
                'price_currency' => 'SAR',
                'discount_price' => 2499,
                'enrollment_limit' => 350,
                'certificate_enabled' => true,
                'featured' => false,
                'seo_title' => 'دورة اختبار البرمجيات الشاملة - Unit, Integration, E2E Testing',
                'seo_description' => 'تعلم اختبار البرمجيات احترافياً: PHPUnit, Laravel Testing, Jest, React Testing Library, Cypress, CI/CD.',
                'seo_keywords' => 'اختبار البرمجيات, Testing, PHPUnit, Jest, Cypress, TDD, ضمان الجودة',
                'learning_outcomes' => ['كتابة اختبارات وحدات فعّالة', 'اختبار تطبيقات Laravel بشكل شامل', 'اختبار مكونات React باستخدام Testing Library', 'بناء اختبارات End-to-End باستخدام Cypress', 'تطبيق TDD في المشاريع', 'دمج الاختبارات في CI/CD'],
                'requirements' => ['خبرة في تطوير البرمجيات', 'معرفة بـ PHP و Laravel (لاختبارات الخلفية)', 'معرفة بـ JavaScript و React (لاختبارات الواجهة)'],
                'target_audience' => ['مطورو البرمجيات الراغبون في تعلم الاختبار', 'مختبرو البرمجيات المحترفون', 'DevOps Engineers', 'قادة فرق التطوير'],
                'category_slugs' => ['quality-assurance', 'software-engineering'],
            ],
            // ───────────────────────────────────────────
            // 9. هندسة البرمجيات و Clean Architecture
            // ───────────────────────────────────────────
            [
                'title' => 'هندسة البرمجيات و Clean Architecture',
                'slug' => 'software-engineering-clean-architecture',
                'subtitle' => 'ابنِ أنظمة برمجية قابلة للصيانة والتوسع',
                'short_description' => 'تعلم مبادئ هندسة البرمجيات والعمارة النظيفة لبناء أنظمة موثوقة',
                'description' => 'دورة متقدمة في هندسة البرمجيات تغطي مبادئ SOLID، أنماط التصميم، والعمارة النظيفة.',
                'full_description' => 'ستتعلم في هذه الدورة مبادئ هندسة البرمجيات الحديثة. تغطي مبادئ SOLID، Domain-Driven Design، Clean Architecture، أنماط التصميم، بناء APIs باستخدام REST و GraphQL، وتصميم قواعد البيانات بشكل فعّال.',
                'difficulty' => 'advanced',
                'language' => 'ar',
                'duration' => 36,
                'pricing_type' => 'paid',
                'price_amount' => 4499,
                'price_currency' => 'SAR',
                'discount_price' => 2999,
                'enrollment_limit' => 300,
                'certificate_enabled' => true,
                'featured' => true,
                'seo_title' => 'هندسة البرمجيات و Clean Architecture - دورة متقدمة',
                'seo_description' => 'تعلم SOLID, Design Patterns, Clean Architecture, DDD, REST API, GraphQL, Database Design.',
                'seo_keywords' => 'هندسة البرمجيات, Clean Architecture, SOLID, Design Patterns, DDD, Software Engineering',
                'learning_outcomes' => ['تطبيق مبادئ SOLID بشكل صحيح', 'بناء أنظمة باستخدام Clean Architecture', 'تطبيق أنماط التصميم الشائعة', 'تصميم APIs باستخدام REST و GraphQL', 'تصميم قواعد بيانات فعّالة', 'بناء تطبيقات قابلة للصيانة والتوسع'],
                'requirements' => ['خبرة في تطوير البرمجيات (3 سنوات على الأقل)', 'فهم عميق للبرمجة الكائنية', 'معرفة بأنماط التصميم الأساسية'],
                'target_audience' => ['مهندسو البرمجيات', 'مطورو Backend المحترفون', 'قادة فرق التطوير', 'المطورون الراغبون في الترقى لهندسة البرمجيات'],
                'category_slugs' => ['software-engineering', 'clean-architecture'],
            ],
            // ───────────────────────────────────────────
            // 10. تصميم الأنظمة الموزعة
            // ───────────────────────────────────────────
            [
                'title' => 'تصميم الأنظمة الموزعة',
                'slug' => 'distributed-systems-design',
                'subtitle' => 'بناء أنظمة قابلة للتوسع والموثوقية على مستوى الإنتاج',
                'short_description' => 'تعلم تصميم وبناء الأنظمة الموزعة القابلة للتوسع مع Microservices',
                'description' => 'دورة متقدمة في تصميم الأنظمة الموزعة تغطي CAP Theorem، التكرار، التقسيم، Load Balancing، والمزيد.',
                'full_description' => 'ستتعلم في هذه الدورة تصميم وبناء أنظمة موزعة قابلة للتوسع. تغطي مفاهيم أساسية مثل CAP Theorem، أنماط التكرار والتقسيم، Load Balancing، التخزين المؤقت الموزع، قواعد الرسائل، وبناء_microservices باستخدام Docker و Kubernetes.',
                'difficulty' => 'advanced',
                'language' => 'ar',
                'duration' => 40,
                'pricing_type' => 'paid',
                'price_amount' => 5499,
                'price_currency' => 'SAR',
                'discount_price' => 3699,
                'enrollment_limit' => 250,
                'certificate_enabled' => true,
                'featured' => true,
                'seo_title' => 'تصميم الأنظمة الموزعة - بناء أنظمة قابلة للتوسع',
                'seo_description' => 'تعلم تصميم الأنظمة الموزعة: CAP Theorem, Replication, Sharding, Load Balancing, Caching, Message Queues.',
                'seo_keywords' => 'أنظمة موزعة, Distributed Systems, Microservices, System Design, Scalability, CAP Theorem',
                'learning_outcomes' => ['فهم مفاهيم الأنظمة الموزعة الأساسية', 'تطبيق CAP Theorem بشكل عملي', 'تصميم أنماط التكرار والتقسيم', 'بناء أنظمة Load Balancing فعّالة', 'استخدام التخزين المؤقت الموزع', 'بناء microservices باستخدام Docker و Kubernetes', 'مراقبة وصيانة الأنظمة الموزعة'],
                'requirements' => ['خبرة في تطوير البرمجيات (3-5 سنوات)', 'فهم قوي لقواعد البيانات', 'معرفة بالشبكات الأساسية', 'فهم أساسيات Docker و Linux'],
                'target_audience' => ['مهندسو البرمجيات', 'مطورو Backend المحترفون', 'مهندسو DevOps', 'المطورون الراغبون في التخصص في تصميم الأنظمة', 'قادة فرق التطوير'],
                'category_slugs' => ['system-design', 'software-engineering'],
            ],
        ];
    }

    private function seedSingleCourse(array $data): void
    {
        $existing = Course::where('tenant_id', $this->tenant->id)
            ->where('slug', $data['slug'])
            ->first();
        if ($existing) {
            $this->coursesSkipped++;
            $this->seedModulesForCourse($existing, $data['modules']);
            return;
        }

        $courseService = app(CourseService::class);
        $course = $courseService->create($this->tenant, $this->creator, [
            'title' => $data['title'],
            'slug' => $data['slug'],
            'subtitle' => $data['subtitle'],
            'short_description' => $data['short_description'],
            'description' => $data['description'],
            'full_description' => $data['full_description'],
            'difficulty' => $data['difficulty'],
            'language' => $data['language'],
            'duration' => $data['duration'],
            'visibility' => 'public',
            'pricing_type' => $data['pricing_type'],
            'price_amount' => $data['price_amount'],
            'price_currency' => $data['price_currency'],
            'discount_price' => $data['discount_price'],
            'enrollment_limit' => $data['enrollment_limit'],
            'certificate_enabled' => $data['certificate_enabled'],
            'featured' => $data['featured'],
            'seo_title' => $data['seo_title'],
            'seo_description' => $data['seo_description'],
            'seo_keywords' => $data['seo_keywords'],
            'requirements' => $data['requirements'],
            'learning_outcomes' => $data['learning_outcomes'],
            'target_audience' => $data['target_audience'],
        ]);

        $course->forceFill([
            'status' => 'published',
            'published_at' => now(),
        ])->save();

        $categoryIds = Category::where('tenant_id', $this->tenant->id)
            ->whereIn('slug', $data['category_slugs'])
            ->pluck('id')
            ->all();
        if ($categoryIds) {
            $course->categories()->sync(
                collect($categoryIds)->mapWithKeys(fn (int $id) => [$id => ['tenant_id' => $this->tenant->id]])->all()
            );
        }

        $this->coursesCreated++;
        $this->seedModulesForCourse($course, $data['modules']);
    }

    // ═══════════════════════════════════════════════════
    // MODULES
    // ═══════════════════════════════════════════════════

    private function seedModulesForCourse(Course $course, array $modules): void
    {
        foreach ($modules as $moduleIndex => $moduleData) {
            $slug = Str::slug($moduleData['title']);
            $existing = CourseModule::where('tenant_id', $this->tenant->id)
                ->where('course_id', $course->id)
                ->where('slug', $slug)
                ->first();

            if ($existing) {
                $this->modulesSkipped++;
                $this->seedSectionsForModule($course, $existing, $moduleData['sections']);
                continue;
            }

            $module = CourseModule::create([
                'tenant_id' => $this->tenant->id,
                'course_id' => $course->id,
                'title' => $moduleData['title'],
                'slug' => $slug,
                'description' => $moduleData['description'] ?? null,
                'order' => $moduleIndex + 1,
                'status' => 'published',
                'is_published' => true,
                'featured' => false,
                'estimated_duration' => $moduleData['estimated_duration'] ?? null,
                'published_at' => now(),
            ]);
            $this->modulesCreated++;
            $this->seedSectionsForModule($course, $module, $moduleData['sections']);
        }
    }

    // ═══════════════════════════════════════════════════
    // SECTIONS
    // ═══════════════════════════════════════════════════

    private function seedSectionsForModule(Course $course, CourseModule $module, array $sections): void
    {
        foreach ($sections as $sectionIndex => $sectionData) {
            $slug = Str::slug($sectionData['title']);
            $existing = CourseSection::where('tenant_id', $this->tenant->id)
                ->where('course_id', $course->id)
                ->where('slug', $slug)
                ->first();

            if ($existing) {
                $this->sectionsSkipped++;
                $this->seedLessonsForSection($course, $existing, $sectionData['lessons']);
                continue;
            }

            $section = CourseSection::create([
                'tenant_id' => $this->tenant->id,
                'course_id' => $course->id,
                'course_module_id' => $module->id,
                'title' => $sectionData['title'],
                'slug' => $slug,
                'description' => $sectionData['description'] ?? null,
                'sort_order' => $sectionIndex + 1,
                'duration_minutes' => $sectionData['duration_minutes'] ?? null,
                'free_preview' => $sectionIndex === 0 && $module->order === 1,
                'status' => 'published',
                'is_published' => true,
                'locked' => false,
                'featured' => false,
            ]);
            $this->sectionsCreated++;
            $this->seedLessonsForSection($course, $section, $sectionData['lessons']);
        }
    }

    // ═══════════════════════════════════════════════════
    // LESSONS
    // ═══════════════════════════════════════════════════

    private function seedLessonsForSection(Course $course, CourseSection $section, array $lessons): void
    {
        foreach ($lessons as $lessonIndex => $lessonData) {
            $slug = Str::slug($lessonData['title']);
            $existing = CourseLesson::where('tenant_id', $this->tenant->id)
                ->where('course_id', $course->id)
                ->where('course_section_id', $section->id)
                ->where('slug', $slug)
                ->first();

            if ($existing) {
                $this->lessonsSkipped++;
                continue;
            }

            CourseLesson::create([
                'tenant_id' => $this->tenant->id,
                'course_id' => $course->id,
                'course_section_id' => $section->id,
                'title' => $lessonData['title'],
                'slug' => $slug,
                'short_description' => $lessonData['short_description'] ?? null,
                'description' => $lessonData['description'] ?? null,
                'type' => 'video',
                'lesson_type' => 'video',
                'status' => 'published',
                'visibility' => 'public',
                'sort_order' => $lessonIndex + 1,
                'duration_seconds' => $lessonData['duration_seconds'] ?? null,
                'estimated_duration' => $lessonData['estimated_duration'] ?? null,
                'free_preview' => $section->free_preview,
                'downloadable' => false,
                'featured' => false,
                'comments_enabled' => true,
                'published_at' => now(),
            ]);
            $this->lessonsCreated++;
        }
    }

    // ═══════════════════════════════════════════════════
    // MODULE DEFINITIONS
    // ═══════════════════════════════════════════════════

    private function modules(): array
    {
        return [
            // 1. Laravel من الصفر إلى الاحتراف
            'laravel-from-scratch-to-mastery' => [
                ['title' => 'مقدمة في Laravel و بنية MVC', 'sections' => [
                    ['title' => 'ما هو Laravel و لماذا نستخدمه', 'lessons' => [['title' => 'نظرة عامة على إطار عمل Laravel']]],
                    ['title' => 'تهيئة بيئة التطوير و إنشاء أول مشروع', 'lessons' => [['title' => 'تثبيت Laravel و إعداد بيئة العمل']]],
                ]],
                ['title' => 'المسارات والموجهات', 'sections' => [
                    ['title' => 'تعريف المسارات و الموجهات', 'lessons' => [['title' => 'بناء المسارات والموجهات في Laravel']]],
                    ['title' => 'التحقق من المدخلات و معالجة الطلبات', 'lessons' => [['title' => 'معالجة الطلبات والتحقق من البيانات']]],
                ]],
                ['title' => 'المصادقة و التفويض', 'sections' => [
                    ['title' => 'نظام تسجيل الدخول و الخروج', 'lessons' => [['title' => 'بناء نظام المصادقة الكامل']]],
                    ['title' => 'تفويض المستخدمين بالأدوار والصلاحيات', 'lessons' => [['title' => 'إدارة الأدوار والصلاحيات']]],
                ]],
                ['title' => 'إدارة قواعد البيانات', 'sections' => [
                    ['title' => 'الهجرات و Eloquent ORM', 'lessons' => [['title' => 'إنشاء الهجرات والعلاقات']]],
                    ['title' => 'العلاقات و محركات البحث', 'lessons' => [['title' => 'بناء العلاقات والبحث في البيانات']]],
                ]],
                ['title' => 'بناء تطبيق API كامل', 'sections' => [
                    ['title' => 'تصميم API و موارد JSON', 'lessons' => [['title' => 'بناء REST API متكامل']]],
                    ['title' => 'النشر و الإعدادات النهائية', 'lessons' => [['title' => 'نشر و تطبيق Laravel على الإنتاج']]],
                ]],
            ],

            // 2. تطوير REST APIs باستخدام Laravel
            'rest-api-development-with-laravel' => [
                ['title' => 'مبادئ REST APIs', 'sections' => [
                    ['title' => 'أساسيات REST و مبادئ تصميم APIs', 'lessons' => [['title' => 'فهم مبادئ REST و أنواع الطلبات']]],
                    ['title' => 'تصميم هيكل المشروع لـ API', 'lessons' => [['title' => 'هيكلة مشروع Laravel للـ APIs']]],
                ]],
                ['title' => 'بناء نقاط النهاية', 'sections' => [
                    ['title' => 'إنشاء Controllers و Routes', 'lessons' => [['title' => 'بناء Controllers و Routes للـ API']]],
                    ['title' => 'التحقق من المدخلات باستخدام Form Requests', 'lessons' => [['title' => 'تطبيق التحقق من المدخلات']]],
                ]],
                ['title' => 'أنظمة المصادقة', 'sections' => [
                    ['title' => 'Sanctum و Personal Access Tokens', 'lessons' => [['title' => 'إعداد مصادقة Token-based']]],
                    ['title' => 'نظام الصلاحيات والأدوار في الـ API', 'lessons' => [['title' => 'تطبيق RBAC في واجهات البرمجة']]],
                ]],
                ['title' => 'التوثيق والأخطاء', 'sections' => [
                    ['title' => 'توثيق API باستخدام OpenAPI و Swagger', 'lessons' => [['title' => 'توثيق الـ API تلقائياً']]],
                    ['title' => 'معالجة الأخطاء والاستثناءات', 'lessons' => [['title' => 'بناء نظام أخطاء متكامل']]],
                ]],
                ['title' => 'تحسين الأداء واختبار APIs', 'sections' => [
                    ['title' => 'الصفحات و التخزين المؤقت', 'lessons' => [['title' => 'تحسين أداء واجهات البرمجة']]],
                    ['title' => 'اختبار APIs باستخدام HTTP Tests', 'lessons' => [['title' => 'اختبار الـ API بشكل شامل']]],
                ]],
            ],

            // 3. PHP الحديثة للمحترفين
            'modern-php-for-professionals' => [
                ['title' => 'ميزات PHP 8 الجديدة', 'sections' => [
                    ['title' => 'Named Arguments و Attributes', 'lessons' => [['title' => 'استخدام Named Arguments و Attributes']]],
                    ['title' => 'Union Types و Match Expression', 'lessons' => [['title' => 'تطبيق Union Types و Match']]],
                ]],
                ['title' => 'البرمجة الكائنية المتقدمة', 'sections' => [
                    ['title' => 'Fibers و Enums في PHP 8', 'lessons' => [['title' => 'بناء تطبيقات باستخدام Fibers و Enums']]],
                    ['title' => 'Constructor Promotion و Readonly Properties', 'lessons' => [['title' => 'استخدام Constructor Promotion']]],
                ]],
                ['title' => 'مبادئ SOLID', 'sections' => [
                    ['title' => 'شرح و تطبيق مبادئ SOLID', 'lessons' => [['title' => 'تطبيق مبادئ SOLID في PHP']]],
                    ['title' => 'تطبيق LSP و ISP و DIP', 'lessons' => [['title' => 'تطبيق مبادئ LSP و ISP و DIP']]],
                ]],
                ['title' => 'أنماط التصميم', 'sections' => [
                    ['title' => 'أنماط التصميم الإنشائية', 'lessons' => [['title' => 'تطبيق Factory و Builder و Singleton']]],
                    ['title' => 'أنماط التصميم الهيكلية والسلوكية', 'lessons' => [['title' => 'تطبيق Strategy و Observer']]],
                ]],
                ['title' => 'تحسين الأداء و الأفضل', 'sections' => [
                    ['title' => 'تحسين الأداء و Profiling', 'lessons' => [['title' => 'تحسين أداء تطبيقات PHP']]],
                    ['title' => 'المشروع النهائي و أفضل الممارسات', 'lessons' => [['title' => 'بناء مشروع PHP متكامل']]],
                ]],
            ],

            // 4. React.js للمشاريع العملية
            'reactjs-for-practical-projects' => [
                ['title' => 'أساسيات React', 'sections' => [
                    ['title' => 'ما هو React و بنية المكونات', 'lessons' => [['title' => 'فهم مفاهيم React الأساسية']]],
                    ['title' => 'إعداد بيئة التطوير مع Vite', 'lessons' => [['title' => 'تثبيت و إعداد مشروع React']]],
                ]],
                ['title' => 'JSX و المكونات', 'sections' => [
                    ['title' => 'كتابة JSX و إنشاء المكونات', 'lessons' => [['title' => 'بناء المكونات الوظيفية']]],
                    ['title' => 'الخصائص و الحالة والأحداث', 'lessons' => [['title' => 'إدارة Props و State و Events']]],
                ]],
                ['title' => 'Hooks المتقدمة', 'sections' => [
                    ['title' => 'useEffect و副作用 و التنظيف', 'lessons' => [['title' => 'استخدام useEffect لل副作用']]],
                    ['title' => 'بناء Custom Hooks', 'lessons' => [['title' => 'إعادة استخدام المنطق بـ Custom Hooks']]],
                ]],
                ['title' => 'Composition و إعادة الاستخدام', 'sections' => [
                    ['title' => 'Props Drilling و Context API', 'lessons' => [['title' => 'فهم Props Drilling و Context API']]],
                    ['title' => 'أنماط Composition المتقدمة', 'lessons' => [['title' => 'تطبيق أنماط Composition']]],
                ]],
                ['title' => 'إدارة الحالة و المشروع النهائي', 'sections' => [
                    ['title' => 'Context API و Redux Basics', 'lessons' => [['title' => 'تطبيق Redux لإدارة الحالة']]],
                    ['title' => 'المشروع النهائي: لوحة تحكم متكاملة', 'lessons' => [['title' => 'بناء مشروع لوحة تحكم']]],
                ]],
            ],

            // 5. Next.js والتطبيقات الاحترافية
            'nextjs-professional-applications' => [
                ['title' => 'أساسيات Next.js', 'sections' => [
                    ['title' => 'SSR و SSG و ISR', 'lessons' => [['title' => 'فهم أنماط العرض في Next.js']]],
                    ['title' => 'الملفات و التوجيه في Next.js', 'lessons' => [['title' => 'تثبيت وإعداد مشروع Next.js']]],
                ]],
                ['title' => 'التوجيه المتقدم', 'sections' => [
                    ['title' => 'المسارات الديناميكية و layouts', 'lessons' => [['title' => 'بناء layouts و مسارات ديناميكية']]],
                    ['title' => 'API Routes و Middleware', 'lessons' => [['title' => 'بناء API Routes و Middleware']]],
                ]],
                ['title' => 'جلب البيانات', 'sections' => [
                    ['title' => 'getServerSideProps و getStaticProps', 'lessons' => [['title' => 'جلب البيانات في Next.js']]],
                    ['title' => 'SWR و React Query', 'lessons' => [['title' => 'إدارة البيانات في الواجهة الأمامية']]],
                ]],
                ['title' => 'المصادقة و النشر', 'sections' => [
                    ['title' => 'NextAuth.js و JWT', 'lessons' => [['title' => 'إضافة نظام مصادقة كامل']]],
                    ['title' => 'النشر على Vercel و Docker', 'lessons' => [['title' => 'نشر تطبيق Next.js']]],
                ]],
                ['title' => 'المشروع النهائي', 'sections' => [
                    ['title' => 'بناء منصة SaaS كاملة', 'lessons' => [['title' => 'بناء مشروع SaaS متكامل']]],
                    ['title' => 'اختبار و تحسين الأداء', 'lessons' => [['title' => 'تحسين أداء و اختبار المشروع']]],
                ]],
            ],

            // 6. Docker وبيئات التشغيل
            'docker-and-containerization' => [
                ['title' => 'أساسيات الحاويات', 'sections' => [
                    ['title' => 'ما هي الحاويات و الفرق بينها و بين الآلات الافتراضية', 'lessons' => [['title' => 'فهم مفهوم الحاويات']]],
                    ['title' => 'أوامر Docker الأساسية', 'lessons' => [['title' => 'تثبيت Docker و أول خطوات']]],
                ]],
                ['title' => 'Dockerfile و بناء الصور', 'sections' => [
                    ['title' => 'كتابة Dockerfile', 'lessons' => [['title' => 'بناء صور Docker']]],
                    ['title' => 'تحسين و أمان الصور', 'lessons' => [['title' => 'تحسين Dockerfile للأمان والأداء']]],
                ]],
                ['title' => 'Docker Compose', 'sections' => [
                    ['title' => 'إدارة تطبيقات متعددة الحاويات', 'lessons' => [['title' => 'إعداد Docker Compose']]],
                    ['title' => 'الشبكات و الأحجام', 'lessons' => [['title' => 'إدارة الشبكات والأحجام']]],
                ]],
                ['title' => 'إدارة الصور و السجلات', 'sections' => [
                    ['title' => 'تصدير و استيراد الصور', 'lessons' => [['title' => 'إدارة صور Docker']]],
                    ['title' => 'Docker Hub و السجلات الخاصة', 'lessons' => [['title' => 'نشر الصور على Docker Hub']]],
                ]],
                ['title' => 'النشر و المراقبة', 'sections' => [
                    ['title' => 'إعدادات الإنتاج', 'lessons' => [['title' => 'نشر Docker على بيئة إنتاجية']]],
                    ['title' => 'مراقبة و حل المشكلات', 'lessons' => [['title' => 'مراقبة حاويات Docker']]],
                ]],
            ],

            // 7. Linux للمطورين
            'linux-for-developers' => [
                ['title' => 'أساسيات سطر الأوامر', 'sections' => [
                    ['title' => 'التنقل في نظام الملفات', 'lessons' => [['title' => 'أوامر التنقل و عرض الملفات']]],
                    ['title' => 'إدارة الملفات و المجلدات', 'lessons' => [['title' => 'أوامر إنشاء و نسخ و حذف الملفات']]],
                ]],
                ['title' => 'إدارة العمليات و النظام', 'sections' => [
                    ['title' => 'إدارة العمليات و المهام', 'lessons' => [['title' => 'مراقبة وإدارة العمليات']]],
                    ['title' => 'خدمات systemd و systemctl', 'lessons' => [['title' => 'إدارة خدمات Linux']]],
                ]],
                ['title' => 'الشبكات و استكشاف الأخطاء', 'sections' => [
                    ['title' => 'أوامر الشبكات الأساسية', 'lessons' => [['title' => 'أدوات diagnostics في الشبكات']]],
                    ['title' => 'استكشاف أخطاء الشبكة', 'lessons' => [['title' => 'حل مشكلات الشبكة']]],
                ]],
                ['title' => 'المستخدمين و الصلاحيات', 'sections' => [
                    ['title' => 'إدارة المستخدمين والمجموعات', 'lessons' => [['title' => 'إدارة المستخدمين في Linux']]],
                    ['title' => 'نظام الصلاحيات و ACLs', 'lessons' => [['title' => 'تطبيق الصلاحيات بشكل صحيح']]],
                ]],
                ['title' => 'Scripting و Docker على Linux', 'sections' => [
                    ['title' => 'أساسيات Bash Scripting', 'lessons' => [['title' => 'كتابة سكربتات Bash']]],
                    ['title' => 'تثبيت و إدارة Docker على Linux', 'lessons' => [['title' => 'إعداد Docker على Linux']]],
                ]],
            ],

            // 8. اختبار البرمجيات الاحترافي
            'professional-software-testing' => [
                ['title' => 'مبادئ اختبار البرمجيات', 'sections' => [
                    ['title' => 'لماذا نختبر البرمجيات', 'lessons' => [['title' => 'أهمية و أنواع الاختبارات']]],
                    ['title' => 'مبادئ TDD و BDD', 'lessons' => [['title' => 'تطبيق TDD و BDD']]],
                ]],
                ['title' => 'Unit Testing مع PHPUnit', 'sections' => [
                    ['title' => 'كتابة اختبارات الوحدات', 'lessons' => [['title' => 'كتابة اختبارات Unit']]],
                    ['title' => 'Mocking و Data Providers', 'lessons' => [['title' => 'تطبيق Mocking في الاختبارات']]],
                ]],
                ['title' => 'Laravel Testing', 'sections' => [
                    ['title' => 'اختبار HTTP و Models', 'lessons' => [['title' => 'اختبار HTTP و Models']]],
                    ['title' => 'Database Testing و Factories', 'lessons' => [['title' => 'اختبار قاعدة البيانات']]],
                ]],
                ['title' => 'Frontend Testing', 'sections' => [
                    ['title' => 'Jest و React Testing Library', 'lessons' => [['title' => 'اختبار مكونات React']]],
                    ['title' => 'اختبار Hooks و Events', 'lessons' => [['title' => 'اختبار Hooks والأحداث']]],
                ]],
                ['title' => 'E2E Testing و CI/CD', 'sections' => [
                    ['title' => 'Cypress و Page Objects', 'lessons' => [['title' => 'بناء اختبارات End-to-End']]],
                    ['title' => 'CI/CD مع GitHub Actions', 'lessons' => [['title' => 'دمج الاختبارات في CI/CD']]],
                ]],
            ],

            // 9. هندسة البرمجيات و Clean Architecture
            'software-engineering-clean-architecture' => [
                ['title' => 'مبادئ هندسة البرمجيات', 'sections' => [
                    ['title' => 'لماذا نحتاج للعمارة النظيفة', 'lessons' => [['title' => 'أهمية العمارة النظيفة']]],
                    ['title' => 'مبادئ SOLID و DRY و KISS', 'lessons' => [['title' => 'تطبيق مبادئ SOLID']]],
                ]],
                ['title' => 'فصل الطبقات', 'sections' => [
                    ['title' => 'طبقات Domain و Application و Infrastructure', 'lessons' => [['title' => 'فصل مخاوف الطبقات']]],
                    ['title' => 'العلاقات بين الطبقات و الاعتماديات', 'lessons' => [['title' => 'إدارة الاعتماديات']]],
                ]],
                ['title' => 'نمط Domain-Driven Design', 'sections' => [
                    ['title' => 'الكيانات و قيم الأسماء و المجاميع', 'lessons' => [['title' => 'بناء طبقة Domain']]],
                    ['title' => 'Adapters و Ports في Hexagonal Architecture', 'lessons' => [['title' => 'تطبيق Hexagonal Architecture']]],
                ]],
                ['title' => 'REST و GraphQL', 'sections' => [
                    ['title' => 'تصميم REST API احترافي', 'lessons' => [['title' => 'بناء REST API متوافق']]],
                    ['title' => 'GraphQL و Schema Design', 'lessons' => [['title' => 'بناء واجهة GraphQL']]],
                ]],
                ['title' => 'قاعدة البيانات و المشروع النهائي', 'sections' => [
                    ['title' => 'تصميم قاعدة البيانات و التحسين', 'lessons' => [['title' => 'تصميم و تحسين قاعدة البيانات']]],
                    ['title' => 'المشروع النهائي: تطبيق SaaS كامل', 'lessons' => [['title' => 'بناء مشروع SaaS متكامل']]],
                ]],
            ],

            // 10. تصميم الأنظمة الموزعة
            'distributed-systems-design' => [
                ['title' => 'أساسيات الأنظمة الموزعة', 'sections' => [
                    ['title' => 'ما هي الأنظمة الموزعة و لماذا نحتاجها', 'lessons' => [['title' => 'فهم أنظمة التوسع']]],
                    ['title' => 'التحديات الأساسية و Failures', 'lessons' => [['title' => 'التحديات في الأنظمة الموزعة']]],
                ]],
                ['title' => 'CAP Theorem', 'sections' => [
                    ['title' => 'Consistency و Availability و Partition Tolerance', 'lessons' => [['title' => 'تطبيق CAP Theorem']]],
                    ['title' => 'النماذج المختلفة و trade-offs', 'lessons' => [['title' => 'فهم trade-offs في CAP']]],
                ]],
                ['title' => 'Replication', 'sections' => [
                    ['title' => 'Leader-Follower و Multi-Leader', 'lessons' => [['title' => 'تطبيق التكرار']]],
                    ['title' => 'التعامل مع التعارضات و Zonal Replication', 'lessons' => [['title' => 'حل تعارضات التكرار']]],
                ]],
                ['title' => 'Partitioning و Sharding', 'sections' => [
                    ['title' => 'Partitioning و Sharding Strategies', 'lessons' => [['title' => 'تطبيق التقسيم']]],
                    ['title' => 'Consistent Hashing و تجربة عملية', 'lessons' => [['title' => 'بناء نظام Sharding']]],
                ]],
                ['title' => 'Load Balancing و Caching و Queues', 'sections' => [
                    ['title' => 'Load Balancing و Distributed Caching', 'lessons' => [['title' => 'بناء نظام Load Balancing']]],
                    ['title' => 'Message Queues و Project', 'lessons' => [['title' => 'بناء نظام Distributed']]],
                ]],
            ],
        ];
    }
}
