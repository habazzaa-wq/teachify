<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\QuestionCategory;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExamBankSeeder extends Seeder
{
    private Tenant $tenant;
    private TenantUser $creator;
    private int $categoriesCreated = 0;
    private int $banksCreated = 0;
    private int $examsCreated = 0;
    private int $questionsCreated = 0;

    public function run(): void
    {
        $startTime = microtime(true);
        $domain = TenantDomain::where('domain', 'hazem.academy.test')->where('status', 'active')->first();
        $this->tenant = $domain?->tenant ?? Tenant::firstOrFail();
        $this->creator = TenantUser::where('tenant_id', $this->tenant->id)->firstOrFail();
        app()->instance(Tenant::class, $this->tenant);
        app()->instance('currentTenant', $this->tenant);
        app()->instance('currentTenantMembership', $this->creator);

        DB::transaction(function (): void {
            $categories = $this->createCategories();
            $this->createAllExams($categories);
        });

        $elapsed = round(microtime(true) - $startTime, 2);
        $avg = $this->examsCreated > 0 ? round($this->questionsCreated / $this->examsCreated, 1) : 0;
        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('  Exam Bank Seeder - Summary');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info("  Categories Created   : {$this->categoriesCreated}");
        $this->command->info("  Banks Created        : {$this->banksCreated}");
        $this->command->info("  Exams Created        : {$this->examsCreated}");
        $this->command->info("  Questions Created    : {$this->questionsCreated}");
        $this->command->info("  Avg Questions/Exam   : {$avg}");
        $this->command->info("  Execution Time       : {$elapsed}s");
        $this->command->info('═══════════════════════════════════════════');
    }

    private function createCategories(): array
    {
        $definitions = [
            ['name' => 'Laravel', 'description' => 'إطار عمل PHP المفتوح المصدر لبناء تطبيقات الويب', 'color' => '#FF2D20', 'icon' => 'laravel'],
            ['name' => 'PHP', 'description' => 'لغة برمجة خادم متعددة الأغراض تُستخدم بشكل واسع في تطوير الويب', 'color' => '#777BB4', 'icon' => 'php'],
            ['name' => 'React', 'description' => 'مكتبة JavaScript لبناء واجهات المستخدم التفاعلية', 'color' => '#61DAFB', 'icon' => 'react'],
            ['name' => 'Next.js', 'description' => 'إطار عمل React لبناء تطبيقات الويب المحسّنة', 'color' => '#000000', 'icon' => 'nextjs'],
            ['name' => 'Docker', 'description' => 'منصة حاويات لتطوير ونشر التطبيقات', 'color' => '#2496ED', 'icon' => 'docker'],
            ['name' => 'Linux', 'description' => 'نظام تشغيل مفتوح المصدر للخوادم وأجهزة الكمبيوتر', 'color' => '#FCC624', 'icon' => 'linux'],
            ['name' => 'REST APIs', 'description' => 'واجهات برمجة التطبيقات المعمارية المستندية', 'color' => '#009688', 'icon' => 'api'],
            ['name' => 'قواعد البيانات', 'description' => 'أنظمة إدارة البيانات العلائقية وغير العلائقية', 'color' => '#336791', 'icon' => 'database'],
            ['name' => 'Git', 'description' => 'نظام التحكم في الإصدارات الموزع', 'color' => '#F05032', 'icon' => 'git'],
            ['name' => 'اختبار البرمجيات', 'description' => 'منهجيات وأدوات ضمان جودة البرمجيات', 'color' => '#4CAF50', 'icon' => 'testing'],
            ['name' => 'تصميم الأنظمة', 'description' => 'مبادئ وهندسة تصميم الأنظمة البرمجية القابلة للتوسع', 'color' => '#9C27B0', 'icon' => 'system'],
            ['name' => 'الأمن السيبراني', 'description' => 'حماية الأنظمة والشبكات من الهجمات الرقمية', 'color' => '#F44336', 'icon' => 'security'],
            ['name' => 'الشبكات', 'description' => 'أساسيات اتصالات الشبكات والبروتوكولات', 'color' => '#FF9800', 'icon' => 'network'],
            ['name' => 'الهندسة النظيفة', 'description' => 'مبادئ تصميم البرمجيات القابلة للصيانة والاختبار', 'color' => '#00BCD4', 'icon' => 'clean'],
            ['name' => 'الخدمات المصغرة', 'description' => 'بناء الأنظمة من خدمات صغيرة مستقلة وقابلة للنشر', 'color' => '#607D8B', 'icon' => 'microservices'],
        ];
        $categories = [];
        foreach ($definitions as $def) {
            $slug = Str::slug($def['name']);
            $existing = QuestionCategory::where('tenant_id', $this->tenant->id)->where('slug', $slug)->first();
            if ($existing) { $categories[$slug] = $existing; continue; }
            $categories[$slug] = QuestionCategory::create([
                'tenant_id' => $this->tenant->id,
                'created_by_tenant_user_id' => $this->creator->id,
                'name' => $def['name'],
                'slug' => $slug,
                'description' => $def['description'],
                'color' => $def['color'],
                'icon' => $def['icon'],
                'sort_order' => 0,
                'status' => 'active',
            ]);
            $this->categoriesCreated++;
        }
        return $categories;
    }

    private function createAllExams(array $categories): void
    {
        $exams = [
            $this->examLaravel($categories),
            $this->examPHP($categories),
            $this->examReact($categories),
            $this->examNextJs($categories),
            $this->examDocker($categories),
            $this->examLinux($categories),
            $this->examRestApi($categories),
            $this->examDatabase($categories),
            $this->examGit($categories),
            $this->examTesting($categories),
            $this->examSystemDesign($categories),
            $this->examCyberSecurity($categories),
            $this->examNetworking($categories),
            $this->examCleanArchitecture($categories),
            $this->examMicroservices($categories),
            $this->examLaravelAdvanced($categories),
            $this->examReactAdvanced($categories),
            $this->examDockerAdvanced($categories),
            $this->examLinuxAdvanced($categories),
            $this->examFullStack($categories),
        ];
        foreach ($exams as $examData) { $this->seedSingleExam($examData); }
    }

    private function seedSingleExam(array $data): void
    {
        $slug = Str::slug($data['exam']['title']);
        if (Exam::where('tenant_id', $this->tenant->id)->where('slug', $slug)->exists()) { $this->examsCreated++; return; }
        $category = $data['categories'][$data['categorySlug']] ?? null;
        $bank = QuestionBank::create([
            'tenant_id' => $this->tenant->id,
            'created_by_tenant_user_id' => $this->creator->id,
            'name' => 'بنك أسئلة ' . $data['exam']['title'],
            'description' => 'بنك أسئلة شامل لاختبار ' . $data['exam']['title'],
            'category_id' => $category?->id,
            'status' => 'active',
            'visibility' => 'public',
        ]);
        $this->banksCreated++;
        $exam = Exam::create([
            'tenant_id' => $this->tenant->id,
            'created_by_tenant_user_id' => $this->creator->id,
            'title' => $data['exam']['title'],
            'description' => $data['exam']['description'],
            'category' => $data['categorySlug'],
            'status' => 'published',
            'visibility' => 'public',
            'language' => 'ar',
            'duration' => $data['exam']['duration'],
            'passing_score' => $data['exam']['passing_score'],
            'total_points' => 0,
            'question_count' => 0,
            'attempt_limit' => $data['exam']['attempt_limit'] ?? 3,
            'shuffle_questions' => true,
            'shuffle_choices' => true,
            'show_results' => true,
            'show_correct_answers' => true,
            'allow_review' => true,
            'negative_marking' => false,
            'certificate_eligible' => true,
            'pinned' => false,
            'featured' => true,
        ]);
        $exam->forceFill(['published_at' => now()])->save();
        $this->examsCreated++;
        $order = 0;
        $totalPoints = 0;
        foreach ($data['questions'] as $q) {
            $question = Question::create([
                'tenant_id' => $this->tenant->id,
                'created_by_tenant_user_id' => $this->creator->id,
                'category_id' => $category?->id,
                'bank_id' => $bank->id,
                'title' => $q['title'],
                'description' => $q['description'] ?? null,
                'type' => $q['type'],
                'difficulty' => $q['difficulty'] ?? 'medium',
                'tags' => $q['tags'] ?? [$data['categorySlug'], $q['type']],
                'points' => $q['points'] ?? 2,
                'estimated_time' => $q['estimated_time'] ?? 60,
                'language' => 'ar',
                'status' => 'published',
                'visibility' => 'public',
                'shuffle_options' => true,
                'explanation' => $q['explanation'] ?? null,
                'hint' => $q['hint'] ?? null,
                'content' => $q['content'],
                'metadata' => ['source' => 'exam_bank_seeder', 'version' => '1.0', 'topic' => $data['categorySlug']],
            ]);
            $order++;
            $points = $q['points'] ?? 2;
            $totalPoints += $points;
            ExamQuestion::create([
                'tenant_id' => $this->tenant->id,
                'created_by_tenant_user_id' => $this->creator->id,
                'exam_id' => $exam->id,
                'question_id' => $question->id,
                'section' => $q['section'] ?? null,
                'order' => $order,
                'points' => $points,
            ]);
            $this->questionsCreated++;
        }
        $exam->forceFill(['total_points' => $totalPoints, 'question_count' => $order])->save();
    }

    // ═══════════════════════════════════════════════════
    // EXAM DEFINITIONS
    // ═══════════════════════════════════════════════════

    private function examLaravel(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'laravel',
            'exam' => ['title' => 'اختبار Laravel الأساسي', 'description' => 'اختبار شامل في إطار عمل Laravel من النماذج والعلاقات إلى الهجرات وArtisan.', 'duration' => 90, 'passing_score' => 65, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو الأمر المستخدم لإنشاء نموذج جديد في Laravel؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الأمر المستخدم لإنشاء نموذج جديد في Laravel؟', 'options' => ['php artisan make:model', 'php artisan create:model', 'php artisan new:model', 'php artisan generate:model'], 'correct' => [0]], 'explanation' => 'أداة Artisan توفر الأمر make:model لإنشاء نموذج جديد مع ملفات مرفقة.'],
                ['title' => 'أي من التالي يُعدّ نموذجًا أساسيًا في Laravel؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'أي من التالي يُعدّ نموذجًا أساسيًا في Laravel؟', 'options' => ['Eloquent Model', 'View Model', 'Service Model', 'Controller Model'], 'correct' => [0]], 'explanation' => 'Eloquent هو طبقة ORM الأساسية في Laravel.'],
                ['title' => 'ما هي الطريقة المستخدمة لجلب جميع السجلات في Eloquent؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هي الطريقة المستخدمة لجلب جميع السجلات في Eloquent؟', 'options' => ['Model::all()', 'Model::get()', 'Model::fetch()', 'Model::allRecords()'], 'correct' => [0]], 'explanation' => 'الدالة all() تُرجع جميع النماذج من الجدول.'],
                ['title' => 'ما هو الملف المسؤول عن تحديد مسار الطرق في Laravel؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الملف المسؤول عن تحديد مسار الطرق في Laravel؟', 'options' => ['routes/web.php', 'app/Routes.php', 'config/routes.php', 'bootstrap/routes.php'], 'correct' => [0]], 'explanation' => 'ملف routes/web.php هو الملف الرئيسي لتعريف طرق الويب.'],
                ['title' => 'ما هو middleware في Laravel؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو middleware في Laravel؟', 'options' => ['طبقة تفحص الطلبات قبل الوصول إلى الموجه', 'ملف جافاسكربت للتحقق', 'قاعدة بيانات مؤقتة', 'خدمة إرسال البريد'], 'correct' => [0]], 'explanation' => 'Middleware يفحص الطلبات الواردة قبل معالجتها.'],
                ['title' => 'ما هو الفرق بين get و first في Eloquent؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين get و first في Eloquent؟', 'options' => ['get تُرجع مجموعة و first تُرجع نموذجًا واحدًا', 'get أسرع من first', 'get للقراءة و first للكتابة', 'لا يوجد فرق'], 'correct' => [0]], 'explanation' => 'get() تُرجع Collection بينما first() تُرجع الكائن الأول أو null.'],
                ['title' => 'أي من التالي مكونات نظام التخزين المؤقت في Laravel؟', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي مكونات نظام التخزين المؤقت في Laravel؟', 'options' => ['Cache::get()', 'Cache::put()', 'Cache::remember()', 'Cache::delete()', 'Cache::flash()'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع الدوال جزء من واجهة Cache في Laravel.'],
                ['title' => 'ما هي أنماط التصميم المعمارية المدعومة في Laravel؟', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'ما هي أنماط التصميم المعمارية المدعومة في Laravel؟', 'options' => ['Repository Pattern', 'Service Container', 'Observer Pattern', 'Factory Pattern', 'Singleton Pattern'], 'correct' => [0,1,2,3,4]], 'explanation' => 'يدعم Laravel أنماط متعددة.'],
                ['title' => 'أي من التالي من أنواع العلاقات في Eloquent؟', 'type' => 'multiple_choice', 'difficulty' => 'easy', 'points' => 3, 'content' => ['question' => 'أي من التالي من أنواع العلاقات في Eloquent؟', 'options' => ['hasMany', 'belongsTo', 'belongsToMany', 'hasOne', 'morphMany'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع العلاقات المذكورة مدعومة في Eloquent.'],
                ['title' => 'Laravel يدعم التحقق من صحة المدخلات عبر Request Classes.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'Laravel يدعم التحقق من صحة المدخلات عبر Request Classes.', 'correct' => true], 'explanation' => 'FormRequest هي فئة مخصصة للتحقق من صحة المدخلات.'],
                ['title' => 'Eloquent هو نظام ORM فريد لا يوجد له بديل في PHP.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'Eloquent هو نظام ORM فريد لا يوجد له بديل في PHP.', 'correct' => false], 'explanation' => 'يوجد بدائل مثل Doctrine ORM.'],
                ['title' => 'يمكن استخدام Laravel لبناء واجهات برمجة التطبيقات.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'يمكن استخدام Laravel لبناء واجهات برمجة التطبيقات.', 'correct' => true], 'explanation' => 'Laravel يوفر API Resources و Sanctum و Passport.'],
                ['title' => 'Migration في Laravel يسمح بالتعديل على هيكل قاعدة البيانات.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'Migration في Laravel يسمح بالتعديل على هيكل قاعدة البيانات بعد إنشائها.', 'correct' => true], 'explanation' => 'يمكن استخدام rollback و up و down.'],
                ['title' => 'ما هو اسم العنصر الذي يُستخدم لتوليد روابط CSRF في Blade؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو اسم العنصر الذي يُستخدم لتوليد روابط CSRF في نماذج Blade؟', 'correct' => '@csrf', 'acceptable_answers' => ['@csrf', 'csrf_field()']], 'explanation' => '@csrf هو directive Blade لتوليد حقل CSRF المخفي.'],
                ['title' => 'ما هي الطريقة لإنشاء هجرة جديدة عبر Artisan؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هي الطريقة المستخدمة لإنشاء هجرة جديدة عبر Artisan؟', 'correct' => 'php artisan make:migration', 'acceptable_answers' => ['php artisan make:migration', 'make:migration']], 'explanation' => 'الأمر make:migration يُنشئ ملف هجرة جديد.'],
                ['title' => 'ما هو الاسم الآخر لـ Service Container في Laravel؟', 'type' => 'short_answer', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الاسم الآخر لـ Service Container في Laravel؟', 'correct' => 'IoC Container', 'acceptable_answers' => ['IoC Container', 'Dependency Injection Container']], 'explanation' => 'Service Container يُعرف أيضًا بـ IoC Container.'],
                ['title' => 'ما هو المجلد الذي يحتوي على ملفات القوالب في Laravel؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'ما هو المجلد الذي يحتوي على ملفات القوالب في Laravel؟', 'correct' => 'resources/views', 'acceptable_answers' => ['resources/views', 'views']], 'explanation' => 'ملفات Blade القالب موجودة في resources/views.'],
                ['title' => 'اشرح الفرق بين Dependency Injection و Service Container مع أمثلة.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح الفرق بين Dependency Injection و Service Container مع تقديم أمثلة عملية.', 'rubric' => 'التقييم على: وضوح الشرح (2) + أمثلة عملية (2) + دقة المفاهيم (1).'], 'explanation' => 'Dependency Injection هو نمط التصميم و Service Container هو الأداة التي تُطبّقه.'],
                ['title' => 'صف كيفية بناء نظام مصادقة كامل باستخدام Laravel من الصفر.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'صف كيفية بناء نظام مصادقة كامل باستخدام Laravel من الصفر.', 'rubric' => 'التقييم على: خطوات واضحة (2) + شرح المكونات (2) + أفضل الممارسات (1).'], 'explanation' => 'Laravel يوفر Auth Scaffolding و Sanctum و Passport.'],
                ['title' => 'قارن بين Eloquent و Query Builder في Laravel.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'قارن بين Eloquent و Query Builder في Laravel مع تقديم أفضل الممارسات.', 'rubric' => 'التقييم على: شرح Eloquent (1) + شرح Query Builder (1) + مقارنة (1) + أمثلة (1) + أفضل الممارسات (1).'], 'explanation' => 'Eloquent ORM و Query Builder كلاهما يُستخدمان للاستعلام عن البيانات.'],
                ['title' => 'أكمل: ______ في Laravel يُستخدم لإنشاء جداول قاعدة البيانات.', 'type' => 'fill_blank', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في Laravel يُستخدم لإنشاء جداول قاعدة البيانات.', 'correct' => 'Migration', 'acceptable_answers' => ['Migration', 'migration', 'المهاجرات']], 'explanation' => 'Migration هي الأداة المسؤولة عن إدارة هيكل قاعدة البيانات.'],
                ['title' => 'أكمل: ______ يُستخدم لإنشاء بيانات وهمية للاختبار.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ يُستخدم لإنشاء بيانات وهمية للاختبار.', 'correct' => 'Factory', 'acceptable_answers' => ['Factory', 'Factories']], 'explanation' => 'Factory تُستخدم لإنشاء نماذج وهمية.'],
                ['title' => 'أكمل: ______ في Laravel يُستخدم لإرسال الرسائل غير المتزامنة.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في Laravel يُستخدم لإرسال الرسائل غير المتزامنة.', 'correct' => 'Queue', 'acceptable_answers' => ['Queue', 'القائمة']], 'explanation' => 'Queue System يُستخدم لتأخير المعالجة الثقيلة.'],
                ['title' => 'أكمل: ______ في Laravel يُستخدم لتحسين أداء الاستعلامات المتكررة.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في Laravel يُستخدم لتحسين أداء الاستعلامات المتكررة.', 'correct' => 'Eager Loading', 'acceptable_answers' => ['Eager Loading', 'eager loading', 'with()']], 'explanation' => 'Eager Loading يحمّل العلاقات في استعلام واحد.'],
                ['title' => 'طابق بين أنواع العلاقات في Eloquent والمصطلحات المقابلة.', 'type' => 'matching', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'طابق بين أنواع العلاقات في Eloquent والمصطلحات المقابلة.', 'pairs' => [['left' => 'hasMany', 'right' => 'علاقة واحد إلى متعدد'], ['left' => 'belongsTo', 'right' => 'علاقة متعدد إلى واحد'], ['left' => 'belongsToMany', 'right' => 'علاقة متعدد إلى متعدد'], ['left' => 'hasOne', 'right' => 'علاقة واحد إلى واحد']]], 'explanation' => 'كل نوع علاقة في Eloquent يمثل بنية بيانات مختلفة.'],
                ['title' => 'طابق بين أوامر Artisan والاستخدامات المقابلة.', 'type' => 'matching', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'طابق بين أوامر Artisan والاستخدامات المقابلة.', 'pairs' => [['left' => 'make:model', 'right' => 'إنشاء نموذج'], ['left' => 'make:controller', 'right' => 'إنشاء مُوجّه'], ['left' => 'make:migration', 'right' => 'إنشاء هجرة'], ['left' => 'make:middleware', 'right' => 'إنشاء وسيط']]], 'explanation' => 'كل أمر Artisan له وظيفة محددة.'],
                ['title' => 'رتّب خطوات إنشاء مشروع Laravel جديد بالترتيب الصحيح.', 'type' => 'ordering', 'difficulty' => 'easy', 'points' => 3, 'content' => ['question' => 'رتّب خطوات إنشاء مشروع Laravel جديد بالترتيب الصحيح.', 'items' => ['تثبيت Composer Global', 'إنشاء مشروع عبر create-project', 'تهيئة ملف .env', 'تشغيل php artisan migrate', 'تشغيل php artisan serve']], 'explanation' => 'خطوات إنشاء مشروع Laravel تتبع تسلسلًا منطقيًا.'],
                ['title' => 'رتّب خطوات بناء API في Laravel بالترتيب الصحيح.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب خطوات بناء API في Laravel بالترتيب الصحيح.', 'items' => ['إنشاء النموذج والمigration', 'إنشاء الController', 'تعريف المسارات', 'إضافة التحقق من المدخلات', 'اختبار الـ API']], 'explanation' => 'بناء API يتبع تسلسلًا واضحًا.'],
                ['title' => 'كم عدد خصائص Trait الأساسية في PHP؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد خصائص Trait الأساسية في PHP؟', 'correct' => 6, 'tolerance' => 0], 'explanation' => 'PHP يدعم 6 أنواع أساسية: public, protected, private, static, abstract, final.'],
                ['title' => 'قم بإنشاء migration لإنشاء جدول المستخدمين.', 'type' => 'file_upload', 'difficulty' => 'medium', 'points' => 4, 'content' => ['question' => 'قم بإنشاء ملف migration لإنشاء جدول المستخدمين مع الحقول الأساسية.', 'accepted_formats' => ['php'], 'max_size_kb' => 10, 'rubric' => 'التقييم على: Schema::create (1) + الحقول (2) + timestamps (1).'], 'explanation' => 'جدول المستخدمين يحتاج name و email و password.'],
                ['title' => 'اكتب Controller بسيط لعرض المستخدمين مع التصفية.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب Controller بسيط لعرض قائمة المستخدمين مع دعم التصفية.', 'language' => 'php', 'template' => "<?php\nnamespace App\\Http\\Controllers;\nuse Illuminate\\Http\\Request;\nclass UserController extends Controller\n{\n    // الكود هنا\n}", 'solution' => "<?php\nnamespace App\\Http\\Controllers;\nuse App\\Models\\User;\nuse Illuminate\\Http\\Request;\nclass UserController extends Controller\n{\n    public function index(Request \$request)\n    {\n        \$query = User::query();\n        if (\$request->has('search')) {\n            \$query->where('name', 'like', '%' . \$request->search . '%');\n        }\n        \$users = \$query->paginate(15);\n        return view('users.index', compact('users'));\n    }\n}"], 'explanation' => 'يجب استخدام Eloquent مع دعم التصفية والصفحات.'],
                ['title' => 'اكتب Event و Listener لإرسال بريد ترحيبي.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب Event و Listener لإرسال بريد ترحيبي عند تسجيل مستخدم جديد.', 'language' => 'php', 'template' => "<?php\n// اكتب Event class\n// اكتب Listener class", 'solution' => "<?php\nnamespace App\\Events;\nuse App\\Models\\User;\nclass UserRegistered\n{\n    public function __construct(public User \$user) {}\n}\n\nnamespace App\\Listeners;\nuse App\\Events\\UserRegistered;\nclass SendWelcomeEmail\n{\n    public function handle(UserRegistered \$event): void\n    {\n        // Send email\n    }\n}"], 'explanation' => 'يجب إنشاء Event و Listener منفصلين.'],
                ['title' => 'اكتب FormRequest مخصص للتحقق من بيانات التسجيل.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب FormRequest مخصص للتحقق من بيانات تسجيل مستخدم جديد.', 'language' => 'php', 'template' => "<?php\nnamespace App\\Http\\Requests;\nuse Illuminate\\Foundation\\Http\\FormRequest;\nclass RegisterRequest extends FormRequest\n{\n    // الكود هنا\n}", 'solution' => "<?php\nnamespace App\\Http\\Requests;\nuse Illuminate\\Foundation\\Http\\FormRequest;\nclass RegisterRequest extends FormRequest\n{\n    public function authorize(): bool { return true; }\n    public function rules(): array\n    {\n        return [\n            'name' => 'required|string|max:255',\n            'email' => 'required|email|unique:users,email',\n            'password' => 'required|string|min:8|confirmed',\n        ];\n    }\n}"], 'explanation' => 'FormRequest يفصل منطق التحقق عن Controller.'],
            ],
        ];
    }

    private function examPHP(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'php',
            'exam' => ['title' => 'اختبار PHP المتقدم', 'description' => 'اختبار شامل في لغة PHP من البرمجة الكائنية إلى التحسين والأداء.', 'duration' => 75, 'passing_score' => 60, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو الفرق بين interface و abstract class في PHP؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين interface و abstract class في PHP؟', 'options' => ['Interface لا تحتوي على تنفيذ و Abstract Class قد تحتوي', 'Interface أسرع', 'Abstract Class لا تدعم التعددية', 'لا يوجد فرق'], 'correct' => [0]], 'explanation' => 'Interface تُعرّف العقد فقط بينما Abstract Class قد تحتوي على تنفيذ جزئي.'],
                ['title' => 'أي من التالي من مبادئ SOLID؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أي من التالي من مبادئ SOLID؟', 'options' => ['Open/Closed Principle', 'Optimized Loading', 'Single Language', 'Object Division', 'Layered Implementation'], 'correct' => [0]], 'explanation' => 'Open/Closed Principle هو المبدأ الثاني من SOLID.'],
                ['title' => 'ما هو Namespace في PHP؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو Namespace في PHP؟', 'options' => ['أداة لتنظيم الكود وتجنب تعارض الأسماء', 'نوع بيانات', 'بروتوكول اتصال', 'مكتبة'], 'correct' => [0]], 'explanation' => 'Namespace يُستخدم لتنظيم الكود وتجنب تعارض أسماء الفئات.'],
                ['title' => 'ما هو الفرق بين include و require في PHP؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين include و require في PHP؟', 'options' => ['require يوقف التنفيذ عند الخطأ و include لا يوقف', 'include أسرع', 'لا يوجد فرق', 'require للملفات النصية فقط'], 'correct' => [0]], 'explanation' => 'require يرمي Fatal Error إذا فشل الملف بينما include يرمي Warning.'],
                ['title' => 'ما هو Closure في PHP؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Closure في PHP؟', 'options' => ['دالة مجهولة تلتقط المتغيرات من النطاق الخارجي', 'نوع بيانات', 'كائن خاص', 'بروتوكول'], 'correct' => [0]], 'explanation' => 'Closure هي دالة匿名 تلتقط المتغيرات من النطاق الخارجي.'],
                ['title' => 'ما هي الدالة المستخدمة للتحقق من نوع المتغير؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هي الدالة المستخدمة للتحقق من نوع المتغير في PHP؟', 'options' => ['gettype()', 'typeof()', 'type()', 'checktype()'], 'correct' => [0]], 'explanation' => 'gettype() تُرجع نوع المتغير كنص.'],
                ['title' => 'أي من التالي أنواع بيانات مدعومة في PHP 8؟', 'type' => 'multiple_choice', 'difficulty' => 'easy', 'points' => 3, 'content' => ['question' => 'أي من التالي أنواع بيانات مدعومة في PHP 8؟', 'options' => ['int', 'float', 'string', 'bool', 'array'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع هذه الأنواع مدعومة في PHP.'],
                ['title' => 'أي من التالي من ميزات PHP 8؟', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'أي من التالي من ميزات PHP 8؟', 'options' => ['Named Arguments', 'Attributes', 'Constructor Promotion', 'Union Types', 'Match Expression'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع هذه الميزات أُضيفت في PHP 8.'],
                ['title' => 'PHP لغة مُفسّرة وليست مُجمّعة.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'PHP لغة مُفسّرة وليست مُجمّعة.', 'correct' => true], 'explanation' => 'PHP تُفسّر بواسطة PHP Interpreter.'],
                ['title' => 'PHP لا تدعم البرمجة الكائنية.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'PHP لا تدعم البرمجة الكائنية.', 'correct' => false], 'explanation' => 'PHP تدعم البرمجة الكائنية بالكامل.'],
                ['title' => 'Traits في PHP تسمح بإعادة استخدام الكود.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'Traits في PHP تسمح بإعادة استخدام الكود في فئات متعددة.', 'correct' => true], 'explanation' => 'Traits تحل محل الوراثة المتعددة في PHP.'],
                ['title' => 'ما هو الأمر المستخدم لتشغيل PHP script؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الأمر المستخدم لتشغيل PHP script من سطر الأوامر؟', 'correct' => 'php filename.php', 'acceptable_answers' => ['php filename.php', 'php']], 'explanation' => 'الأمر php يُستخدم لتشغيل ملفات PHP.'],
                ['title' => 'اشرح مبدأ SOLID مع تطبيق عملي لكل مبدأ.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح مبدأ SOLID مع تطبيق عملي لكل مبدأ.', 'rubric' => 'التقييم على: شرح كل مبدأ (2) + تطبيقات عملية (2) + وضوح الكتابة (1).'], 'explanation' => 'SOLID تشمل SRP و OCP و LSP و ISP و DIP.'],
                ['title' => 'قارن بين البرمجة الكائنية والوظيفية في PHP.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'قارن بين البرمجة الكائنية والوظيفية في PHP مع تقديم أفضل الممارسات.', 'rubric' => 'التقييم على: شرح الكائنية (1) + شرح الوظيفية (1) + مقارنة (1) + أمثلة (1) + أفضل الممارسات (1).'], 'explanation' => 'الكائنية تعتمد على الفئات والكائنات بينما الوظيفية على الدوال.'],
                ['title' => 'أكمل: ______ في PHP تسمح بتقسيم الكود إلى أجزاء قابلة لإعادة الاستخدام.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في PHP تسمح بتقسيم الكود إلى أجزاء قابلة لإعادة الاستخدام.', 'correct' => 'Traits', 'acceptable_answers' => ['Traits', 'trait', 'السمات']], 'explanation' => 'Traits توفر إعادة استخدام الكود بدون وراثة متعددة.'],
                ['title' => 'أكمل: ______ تُستخدم لإدارة الأخطاء بشكل مناسب في PHP.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في PHP تُستخدم لإدارة الأخطاء بشكل مناسب.', 'correct' => 'Exceptions', 'acceptable_answers' => ['Exceptions', 'Exception', 'الاستثناءات']], 'explanation' => 'Exceptions توفر آلية منظمة للتعامل مع الأخطاء.'],
                ['title' => 'طابق بين مبادئ SOLID والتعريفات المقابلة.', 'type' => 'matching', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'طابق بين مبادئ SOLID والتعريفات المقابلة.', 'pairs' => [['left' => 'SRP', 'right' => 'مسؤولية واحدة فقط'], ['left' => 'OCP', 'right' => 'مفتوح للتوسيع ومغلق للتعديل'], ['left' => 'LSP', 'right' => 'يمكن استبدال الفئات الفرعية بالأب']]], 'explanation' => 'مبادئ SOLID تشكل أساس البرمجة الكائنية.'],
                ['title' => 'رتّب مراحل دورة حياة الكائن في PHP.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب مراحل دورة حياة الكائن في PHP بالترتيب الصحيح.', 'items' => ['__construct()', 'Method Calls', '__destruct()']], 'explanation' => 'الكائن يُنشأ ثم تُنادى عليه الدوال ثم يُدمّر.'],
                ['title' => 'كم عدد مبادئ SOLID؟', 'type' => 'numeric', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'كم عدد مبادئ SOLID؟', 'correct' => 5, 'tolerance' => 0], 'explanation' => 'SOLID يحتوي على 5 مبادئ.'],
                ['title' => 'قم بإنشاء فئة PHP تطبق نمط Singleton.', 'type' => 'file_upload', 'difficulty' => 'hard', 'points' => 4, 'content' => ['question' => 'قم بإنشاء فئة PHP تطبق نمط Singleton.', 'accepted_formats' => ['php'], 'max_size_kb' => 5, 'rubric' => 'التقييم على: الخاصية الثابتة (1) + المنشئ الخاص (1) + getInstance (1) + منع التكرار (1).'], 'explanation' => 'Singleton يضمن نسخة واحدة فقط من الكائن.'],
                ['title' => 'اكتب دالة PHP تتحقق من توازن الأقواس.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب دالة PHP تتحقق من توازن الأقواس في نص معين.', 'language' => 'php', 'template' => "<?php\nfunction areBracketsBalanced(string \$input): bool\n{\n    // الكود هنا\n}", 'solution' => "<?php\nfunction areBracketsBalanced(string \$input): bool\n{\n    \$stack = [];\n    \$pairs = ['(' => ')', '[' => ']', '{' => '}'];\n    for (\$i = 0; \$i < strlen(\$input); \$i++) {\n        \$char = \$input[\$i];\n        if (isset(\$pairs[\$char])) \$stack[] = \$char;\n        elseif (in_array(\$char, [')', ']', '}'])) {\n            if (empty(\$stack) || \$pairs[array_pop(\$stack)] !== \$char) return false;\n        }\n    }\n    return empty(\$stack);\n}"], 'explanation' => 'يُستخدم Stack لمطابقة الأقواس.'],
                ['title' => 'اكتب نظام للتعامل مع الأخطاء باستخدام try-catch.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب نظام بسيط للتعامل مع الأخطاء باستخدام try-catch و custom exceptions.', 'language' => 'php', 'template' => "<?php\n// اكتب Exception مخصص\n// اكتب التعامل مع الخطأ", 'solution' => "<?php\nclass InsufficientBalanceException extends \\RuntimeException {}\nclass Wallet {\n    private float \$balance;\n    public function __construct(float \$b) { \$this->balance = \$b; }\n    public function withdraw(float \$amount): void {\n        if (\$amount > \$this->balance)\n            throw new InsufficientBalanceException('الرصيد غير كافٍ');\n        \$this->balance -= \$amount;\n    }\n}\ntry { \$w = new Wallet(100); \$w->withdraw(150);\n} catch (InsufficientBalanceException \$e) { echo \$e->getMessage(); }"], 'explanation' => 'Exception مخصص يسمح بمعالجة أخطاء محددة.'],
            ],
        ];
    }

    private function examReact(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'react',
            'exam' => ['title' => 'اختبار React الأساسي', 'description' => 'اختبار شامل في مكتبة React من المكونات إلى إدارة الحالة.', 'duration' => 60, 'passing_score' => 60, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو الهدف الرئيسي من React؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الهدف الرئيسي من React؟', 'options' => ['بناء واجهات المستخدم التفاعلية', 'إدارة قواعد البيانات', 'تشغيل الخوادم', 'إرسال البريد'], 'correct' => [0]], 'explanation' => 'React مكتبة لبناء واجهات المستخدم.'],
                ['title' => 'ما هو Virtual DOM في React؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Virtual DOM في React؟', 'options' => ['نسخة خفيفة من DOM الحقيقي', 'نوع قاعدة بيانات', 'أداة للشبكة', 'مكتبة للتحقق'], 'correct' => [0]], 'explanation' => 'Virtual DOM هو نسخة خفيفة من DOM لتحسين الأداء.'],
                ['title' => 'ما هو Hook في React؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Hook في React؟', 'options' => ['دالة تسمح باستخدام الحالة في المكونات الوظيفية', 'كائن تخزين', 'نوع مكون', 'أداة تصحيح'], 'correct' => [0]], 'explanation' => 'Hooks تسمح باستخدام الحالة والدورة حياة.'],
                ['title' => 'ما هو useState في React؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو useState في React؟', 'options' => ['Hook لإدارة الحالة المحلية', 'نوع مكون', 'مكتبة تحقق', 'أداة تحليل'], 'correct' => [0]], 'explanation' => 'useState يُستخدم لإدارة الحالة المحلية.'],
                ['title' => 'الفرق بين المكونات الوظيفية والفئات في React؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين المكونات الوظيفية والفئات في React؟', 'options' => ['الوظيفية تستخدم Hooks والفئات تستخدم this.state', 'لا يوجد فرق', 'الفئات أسرع', 'الوظيفية لا تدعم الحالة'], 'correct' => [0]], 'explanation' => 'الوظيفية تستخدم Hooks والفئات تستخدم this.state.'],
                ['title' => 'أي من التالي من Hooks المدمجة في React؟', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي من Hooks المدمجة في React؟', 'options' => ['useState', 'useEffect', 'useContext', 'useReducer', 'useMemo'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع هذه Hooks مدمجة في React.'],
                ['title' => 'React هو إطار عمل كامل لبناء تطبيقات الويب.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'React هو إطار عمل كامل لبناء تطبيقات الويب.', 'correct' => false], 'explanation' => 'React مكتبة فقط لواجهات المستخدم.'],
                ['title' => 'يجب أن تبدأ أسماء المكونات بحرف كبير.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'يجب أن تبدأ أسماء المكونات في React بحرف كبير.', 'correct' => true], 'explanation' => 'React يميز بين المكونات والعناصر بالأحرف الكبيرة.'],
                ['title' => 'ما هو Hook المستخدم ل副作用 في React؟', 'type' => 'short_answer', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Hook المستخدم ل副作用 في React؟', 'correct' => 'useEffect', 'acceptable_answers' => ['useEffect', 'use_effect']], 'explanation' => 'useEffect يُستخدم للتعامل مع副作用.'],
                ['title' => 'اشرح الفرق بين الحالة المحلية و Redux.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح الفرق بين الحالة المحلية و Redux مع تقديم أفضل الممارسات.', 'rubric' => 'التقييم على: شرح الحالة (1) + شرح Redux (1) + مقارنة (1) + أفضل الممارسات (1) + أمثلة (1).'], 'explanation' => 'الحالة المحلية خاصة بالمكون و Redux للحالة المشتركة.'],
                ['title' => 'أكمل: ______ في React يسمح بتمرير البيانات من الأب إلى الابن.', 'type' => 'fill_blank', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في React يسمح بتمرير البيانات من المكون الأب إلى ابنه.', 'correct' => 'Props', 'acceptable_answers' => ['Props', 'props', 'الخصائص']], 'explanation' => 'Props آليه تمرير البيانات من الأب إلى الابن.'],
                ['title' => 'طابق بين Hooks والاستخدامات المقابلة.', 'type' => 'matching', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'طابق بين Hooks والاستخدامات المقابلة.', 'pairs' => [['left' => 'useState', 'right' => 'إدارة الحالة'], ['left' => 'useEffect', 'right' => 'ال副作用'], ['left' => 'useContext', 'right' => 'قراءة السياق'], ['left' => 'useReducer', 'right' => 'الحالة المعقدة']]], 'explanation' => 'كل Hook له استخدام محدد.'],
                ['title' => 'رتّب دورة حياة المكون في React.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب دورة حياة المكون في React بالترتيب الصحيح.', 'items' => ['componentDidMount', 'componentDidUpdate', 'componentWillUnmount']], 'explanation' => 'دورة حياة المكون تتبع تسلسلًا زمنيًا.'],
                ['title' => 'كم عدد Hooks المدمجة في React تقريبًا؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد Hooks المدمجة في React؟', 'correct' => 9, 'tolerance' => 2], 'explanation' => 'React يوفر حوالي 9 Hooks مدمجة.'],
                ['title' => 'قم بإنشاء مكون React بسيط لعرض قائمة مهام.', 'type' => 'file_upload', 'difficulty' => 'medium', 'points' => 4, 'content' => ['question' => 'قم بإنشاء مكون React بسيط لعرض قائمة مهام.', 'accepted_formats' => ['jsx', 'js', 'tsx'], 'max_size_kb' => 10, 'rubric' => 'التقييم على: تعريف المكون (1) + useState (1) + عرض القائمة (1) + التحقق (1).'], 'explanation' => 'يجب إنشاء مكون وظيفي يستخدم useState.'],
                ['title' => 'اكتب Custom Hook لإدارة نموذج مع التحقق.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب Custom Hook لإدارة نموذج مع التحقق من المدخلات.', 'language' => 'javascript', 'template' => "import { useState } from 'react';\nfunction useForm(initialValues, validate) {\n    // الكود هنا\n}", 'solution' => "import { useState } from 'react';\nfunction useForm(initialValues, validate) {\n    const [values, setValues] = useState(initialValues);\n    const [errors, setErrors] = useState({});\n    const handleChange = (name, value) => {\n        setValues(prev => ({ ...prev, [name]: value }));\n    };\n    const handleSubmit = (onSubmit) => (e) => {\n        e.preventDefault();\n        const errs = validate(values);\n        setErrors(errs);\n        if (Object.keys(errs).length === 0) onSubmit(values);\n    };\n    return { values, errors, handleChange, handleSubmit };\n}"], 'explanation' => 'Custom Hook يسمح بإعادة استخدام منطق الحالة.'],
                ['title' => 'اكتب نظام إدارة حالة باستخدام Context API.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب نظام إدارة حالة بسيط باستخدام Context API.', 'language' => 'javascript', 'template' => "import { createContext, useContext, useReducer } from 'react';\n// اكتب Context و Provider و Reducer", 'solution' => "import { createContext, useContext, useReducer } from 'react';\nconst AppContext = createContext();\nfunction appReducer(state, action) {\n    switch (action.type) {\n        case 'INCREMENT': return { ...state, count: state.count + 1 };\n        case 'DECREMENT': return { ...state, count: state.count - 1 };\n        case 'RESET': return { ...state, count: 0 };\n        default: return state;\n    }\n}\nexport function AppProvider({ children }) {\n    const [state, dispatch] = useReducer(appReducer, { count: 0 });\n    return (<AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>);\n}\nexport function useApp() { return useContext(AppContext); }"], 'explanation' => 'Context API توفر إدارة حالة مشتركة بسيطة.'],
            ],
        ];
    }

    private function examNextJs(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'nextjs',
            'exam' => ['title' => 'اختبار Next.js المتقدم', 'description' => 'اختبار شامل في Next.js من التصيير إلى التحسين.', 'duration' => 75, 'passing_score' => 65, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'الفرق بين getServerSideProps و getStaticProps؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين getServerSideProps و getStaticProps؟', 'options' => ['getServerSideProps يعمل عند كل طلب و getStaticProps عند البناء', 'getServerSideProps أسرع', 'لا يوجد فرق', 'getStaticProps في Development فقط'], 'correct' => [0]], 'explanation' => 'getServerSideProps يعمل عند كل طلب بينما getStaticProps عند البناء.'],
                ['title' => 'ما هو ISR في Next.js؟', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو ISR في Next.js؟', 'options' => ['Incremental Static Regeneration', 'Integrated Server Rendering', 'Internal State Resolution', 'Infinite Scroll Rendering'], 'correct' => [0]], 'explanation' => 'ISR يسمح بتحديث الصفحات الثابتة بشكل دوري.'],
                ['title' => 'ما هو App Router في Next.js 13؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو App Router في Next.js 13؟', 'options' => ['نظام توجيه جديد يعتمد على المجلدات', 'أداة لإدارة قواعد البيانات', 'نظام مصادقة', 'أداة للتحسين'], 'correct' => [0]], 'explanation' => 'App Router هو نظام التوجيه الجديد بالملفات.'],
                ['title' => 'ما هو Middleware في Next.js؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Middleware في Next.js؟', 'options' => ['كود يعمل قبل معالجة الطلب', 'مكتبة تحقق', 'أداة تحليل', 'نظام إشعارات'], 'correct' => [0]], 'explanation' => 'Middleware يعمل قبل معالجة الطلب.'],
                ['title' => 'أي من التالي من ميزات Next.js؟', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي من ميزات Next.js؟', 'options' => ['Server Side Rendering', 'Static Site Generation', 'API Routes', 'Image Optimization', 'Internationalization'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع هذه الميزات متوفرة في Next.js.'],
                ['title' => 'Next.js يدعم التصيير من جانب الخادم بشكل افتراضي.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'Next.js يدعم التصيير من جانب الخادم بشكل افتراضي.', 'correct' => true], 'explanation' => 'Next.js يدعم SSR لتحسين SEO.'],
                ['title' => 'يجب وضع ملفات Next.js في src بشكل إلزامي.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'يجب وضع ملفات Next.js في مجلد src بشكل إلزامي.', 'correct' => false], 'explanation' => 'مجلد src اختياري.'],
                ['title' => 'ما هو الملف المسؤول عن تكوين Next.js؟', 'type' => 'short_answer', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الملف المسؤول عن تكوين Next.js؟', 'correct' => 'next.config.js', 'acceptable_answers' => ['next.config.js', 'next.config.mjs']], 'explanation' => 'next.config.js يحتوي على تكوينات Next.js.'],
                ['title' => 'قارن بين Pages Router و App Router.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'قارن بين Pages Router و App Router في Next.js مع أفضل الممارسات.', 'rubric' => 'التقييم على: شرح Pages Router (1) + App Router (1) + مقارنة (1) + أفضل الممارسات (1) + أمثلة (1).'], 'explanation' => 'Pages Router هو النظام القديم و App Router هو الجديد.'],
                ['title' => 'أكمل: ______ في Next.js يحسّن تحميل الصور.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في Next.js يسمح بتحميل الصور بشكل محسّن.', 'correct' => 'Image Component', 'acceptable_answers' => ['Image Component', 'next/image', 'Image']], 'explanation' => 'مكون Image يوفر تحسينات تلقائية.'],
                ['title' => 'رتّب خطوات بناء مشروع Next.js جديد.', 'type' => 'ordering', 'difficulty' => 'easy', 'points' => 3, 'content' => ['question' => 'رتّب خطوات بناء مشروع Next.js جديد بالترتيب الصحيح.', 'items' => ['npx create-next-app', 'اختيار الإعدادات', 'npm run dev', 'افتح localhost:3000']], 'explanation' => 'خطوات واضحة منطقيًا.'],
                ['title' => 'كم عدد أنواع التصيير المدعومة في Next.js؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد أنواع التصيير المدعومة في Next.js؟', 'correct' => 4, 'tolerance' => 1], 'explanation' => 'SSR و SSG و ISR و CSR.'],
                ['title' => 'اكتب API Route لإدارة بيانات المستخدمين.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب API Route في Next.js لإدارة بيانات المستخدمين.', 'language' => 'javascript', 'template' => "// pages/api/users.js\n// اكتب الدالة هنا", 'solution' => "export default function handler(req, res) {\n    switch (req.method) {\n        case 'GET':\n            res.status(200).json({ users: [] });\n            break;\n        case 'POST':\n            const { name, email } = req.body;\n            if (!name || !email)\n                return res.status(400).json({ error: 'الاسم والبريد مطلوبان' });\n            res.status(201).json({ user: { id: Date.now(), name, email } });\n            break;\n        default:\n            res.setHeader('Allow', ['GET', 'POST']);\n            res.status(405).end();\n    }\n}"], 'explanation' => 'API Routes توفر نقاط نهاية للطلبات.'],
                ['title' => 'اكتب Middleware للتحقق من المصادقة.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب Middleware في Next.js للتحقق من المصادقة.', 'language' => 'javascript', 'template' => "import { NextResponse } from 'next/server';\nexport function middleware(request) {\n    // الكود هنا\n}", 'solution' => "import { NextResponse } from 'next/server';\nexport function middleware(request) {\n    const token = request.cookies.get('token');\n    const isAuthPage = request.nextUrl.pathname.startsWith('/login');\n    if (!token && !isAuthPage)\n        return NextResponse.redirect(new URL('/login', request.url));\n    if (token && isAuthPage)\n        return NextResponse.redirect(new URL('/dashboard', request.url));\n    return NextResponse.next();\n}\nexport const config = { matcher: ['/dashboard/:path*', '/login'] };"], 'explanation' => 'Middleware يعمل قبل معالجة الطلب.'],
            ],
        ];
    }

    private function examDocker(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'docker',
            'exam' => ['title' => 'اختبار Docker الأساسي', 'description' => 'اختبار شامل في منصة Docker من الحاويات إلى Docker Compose.', 'duration' => 60, 'passing_score' => 60, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو Docker؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو Docker؟', 'options' => ['منصة لبناء وتشغيل التطبيقات في حاويات معزولة', 'نظام تشغيل', 'قاعدة بيانات', 'لغة برمجة'], 'correct' => [0]], 'explanation' => 'Docker منصة حاويات مفتوح المصدر.'],
                ['title' => 'ما هو Dockerfile؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو Dockerfile؟', 'options' => ['ملف نصي لتعليمات بناء الصورة', 'نوع حاوية', 'أداة إدارة', 'بروتوكول'], 'correct' => [0]], 'explanation' => 'Dockerfile يحدد خطوات بناء صورة Docker.'],
                ['title' => 'الفرق بين Image و Container؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين Image و Container في Docker؟', 'options' => ['Image القالب و Container Instance منه', 'لا يوجد فرق', 'Container أصغر', 'Image للإنتاج فقط'], 'correct' => [0]], 'explanation' => 'Image قالب للقراءة فقط و Container نسخة تشغيل.'],
                ['title' => 'ما هو Docker Compose؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Docker Compose؟', 'options' => ['أداة لإدارة تطبيقات متعددة الحاويات', 'نظام تشغيل', 'قاعدة بيانات', 'أداة نسخ احتياطي'], 'correct' => [0]], 'explanation' => 'Docker Compose لإدارة تطبيقات متعددة الحاويات.'],
                ['title' => 'ما هو Volume في Docker؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Volume في Docker؟', 'options' => ['تخزين بيانات مستمر خارج الحاوية', 'نوع شبكة', 'بروتوكول', 'أداة تحليل'], 'correct' => [0]], 'explanation' => 'Volume يضمن بقاء البيانات خارج الحاوية.'],
                ['title' => 'تعليمات Dockerfile الأساسية.', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي من تعليمات Dockerfile الأساسية؟', 'options' => ['FROM', 'RUN', 'COPY', 'CMD', 'EXPOSE'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع هذه التعليمات أساسية.'],
                ['title' => 'Docker Hub مستودع عام لصور Docker.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'Docker Hub هو مستودع عام لصور Docker.', 'correct' => true], 'explanation' => 'Docker Hub أكبر مستودع لصور Docker.'],
                ['title' => 'ما هو الأمر لتشغيل حاوية Docker؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الأمر المستخدم لتشغيل حاوية Docker؟', 'correct' => 'docker run', 'acceptable_answers' => ['docker run', 'run']], 'explanation' => 'docker run يُنشئ ويشغل حاوية.'],
                ['title' => 'اشرح بناء تطبيق ويب بـ Docker و Docker Compose.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح كيفية بناء تطبيق ويب باستخدام Docker و Docker Compose.', 'rubric' => 'التقييم على: Dockerfile (1) + docker-compose (1) + شبكات (1) + Volumes (1) + خطوات (1).'], 'explanation' => 'يجب شرح خطوات بناء الصور والحاويات.'],
                ['title' => 'أكمل: ______ في Docker لتخزين البيانات المستمرة.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في Docker يُستخدم لتخزين البيانات المستمرة.', 'correct' => 'Volume', 'acceptable_answers' => ['Volume', 'Volumes']], 'explanation' => 'Volume يضمن بقاء البيانات.'],
                ['title' => 'رتّب خطوات بناء صورة Docker.', 'type' => 'ordering', 'difficulty' => 'easy', 'points' => 3, 'content' => ['question' => 'رتّب خطوات بناء صورة Docker بالترتيب الصحيح.', 'items' => ['كتابة Dockerfile', 'docker build', 'docker run', 'docker ps']], 'explanation' => 'تسلسل واضح ومحدد.'],
                ['title' => 'كم عدد أنواع الشبكات الأساسية في Docker؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد أنواع الشبكات الأساسية في Docker؟', 'correct' => 3, 'tolerance' => 0], 'explanation' => 'bridge و host و none.'],
                ['title' => 'اكتب docker-compose.yml لتطبيق Web + Database.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب docker-compose.yml لتطبيق متكامل من Web و Database.', 'language' => 'yaml', 'template' => "version: '3.8'\nservices:\n  # الخدمات هنا", 'solution' => "version: '3.8'\nservices:\n  web:\n    build: .\n    ports:\n      - '3000:3000'\n    depends_on:\n      - db\n    networks:\n      - app-net\n  db:\n    image: postgres:15\n    environment:\n      - POSTGRES_DB=myapp\n    volumes:\n      - db-data:/var/lib/postgresql/data\n    networks:\n      - app-net\nvolumes:\n  db-data:\nnetworks:\n  app-net:\n    driver: bridge"], 'explanation' => 'docker-compose.yml يُستخدم لتعريف التطبيقات المتعددة.'],
            ],
        ];
    }

    private function examLinux(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'linux',
            'exam' => ['title' => 'اختبار Linux الأساسي', 'description' => 'اختبار شامل في نظام Linux من الأوامر إلى إدارة العمليات.', 'duration' => 60, 'passing_score' => 60, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'الأمر لعرض محتويات المجلد الحالي؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الأمر المستخدم لعرض محتويات المجلد الحالي؟', 'options' => ['ls', 'dir', 'show', 'list'], 'correct' => [0]], 'explanation' => 'ls يعرض محتويات المجلد.'],
                ['title' => 'الفرق بين chmod و chown؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين chmod و chown؟', 'options' => ['chmod يغير الصلاحيات و chown يغير المالك', 'لا يوجد فرق', 'chmod للملفات فقط', 'chmod أسرع'], 'correct' => [0]], 'explanation' => 'chmod للصلاحيات و chown للمالك.'],
                ['title' => 'ما هو Pipe في Linux؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الأنبوب (Pipe) في Linux؟', 'options' => ['توجيه مخرجات أمر إلى آخر', 'نوع ملف', 'بروتوكول', 'أداة نسخ'], 'correct' => [0]], 'explanation' => 'الأنبوب (|) يوجّه المخرجات.'],
                ['title' => 'ما هو Cron؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Cron في Linux؟', 'options' => ['جدولة مهام متكررة', 'نوع ملف', 'أداة تحليل', 'بروتوكول'], 'correct' => [0]], 'explanation' => 'Cron لجدولة أوامر دورية.'],
                ['title' => 'أنواع الصلاحيات في Linux.', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي من أنواع الصلاحيات في Linux؟', 'options' => ['Read', 'Write', 'Execute', 'Append', 'Delete'], 'correct' => [0,1,2]], 'explanation' => '3 أنواع أساسية فقط.'],
                ['title' => 'Linux نظام مفتوح المصدر.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'Linux نظام تشغيل مفتوح المصدر.', 'correct' => true], 'explanation' => 'Linux مبني على نواة مفتوحة المصدر.'],
                ['title' => 'الأمر للبحث عن نص في ملف؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الأمر المستخدم للبحث عن نص في ملف في Linux؟', 'correct' => 'grep', 'acceptable_answers' => ['grep', 'find']], 'explanation' => 'grep للبحث عن أنماط نصية.'],
                ['title' => 'إدارة المستخدمين والصلاحيات في Linux.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح إدارة المستخدمين والصلاحيات في Linux بشكل متكامل.', 'rubric' => 'التقييم على: أوامر المستخدمين (2) + الصلاحيات (2) + أفضل الممارسات (1).'], 'explanation' => 'يشمل useradd و chmod و chown.'],
                ['title' => 'أكمل: ______ لعرض العمليات الجارية.', 'type' => 'fill_blank', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في Linux يُستخدم لعرض العمليات الجارية.', 'correct' => 'top', 'acceptable_answers' => ['top', 'htop', 'ps']], 'explanation' => 'top يعرض العمليات واستهلاك الموارد.'],
                ['title' => 'رتّب خطوات تثبيت حزمة في Linux.', 'type' => 'ordering', 'difficulty' => 'easy', 'points' => 3, 'content' => ['question' => 'رتّب خطوات تثبيت حزمة برنامج في Linux.', 'items' => ['sudo apt update', 'sudo apt install package-name', 'sudo apt upgrade']], 'explanation' => 'يجب تحديث القوائم أولاً.'],
                ['title' => 'عدد أنواع الصلاحيات الأساسية؟', 'type' => 'numeric', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'كم عدد أنواع الصلاحيات الأساسية في Linux؟', 'correct' => 3, 'tolerance' => 0], 'explanation' => 'قراءة وكتابة وتنفيذ.'],
                ['title' => 'اكتب shell script لفحص حالة خادم.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب shell script يتحقق من حالة خادم ويُرسل تنبيهاً عند التوقف.', 'language' => 'bash', 'template' => "#!/bin/bash\n# السكربت هنا", 'solution' => "#!/bin/bash\nif ping -c 1 \$1 &>/dev/null; then\n    echo \"Server is up\"\nelse\n    echo \"Server is down\"\n    mail -s \"Alert\" admin@example.com <<< \"Server down\"\nfi"], 'explanation' => 'يجب فحص الاتصال وإرسال تنبيه.'],
            ],
        ];
    }

    private function examRestApi(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'rest-apis',
            'exam' => ['title' => 'اختبار REST APIs', 'description' => 'اختبار شامل في تصميم واجهات برمجة التطبيقات RESTful.', 'duration' => 60, 'passing_score' => 60, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'المبدأ الأساسي لـ REST؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو المبدأ الأساسي لـ REST؟', 'options' => ['تمثيل الحالة عبر HTTP', 'استخدام XML حصريًا', 'التواصل عبر WebSocket', 'قاعدة بيانات موحدة'], 'correct' => [0]], 'explanation' => 'REST يعتمد على تمثيل الحالة عبر HTTP.'],
                ['title' => 'الكود المناسب للإنشاء الناجح؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الكود المناسب لعمليات الإنشاء الناجحة في API؟', 'options' => ['201 Created', '200 OK', '400 Bad Request', '500 Server Error'], 'correct' => [0]], 'explanation' => '201 Created لإنشاء مورد جديد.'],
                ['title' => 'الفرق بين PUT و PATCH؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين PUT و PATCH في REST API؟', 'options' => ['PUT يستبدل بالكامل و PATCH يُحدّث جزئيًا', 'لا يوجد فرق', 'PATCH أسرع', 'PUT للقراءة فقط'], 'correct' => [0]], 'explanation' => 'PUT يستبدل المورد بالكامل.'],
                ['title' => 'ما هو JWT؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو JWT في المصادقة؟', 'options' => ['Token مُوقّع رقميًا', 'بروتوكول اتصال', 'قاعدة بيانات', 'مكتبة JS'], 'correct' => [0]], 'explanation' => 'JWT هو JSON Web Token مُوقّع.'],
                ['title' => 'أكواد الحالة الناجحة في HTTP.', 'type' => 'multiple_choice', 'difficulty' => 'easy', 'points' => 3, 'content' => ['question' => 'أي من التالي من أكواد الحالة الناجحة في HTTP؟', 'options' => ['200', '201', '204', '301', '302'], 'correct' => [0,1,2]], 'explanation' => '200 و 201 و 204 نجاح.'],
                ['title' => 'REST API يجب أن تكون Stateless.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'REST API يجب أن تكون بدون حالة (Stateless).', 'correct' => true], 'explanation' => 'REST يعتمد على Stateless.'],
                ['title' => 'الكود عند عدم العثور على المورد؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الكود المستخدم عند عدم العثور على المورد؟', 'correct' => '404', 'acceptable_answers' => ['404', '404 Not Found']], 'explanation' => '404 Not Found.'],
                ['title' => 'صمم API لإدارة مكتبة.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'صمم API متكامل لإدارة مكتبة مع توثيق شامل.', 'rubric' => 'التقييم على: تصميم الموارد (2) + HTTP methods (1) + أكواد الحالة (1) + المصادقة (1).'], 'explanation' => 'يجب تحديد الموارد والطرق والمصادقة.'],
                ['title' => 'أكمل: ______ لتمثيل الموارد في REST API.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في REST API يُستخدم لتمثيل الموارد.', 'correct' => 'JSON', 'acceptable_answers' => ['JSON', 'xml', 'YAML']], 'explanation' => 'JSON التنسيق الأكثر استخداماً.'],
                ['title' => 'رتّب خطوات المصادقة JWT.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب خطوات عملية المصادقة JWT بالترتيب الصحيح.', 'items' => ['إرسال بيانات الدخول', 'التحقق من الصلاحية', 'إرسال Token', 'استخدام Token', 'تجديد Token']], 'explanation' => 'تسلسل محدد لعملية JWT.'],
                ['title' => 'عدد طرق HTTP الأساسية في REST؟', 'type' => 'numeric', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'كم عدد طرق HTTP الأساسية المستخدمة في REST API؟', 'correct' => 5, 'tolerance' => 0], 'explanation' => 'GET و POST و PUT و DELETE و PATCH.'],
                ['title' => 'اكتب API لإدارة المهام بـ Laravel.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب API كامل لإدارة المهام باستخدام Laravel.', 'language' => 'php', 'template' => "<?php\nnamespace App\\Http\\Controllers\\Api;\nuse Illuminate\\Http\\Request;\nclass TaskController extends Controller\n{\n    // الكود هنا\n}", 'solution' => "<?php\nnamespace App\\Http\\Controllers\\Api;\nuse App\\Models\\Task;\nuse Illuminate\\Http\\Request;\nclass TaskController extends Controller\n{\n    public function index(Request \$r) { return Task::paginate(15); }\n    public function store(Request \$r) {\n        \$v = \$r->validate(['title' => 'required|string']);\n        return Task::create(\$v);\n    }\n    public function show(Task \$t) { return \$t; }\n    public function update(Request \$r, Task \$t) { \$t->update(\$r->validated()); return \$t; }\n    public function destroy(Task \$t) { \$t->delete(); return response()->json(null, 204); }\n}"], 'explanation' => 'API يتبع مبادئ REST مع التحقق.'],
            ],
        ];
    }

    private function examDatabase(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'databases',
            'exam' => ['title' => 'اختبار قواعد البيانات', 'description' => 'اختبار شامل في قواعد البيانات العلائقية والاستعلامات والتحسين.', 'duration' => 75, 'passing_score' => 60, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'المبدأ الأساسي للتطبيع؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو المبدأ الأساسي للتطبيع؟', 'options' => ['تقليل التكرار وتحسين سلامة البيانات', 'زيادة الأعمدة', 'تحسين القراءة فقط', 'تقليل الجداول'], 'correct' => [0]], 'explanation' => 'التطبيع لتقليل التكرار وتحسين السلامة.'],
                ['title' => 'الفرق بين PRIMARY KEY و FOREIGN KEY؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين PRIMARY KEY و FOREIGN KEY؟', 'options' => ['PRIMARY فريد و FOREIGN يربط جدولين', 'لا يوجد فرق', 'PRIMARY للقراءة', 'FOREIGN إلزامي'], 'correct' => [0]], 'explanation' => 'PRIMARY فريد و FOREIGN يربط بجدول آخر.'],
                ['title' => 'ما هو SQL Injection؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو SQL Injection؟', 'options' => ['هجوم يحقن SQL ضار', 'نوع تخزين مؤقت', 'أداة تحسين', 'بروتوكول أمان'], 'correct' => [0]], 'explanation' => 'SQL Injection ثغرة أمنية.'],
                ['title' => 'أنواع Joins في SQL.', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي من أنواع Joins في SQL؟', 'options' => ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN'], 'correct' => [0,1,2,3,4]], 'explanation' => 'SQL يدعم أنواع joins متعددة.'],
                ['title' => 'التطبيع يُوصى به دائماً.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'التطبيع يُوصى به دائمًا في جميع الأحوال.', 'correct' => false], 'explanation' => 'أحيانًا Denormalization أفضل للأداء.'],
                ['title' => 'الفهرسة تُحسّن سرعة الاستعلامات.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'الفهرسة تُحسّن سرعة الاستعلامات.', 'correct' => true], 'explanation' => 'الفهرسة تسرّع البحث.'],
                ['title' => 'الأمر لحذف جميع السجلات؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الاستعلام المستخدم لحذف جميع سجلات جدول؟', 'correct' => 'TRUNCATE TABLE', 'acceptable_answers' => ['TRUNCATE TABLE', 'TRUNCATE']], 'explanation' => 'TRUNCATE أسرع من DELETE.'],
                ['title' => 'الفرق بين SQL و NoSQL.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح الفرق بين SQL و NoSQL مع أفضل الممارسات للاختيار.', 'rubric' => 'التقييم على: SQL (1) + NoSQL (1) + مقارنة (1) + معايير (1) + أمثلة (1).'], 'explanation' => 'SQL علائقية و NoSQL غير مهيكلة.'],
                ['title' => 'أكمل: ______ لتجميع النتائج حسب عمود.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في SQL يُستخدم لتجميع النتائج حسب عمود معين.', 'correct' => 'GROUP BY', 'acceptable_answers' => ['GROUP BY', 'group by']], 'explanation' => 'GROUP BY مع Aggregate Functions.'],
                ['title' => 'رتّب مراحل تصميم قاعدة البيانات.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب مراحل تصميم قاعدة البيانات بالترتيب الصحيح.', 'items' => ['جمع المتطلبات', 'تصميم العلاقات', 'إنشاء Schema', 'الفهرسة', 'التحسين']], 'explanation' => 'تسلسل منطقي واضح.'],
                ['title' => 'مستويات التطبيع الأساسية؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد مستويات التطبيع الأساسية؟', 'correct' => 3, 'tolerance' => 0], 'explanation' => '1NF و 2NF و 3NF.'],
                ['title' => 'اكتب استعلام SQL معقد لجلب أعلى المستخدمين نشاطاً.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب استعلام SQL لجلب أكثر 10 مستخدمين نشاطاً.', 'language' => 'sql', 'template' => "-- الاستعلام هنا\nSELECT\nFROM\nWHERE\nGROUP BY\nORDER BY\nLIMIT", 'solution' => "SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\nWHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)\nGROUP BY u.id, u.name, u.email\nHAVING order_count > 0\nORDER BY total_spent DESC\nLIMIT 10;"], 'explanation' => 'يجب استخدام JOIN و GROUP BY و HAVING.'],
            ],
        ];
    }

    private function examGit(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'git',
            'exam' => ['title' => 'اختبار Git المتقدم', 'description' => 'اختبار شامل في نظام التحكم في الإصدارات Git.', 'duration' => 45, 'passing_score' => 65, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو Git؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو Git؟', 'options' => ['نظام التحكم في الإصدارات الموزع', 'قاعدة بيانات', 'لغة برمجة', 'نظام تشغيل'], 'correct' => [0]], 'explanation' => 'Git نظام التحكم في الإصدارات الموزع.'],
                ['title' => 'الفرق بين git merge و git rebase؟', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين git merge و git rebase؟', 'options' => ['merge يحافظ على التاريخ و rebase يعيد كتابته', 'لا يوجد فرق', 'merge أسرع', 'rebase للخوادم فقط'], 'correct' => [0]], 'explanation' => 'merge يُنشئ commit دمج و rebase يعيد كتابة التاريخ.'],
                ['title' => 'ما هو Git Stash؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Git Stash؟', 'options' => ['حفظ التغييرات مؤقتاً بدون commit', 'نوع فرع', 'أداة تحليل', 'بروتوكول'], 'correct' => [0]], 'explanation' => 'stash يحفظ التغييرات مؤقتاً.'],
                ['title' => 'Git يدعم العمل بدون إنترنت.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'Git يدعم العمل بدون اتصال بالإنترنت.', 'correct' => true], 'explanation' => 'Git نظام موزع يسمح بالعمل محلياً.'],
                ['title' => 'الأمر لإنشاء فرع جديد والتحول إليه؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو الأمر المستخدم لإنشاء فرع جديد والتحول إليه؟', 'correct' => 'git checkout -b', 'acceptable_answers' => ['git checkout -b', 'git switch -c']], 'explanation' => 'checkout -b يُنشئ فرع جديد وينتقل.'],
                ['title' => 'اشرح Git Flow workflow.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح Git Flow workflow مع أفضل الممارسات.', 'rubric' => 'التقييم على: الفروع (2) + دورة الحياة (2) + أفضل الممارسات (1).'], 'explanation' => 'Git Flow لإدارة الإصدارات بشكل منظم.'],
                ['title' => 'أكمل: ______ لمقارنة التغييرات قبل الـ commit.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ في Git يُستخدم لمقارنة التغييرات قبل الـ commit.', 'correct' => 'git diff', 'acceptable_answers' => ['git diff', 'diff']], 'explanation' => 'git diff يعرض التغييرات غير المحفوظة.'],
                ['title' => 'رتّب خطوات Git Flow لإصدار جديد.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب خطوات Git Flow لإصدار جديد.', 'items' => ['git flow release start', 'إجراء التغييرات', 'git flow release finish', 'git push --all']], 'explanation' => 'تسلسل محدد لـ Git Flow.'],
                ['title' => 'عدد أوامر Git الأساسية؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد أوامر Git الأساسية تقريباً؟', 'correct' => 12, 'tolerance' => 3], 'explanation' => 'حوالي 12-15 أمراً أساسياً.'],
                ['title' => 'اكتب سكربت نسخ احتياطي تلقائي لمشروع Git.', 'type' => 'coding', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اكتب سكربت bash لننسخ احتياطي تلقائي من مشروع Git.', 'language' => 'bash', 'template' => "#!/bin/bash\n# السكربت هنا", 'solution' => "#!/bin/bash\nREPO=\"/path/to/repo\"\nBACKUP=\"/path/to/backups\"\nDATE=\$(date +%Y%m%d_%H%M%S)\ncd \$REPO\ngit archive --format=zip HEAD -o \"\$BACKUP/backup_\$DATE.zip\"\nfind \$BACKUP -name 'backup_*.zip' -mtime +30 -delete\necho \"Backup done: backup_\$DATE.zip\""], 'explanation' => 'يجب استخدام git archive للنسخ الاحتياطي.'],
            ],
        ];
    }

    private function examTesting(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'testing',
            'exam' => ['title' => 'اختبار اختبار البرمجيات', 'description' => 'اختبار شامل في منهجيات وأدوات اختبار البرمجيات.', 'duration' => 60, 'passing_score' => 60, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'الفرق بين اختبار الوحدة والتكامل؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين اختبار الوحدة و اختبار التكامل؟', 'options' => ['الوحدة يختبر المكونات المنفردة والتكامل يختبر التفاعل', 'لا يوجد فرق', 'التكامل أسرع', 'الوحدة للدليل فقط'], 'correct' => [0]], 'explanation' => 'الوحدة لدالة منفردة والتكامل للتفاعل.'],
                ['title' => 'ما هو TDD؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو TDD؟', 'options' => ['Test-Driven Development', 'Test Data Design', 'Total Debug Development', 'Testing Design Document'], 'correct' => [0]], 'explanation' => 'TDD يبدأ بكتابة الاختبارات قبل الكود.'],
                ['title' => 'الغرض من اختبار الت回归؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الغرض الرئيسي من اختبار الت回归؟', 'options' => ['التأكد من عدم كسر التغييرات للوظائف الحالية', 'اختبار الأداء', 'اختبار الأمان', 'اختبار الواجهة'], 'correct' => [0]], 'explanation' => 'اختبار الت回归 يتحقق من عدم تأثير التغييرات.'],
                ['title' => 'أنواع الاختبارات.', 'type' => 'multiple_choice', 'difficulty' => 'easy', 'points' => 3, 'content' => ['question' => 'أي من التالي من أنواع الاختبارات؟', 'options' => ['Unit Testing', 'Integration Testing', 'Functional Testing', 'Performance Testing', 'Security Testing'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع هذه الأنواع معترف بها.'],
                ['title' => 'اختبار الوحدة يجب أن يكون مستقلاً.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'اختبار الوحدة يجب أن يكون مستقلاً عن الأطر الأخرى.', 'correct' => true], 'explanation' => 'الاختبار الجيد لا يعتمد على خدمات خارجية.'],
                ['title' => 'التكرار المستخدم في TDD؟', 'type' => 'short_answer', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو التكرار المستخدم في TDD؟', 'correct' => 'Red-Green-Refactor', 'acceptable_answers' => ['Red-Green-Refactor', 'AAA']], 'explanation' => 'TDD يستخدم Red-Green-Refactor.'],
                ['title' => 'أهمية اختبار الت回归.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح أهمية اختبار الت回归 في دورة حياة تطوير البرمجيات.', 'rubric' => 'التقييم على: المفهوم (1) + الأهمية (1) + الأدوات (1) + أفضل الممارسات (1) + أمثلة (1).'], 'explanation' => 'اختبار الت回归 يضمن استقرار البرمجيات.'],
                ['title' => 'أكمل: ______ مبدأ اختبار يُكتب فيه الاختبارات أولاً.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ هو مبدأ اختبار يكتب فيه الاختبارات أولاً.', 'correct' => 'TDD', 'acceptable_answers' => ['TDD', 'Test-Driven Development']], 'explanation' => 'TDD يبدأ بالاختبارات.'],
                ['title' => 'رتّب مراحل TDD.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب مراحل TDD بالترتيب الصحيح.', 'items' => ['كتابة اختبار يفشل', 'كتابة كود يلبي الاختبار', 'تحسين الكود', 'تشغيل الاختبار']], 'explanation' => 'Red-Green-Refactor بالترتيب.'],
                ['title' => 'عدد مبادئ SOLID المؤثرة على الاختبار؟', 'type' => 'numeric', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'كم عدد مبادئ SOLID التي تؤثر على قابلية اختبار الكود؟', 'correct' => 5, 'tolerance' => 0], 'explanation' => 'جميع مبادئ SOLID الخمسة.'],
            ],
        ];
    }

    private function examSystemDesign(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'system-design',
            'exam' => ['title' => 'اختبار تصميم الأنظمة', 'description' => 'اختبار شامل في مبادئ تصميم الأنظمة القابلة للتوسع.', 'duration' => 90, 'passing_score' => 65, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو التوسع الأفقي؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو التوسع الأفقي (Horizontal Scaling)؟', 'options' => ['إضافة مزيد من الآلات', 'تحسين المعالج الحالي', 'زيادة الذاكرة', 'تحسين الشبكة'], 'correct' => [0]], 'explanation' => 'التوسع الأفقي إضافة خوادم إضافية.'],
                ['title' => 'ما هو التوازن فيحمولة (Load Balancing)؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Load Balancing؟', 'options' => ['توزيع الحمل على عدة خوادم', 'تخزين مؤقت للبيانات', 'نسخ احتياطي', 'مراقبة الأداء'], 'correct' => [0]], 'explanation' => 'Load Balancing يوزّع الطلبات على الخوادم.'],
                ['title' => 'ما هو التخزين المؤقت (Caching)؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو التخزين المؤقت؟', 'options' => ['تخزين نسخة من البيانات للوصول السريع', 'قاعدة بيانات رئيسية', 'نسخ احتياطي', 'بروتوكول أمان'], 'correct' => [0]], 'explanation' => 'Caching يسرّع الوصول للبيانات المتكررة.'],
                ['title' => 'مبادئ تصميم الأنظمة القابلة للتوسع.', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'أي من التالي من مبادئ تصميم الأنظمة القابلة للتوسع؟', 'options' => ['High Availability', 'Fault Tolerance', 'Scalability', 'Performance', 'Security'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع هذه المبادئ أساسية.'],
                ['title' => 'الـ ACID في قواعد البيانات.', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'ما هي خصائص ACID في قواعد البيانات؟', 'options' => ['Atomicity', 'Consistency', 'Isolation', 'Durability', 'Availability'], 'correct' => [0,1,2,3]], 'explanation' => 'ACID: الذرة والمتسقة والعزل والمتانة.'],
                ['title' => 'التوسع الأفقي أفضل من الرأسي دائماً.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'التوسع الأفقي أفضل من التوسع الرأسي في جميع الأحوال.', 'correct' => false], 'explanation' => 'يعتمد على نوع الحمل والمتطلبات.'],
                ['title' => 'ما هو CAP Theorem؟', 'type' => 'short_answer', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو CAP Theorem في تصميم الأنظمة الموزعة؟', 'correct' => 'Consistency, Availability, Partition tolerance', 'acceptable_answers' => ['CAP', 'Consistency Availability Partition tolerance']], 'explanation' => 'CAP ينص على أن النظام لا يحقق الثلاث معاً.'],
                ['title' => 'صمم نظام لتدفق عمل المهام (Task Management System).', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'صمم نظام متكامل لإدارة المهام مع مراعاة التوسع.', 'rubric' => 'التقييم على: المعمارية (2) + قاعدة البيانات (1) + التوسع (1) + الأمان (1).'], 'explanation' => 'يجب تحديد المكونات وقاعدة البيانات واستراتيجية التوسع.'],
                ['title' => 'أكمل: ______ هو توزيع الحمل على عدة خوادم.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ هو توزيع الحمل على عدة خوادم.', 'correct' => 'Load Balancing', 'acceptable_answers' => ['Load Balancing', 'Load Balancer']], 'explanation' => 'Load Balancing يوزّع الطلبات.'],
                ['title' => 'رتّب مراحل تصميم نظام قابل للتوسع.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب مراحل تصميم نظام قابل للتوسع.', 'items' => ['تحديد المتطلبات', 'تصميم المعمارية', 'اختيار التقنيات', 'التنفيذ', 'الاختبار والتحسين']], 'explanation' => 'تسلسل واضح لتصميم النظام.'],
                ['title' => 'كم عدد خصائص ACID؟', 'type' => 'numeric', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'كم عدد خصائص ACID في قواعد البيانات؟', 'correct' => 4, 'tolerance' => 0], 'explanation' => 'Atomicity و Consistency و Isolation و Durability.'],
            ],
        ];
    }

    private function examCyberSecurity(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'cyber-security',
            'exam' => ['title' => 'اختبار الأمن السيبراني', 'description' => 'اختبار شامل في مبادئ حماية الأنظمة والشبكات من الهجمات.', 'duration' => 75, 'passing_score' => 65, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو اختراق الحساب (Phishing)؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو Phishing؟', 'options' => ['هجوم يتسلل عبر رسائل مزيفة للحصول على بيانات', 'نوع فيروس', 'أداة تشفير', 'بروتوكول أمان'], 'correct' => [0]], 'explanation' => 'Phishing يُستخدم لسرقة البيانات عبر رسائل مزيفة.'],
                ['title' => 'ما هو HTTPS؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو HTTPS؟', 'options' => ['HTTP مع تشفير SSL/TLS', 'بروتوكول غير آمن', 'قاعدة بيانات', 'أداة تحليل'], 'correct' => [0]], 'explanation' => 'HTTPS HTTP مع تشفير TLS.'],
                ['title' => 'ما هو Firewall؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Firewall؟', 'options' => ['جدار حماية يمنع الوصول غير المصرح به', 'فيروس', 'أداة نسخ', 'قاعدة بيانات'], 'correct' => [0]], 'explanation' => 'Firewall يفحص حركة المرور ويمنع غير المصرح به.'],
                ['title' => 'مبادئ الأمان السيبراني الأساسية.', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي من مبادئ الأمان السيبراني؟', 'options' => ['Confidentiality', 'Integrity', 'Availability', 'Authentication', 'Non-repudiation'], 'correct' => [0,1,2,3,4]], 'explanation' => 'مبادئ CIA plus Authentication و Non-repudiation.'],
                ['title' => 'التشفير ضروري لحماية البيانات الحساسة.', 'type' => 'true_false', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'التشفير ضروري لحماية البيانات الحساسة.', 'correct' => true], 'explanation' => 'التشفير يحمي البيانات من الوصول غير المصرح به.'],
                ['title' => 'ما هو التوكن (Token) في المصادقة؟', 'type' => 'short_answer', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو التوكن (Token) في المصادقة؟', 'correct' => 'رمز رقمي يُستخدم للتحقق من هوية المستخدم', 'acceptable_answers' => ['Token', 'jwt', 'access token']], 'explanation' => 'التوكن رمز رقمي يثبت الهوية.'],
                ['title' => 'اشرح كيف يحمي التشفير البيانات أثناء النقل.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح كيف يحمي التشفير البيانات أثناء النقل والتخزين.', 'rubric' => 'التقييم على: شرح التشفير (2) + أنواع التشفير (1) + أفضل الممارسات (1) + أمثلة (1).'], 'explanation' => 'التشفير يُحوّل البيانات إلى صيغة غير مقروءة.'],
                ['title' => 'أكمل: ______ هو جدار الحماية للشبكات.', 'type' => 'fill_blank', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'أكمل: ______ هو جدار الحماية للشبكات.', 'correct' => 'Firewall', 'acceptable_answers' => ['Firewall', 'جدار الحماية']], 'explanation' => 'Firewall يمنع الوصول غير المصرح به.'],
                ['title' => 'رتّب خطوات الاستجابة لاختراق أمني.', 'type' => 'ordering', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'رتّب خطوات الاستجابة لاختراق أمني.', 'items' => ['اكتشاف الاختراق', 'احتواء الخطر', 'إزالة التهديد', 'التعافي', 'التحليل والتحسين']], 'explanation' => 'تسلسل محدد للاستجابة الأمنية.'],
                ['title' => 'عدد مبادئ CIA الأساسية؟', 'type' => 'numeric', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'كم عدد مبادئ CIA الأساسية في الأمان؟', 'correct' => 3, 'tolerance' => 0], 'explanation' => 'Confidentiality و Integrity و Availability.'],
            ],
        ];
    }

    private function examNetworking(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'networking',
            'exam' => ['title' => 'اختبار الشبكات', 'description' => 'اختبار شامل في أساسيات اتصالات الشبكات والبروتوكولات.', 'duration' => 60, 'passing_score' => 60, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو نموذج OSI؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو نموذج OSI (Open Systems Interconnection)؟', 'options' => ['نموذج يقسم الاتصالات إلى7 طبقات', 'نوع بروتوكول', 'أداة تحليل', 'قاعدة بيانات'], 'correct' => [0]], 'explanation' => 'OSI يقسم الاتصالات إلى 7 طبقات.'],
                ['title' => 'ما هو TCP/IP؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو TCP/IP؟', 'options' => ['بروتوكول نقل البيانات/IP', 'نوع شبكة', 'أداة أمان', 'قاعدة بيانات'], 'correct' => [0]], 'explanation' => 'TCP/IP بروتوكول أساسي للإنترنت.'],
                ['title' => 'ما هو DNS؟', 'type' => 'single_choice', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو DNS؟', 'options' => ['نظام تحويل أسماء النطاقات إلى عناوين IP', 'نوع بروتوكول نقل', 'أداة أمان', 'قاعدة بيانات'], 'correct' => [0]], 'explanation' => 'DNS يُحوّل أسماء المواقع إلى عناوين IP.'],
                ['title' => 'بروتوكولات الشبكات الأساسية.', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي من بروتوكولات الشبكات الأساسية؟', 'options' => ['HTTP', 'FTP', 'SMTP', 'SSH', 'DNS'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع هذه البروتوكولات أساسية.'],
                ['title' => 'TCP بروتوكول غير موثوق (Unreliable).', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'TCP بروتوكول غير موثوق (Unreliable).', 'correct' => false], 'explanation' => 'TCP بروتوكول موثوق يضمن وصول البيانات.'],
                ['title' => 'ما هو DHCP؟', 'type' => 'short_answer', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'ما هو DHCP في الشبكات؟', 'correct' => 'Dynamic Host Configuration Protocol', 'acceptable_answers' => ['DHCP', 'Dynamic Host Configuration Protocol']], 'explanation' => 'DHCP يُعيّن عناوين IP تلقائياً.'],
                ['title' => 'اشرح نموذج OSI مع وظيفة كل طبقة.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح نموذج OSI مع وظيفة كل طبقة.', 'rubric' => 'التقييم على: الشرح (2) + الطبقات (2) + أمثلة (1).'], 'explanation' => '7 طبقات من Physical إلى Application.'],
                ['title' => 'أكمل: ______ يُحوّل أسماء المواقع إلى عناوين IP.', 'type' => 'fill_blank', 'difficulty' => 'easy', 'points' => 2, 'content' => ['question' => 'أكمل: ______ يُحوّل أسماء المواقع إلى عناوين IP.', 'correct' => 'DNS', 'acceptable_answers' => ['DNS', 'نظام أسماء النطاقات']], 'explanation' => 'DNS خدمة تحويل أسماء النطاقات.'],
                ['title' => 'رتّب طبقات نموذج OSI من الأسفل للأعلى.', 'type' => 'ordering', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'رتّب طبقات نموذج OSI من الأسفل للأعلى.', 'items' => ['Physical', 'Data Link', 'Network', 'Transport', 'Application']], 'explanation' => 'من الفيزيائية إلى التطبيق.'],
                ['title' => 'عدد طبقات نموذج OSI؟', 'type' => 'numeric', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'كم عدد طبقات نموذج OSI؟', 'correct' => 7, 'tolerance' => 0], 'explanation' => '7 طبقات في نموذج OSI.'],
            ],
        ];
    }

    private function examCleanArchitecture(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'clean-architecture',
            'exam' => ['title' => 'اختبار المعمارية النظيفة', 'description' => 'اختبار شامل في مبادئ المعمارية النظيفة وفصل المسؤوليات.', 'duration' => 75, 'passing_score' => 65, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'من هو مؤسس المعمارية النظيفة؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'من هو مؤسس مفهوم المعمارية النظيفة (Clean Architecture)؟', 'options' => ['Robert C. Martin (Uncle Bob)', 'Martin Fowler', 'Eric Evans', 'Grady Booch'], 'correct' => [0]], 'explanation' => 'Robert C. Martin صاحب كتاب Clean Architecture.'],
                ['title' => 'ما هي قاعدة الاعتماد (Dependency Rule)؟', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هي قاعدة الاعتماد في المعمارية النظيفة؟', 'options' => ['الكود يعتمد من الداخل للخارج فقط', 'لا يمكن استخدام المكتبات الخارجية', 'جميع الطبقات متساوية', 'قاعدة البيانات هي المركز'], 'correct' => [0]], 'explanation' => 'الكود الأعمى يعتمد على الكود الأقل عمى.'],
                ['title' => 'طبقات المعمارية النظيفة.', 'type' => 'multiple_choice', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'أي من التالي من طبقات المعمارية النظيفة؟', 'options' => ['Entities', 'Use Cases', 'Interface Adapters', 'Frameworks & Drivers', 'Presentation'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميع الطبقات الخمس.'],
                ['title' => 'الكيانات (Entities) تمثل قواعد الأعمال الأساسية.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'الكيانات (Entities) تمثل قواعد الأعمال الأساسية للمؤسسة.', 'correct' => true], 'explanation' => 'الكيانات تمثل أنظمة القواعد الأساسية.'],
                ['title' => 'ما هو Use Case؟', 'type' => 'short_answer', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Use Case في المعمارية النظيفة؟', 'correct' => 'سيناريو يصف تفاعل المستخدم مع النظام', 'acceptable_answers' => ['Use Case', 'سيناريو']], 'explanation' => 'Use Case يحدد سلوك النظام.'],
                ['title' => 'اشرح قاعدة الاعتماد وتأثيرها على التصميم.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح قاعدة الاعتماد وتأثيرها على تصميم النظام.', 'rubric' => 'التقييم على: شرح القاعدة (2) + التطبيق (1) + الفوائد (1) + أمثلة (1).'], 'explanation' => 'قاعدة الاعتماد تحمي الطبقات الداخلية من التغيير.'],
                ['title' => 'أكمل: ______ تمثل قواعد الأعمال الأساسية.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ تمثل قواعد الأعمال الأساسية في المعمارية النظيفة.', 'correct' => 'Entities', 'acceptable_answers' => ['Entities', 'الكيانات']], 'explanation' => 'الكيانات هي الطبقة الأساسية.'],
                ['title' => 'رتّب الطبقات من الداخل للخارج.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب طبقات المعمارية النظيفة من الداخل للخارج.', 'items' => ['Entities', 'Use Cases', 'Interface Adapters', 'Frameworks & Drivers', 'External Agencies']], 'explanation' => 'من الأعمى إلى الأكثر تأثيراً بالتغيير.'],
                ['title' => 'عدد طبقات المعمارية النظيفة؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'كم عدد الطبقات في معمارية Uncle Bob؟', 'correct' => 5, 'tolerance' => 0], 'explanation' => '5 طبقات principales.'],
            ],
        ];
    }

    private function examMicroservices(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'microservices',
            'exam' => ['title' => 'اختبار الخدمات المصغرة', 'description' => 'اختبار شامل في بناء وتصميم الأنظمة الموزعة المصغرة.', 'duration' => 90, 'passing_score' => 65, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'الفرق بين المعمارية المصغرة والمُوحَّدة؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو الفرق بين المعمارية المصغرة والمُوحَّدة؟', 'options' => ['المصغرة مستقلة النشر والمُوحَّدة متكاملة', 'لا يوجد فرق', 'المصغرة أبطأ', 'المُوحَّدة أسهل في الصيانة'], 'correct' => [0]], 'explanation' => 'المصغرة يمكن نشرها بشكل مستقل.'],
                ['title' => 'ما هو Event-Driven Architecture؟', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو Event-Driven Architecture؟', 'options' => ['نمط يتفاعل مع الأحداث', 'قاعدة بيانات', 'بروتوكول أمان', 'أداة نسخ'], 'correct' => [0]], 'explanation' => 'Event-Driven يستجيب للأحداث.'],
                ['title' => 'ما هو API Gateway؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو API Gateway؟', 'options' => ['بوابة توحد الطلبات للخدمات', 'قاعدة بيانات', 'أداة أمان', 'بروتوكول نقل'], 'correct' => [0]], 'explanation' => 'API Gateway يُوحّد نقاط الوصول.'],
                ['title' => 'تحديات الخدمات المصغرة.', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'أي من التالي من تحديات الخدمات المصغرة؟', 'options' => ['Complexity', 'Data Consistency', 'Network Latency', 'Testing', 'Deployment'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميعها تحديات معترف بها.'],
                ['title' => 'الاتصال الآني بين الخدمات هو الأفضل دائماً.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'الاتصال الآني (Synchronous) بين الخدمات هو الأفضل دائماً.', 'correct' => false], 'explanation' => 'يعتمد على الحالة، الأحداث أفضل للفصل.'],
                ['title' => 'ما هو Service Mesh؟', 'type' => 'short_answer', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو Service Mesh؟', 'correct' => 'طبقة تواصل بين الخدمات المصغرة', 'acceptable_answers' => ['Service Mesh', 'طبقة تواصل']], 'explanation' => 'Service Mesh يدير الاتصال بين الخدمات.'],
                ['title' => 'اشرح متى تستخدم المعمارية المصغرة.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح متى تستخدم المعمارية المصغرة ومتى تستخدم المعمارية المُوحَّدة.', 'rubric' => 'التقييم على: شرح المصغرة (1) + شرح المُوحَّدة (1) + مقارنة (1) + أمثلة (1) + توصيات (1).'], 'explanation' => 'المصغرة للأنظمة الكبيرة والمُوحَّدة للصغيرة.'],
                ['title' => 'أكمل: ______ هو البوابة التي توحد طلبات العميل.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ هو البوابة التي توحد طلبات العميل للخدمات المصغرة.', 'correct' => 'API Gateway', 'acceptable_answers' => ['API Gateway', 'بوابة API']], 'explanation' => 'API Gateway نقطة دخول موحدة.'],
                ['title' => 'رتّب خطوات تحويل من معمارية مُوحَّدة إلى مصغرة.', 'type' => 'ordering', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'رتّب خطوات تحويل من معمارية مُوحَّدة إلى مصغرة.', 'items' => ['تحليل النظام الحالي', 'تحديد الخدمات', 'فصل الخدمات', 'إعداد الت_infra', 'الاختبار والنشر']], 'explanation' => 'تسلسل واضح للتحول.'],
                ['title' => 'عدد أنماط الاتصال الأساسية في المصغرة؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد أنماط الاتصال الأساسية في المصغرة (Sync + Async)؟', 'correct' => 2, 'tolerance' => 0], 'explanation' => 'Sync (HTTP/gRPC) و Async (Events/Queues).'],
            ],
        ];
    }

    private function examLaravelAdvanced(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'laravel',
            'exam' => ['title' => 'اختبار Laravel المتقدم', 'description' => 'اختبار متقدم في Laravel يشمل التوسع والأداء والأمان.', 'duration' => 75, 'passing_score' => 70, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو Lazy Loading؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Lazy Loading في Eloquent؟', 'options' => ['تحميل العلاقات عند الحاجة فقط', 'تحميل كل العلاقات مسبقاً', 'نوع من التخزين المؤقت', 'بروتوكول نقل'], 'correct' => [0]], 'explanation' => 'Lazy Loading يُحمّل العلاقات عند الوصول لها.'],
                ['title' => 'ما هو N+1 Query Problem؟', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو N+1 Query Problem؟', 'options' => ['استعلام رئيسي + استعلامات فرعية كثيرة', 'نوع فيروس', 'خطأ في القاعدة', 'مشكلة في الشبكة'], 'correct' => [0]], 'explanation' => 'N+1 يسبب استعلامات كثيرة غير ضرورية.'],
                ['title' => 'ما هو Eager Loading؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Eager Loading في Laravel؟', 'options' => ['تحميل العلاقات مسبقاً مع الاستعلام الرئيسي', 'تحميل البيانات عند الطلب', 'نوع من التخزين', 'بروتوكول أمان'], 'correct' => [0]], 'explanation' => 'Eager Loading يُحمّل العلاقات في استعلام واحد.'],
                ['title' => 'أدوات تحسين أداء Laravel.', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'أي من التالي من أدوات تحسين أداء Laravel؟', 'options' => ['Queue', 'Cache', 'Event Broadcasting', 'Task Scheduling', 'Database Indexing'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميعها أدوات معترف بها.'],
                ['title' => 'استخدام Soft Deletes لا يؤثر على الأداء.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'استخدام Soft Deletes لا يؤثر على أداء الاستعلامات.', 'correct' => false], 'explanation' => 'Soft Deletes تضيف شرط where على deleted_at.'],
                ['title' => 'ما هو Event Sourcing؟', 'type' => 'short_answer', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو Event Sourcing في Laravel؟', 'correct' => 'نمط يخزن كل التغييرات كأحداث متسلسلة', 'acceptable_answers' => ['Event Sourcing', 'تخزين الأحداث']], 'explanation' => 'Event Sourcing يخزن كل حالة كحدث.'],
                ['title' => 'اشرح كيفية تحسين أداة Laravel للمواقع الكبيرة.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح كيفية تحسين أداء Laravel للمواقع الكبيرة.', 'rubric' => 'التقييم على: التخزين المؤقت (1) + القوائم (1) + قاعدة البيانات (1) + الحزم (1) + مراقبة (1).'], 'explanation' => 'يجب استخدام cache و queues و indexing.'],
                ['title' => 'أكمل: ______ يُحمّل العلاقات في استعلام واحد.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ يُحمّل العلاقات في استعلام واحد لتجنب N+1.', 'correct' => 'Eager Loading', 'acceptable_answers' => ['Eager Loading', 'with()']], 'explanation' => 'with() يستخدم Eager Loading.'],
                ['title' => 'رتّب خطوات تحسين أداء Laravel.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب خطوات تحسين أداء Laravel.', 'items' => ['تحديد نقاط العجز', 'تطبيق التخزين المؤقت', 'تحسين الاستعلامات', 'استخدام القوائم', 'مراقبة النتائج']], 'explanation' => 'تسلسل منطقي لتحسين الأداء.'],
                ['title' => 'عدد أنواع العلاقات في Eloquent؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد أنواع العلاقات الأساسية في Eloquent؟', 'correct' => 4, 'tolerance' => 0], 'explanation' => 'One-to-One, One-to-Many, Many-to-Many, HasManyThrough + Polymorphic.'],
            ],
        ];
    }

    private function examReactAdvanced(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'react',
            'exam' => ['title' => 'اختبار React المتقدم', 'description' => 'اختبار متقدم في React يشمل الأداء والأنماط المتقدمة.', 'duration' => 75, 'passing_score' => 70, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو React.memo؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو React.memo؟', 'options' => ['أداة لمنع إعادة الرسم غير الضرورية', 'نوع من State', 'مكتبة للمسارات', 'أداة أمان'], 'correct' => [0]], 'explanation' => 'React.memo يُحسّن الأداء بتخزين المؤقت.'],
                ['title' => 'ما هو useMemo؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو useMemo؟', 'options' => ['يخزن نتيجة حساب ثقيل', 'يُنشئ State', 'يُدير التمريرات', 'يُحسّن الشبكة'], 'correct' => [0]], 'explanation' => 'useMemo يُحسّن الحسابات الثقيلة.'],
                ['title' => 'ما هو useCallback؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو useCallback؟', 'options' => ['يخزن مرجع الدالة', 'يُنشئ State', 'يُدير المسارات', 'يُحسّن الأمان'], 'correct' => [0]], 'explanation' => 'useCallback يخزن مرجع الدالة.'],
                ['title' => 'أدوات تحسين أداء React.', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'أي من التالي من أدوات تحسين أداء React؟', 'options' => ['React.memo', 'useMemo', 'useCallback', 'Code Splitting', 'Lazy Loading'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميعها أدوات تحسين أداء.'],
                ['title' => 'Re-render يحدث دائماً عند تغيير Parent.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'Re-render يحدث دائماً عند تغيير Parent Component.', 'correct' => false], 'explanation' => 'React.memo يمكنه منع إعادة الرسم.'],
                ['title' => 'ما هو Virtual DOM؟', 'type' => 'short_answer', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Virtual DOM في React؟', 'correct' => 'نسخة خفيفة من DOM الحقيقي', 'acceptable_answers' => ['Virtual DOM', 'DOM افتراضي']], 'explanation' => 'Virtual DOM يُحسّن الأداء بالمقارنة.'],
                ['title' => 'اشرح كيف يُحسّن React.memo الأداء.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح كيف يعمل React.memo وكيف يُحسّن الأداء.', 'rubric' => 'التقييم على: آلية العمل (2) + مثال (1) +حدود (1) + أفضل الممارسات (1).'], 'explanation' => 'React.memo يخزن النتيجة ويمنع إعادة الرسم.'],
                ['title' => 'أكمل: ______ يخزين نتيجة حساب ثقيل.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ يخزين نتيجة حساب ثقيل لتجنب إعادة الحساب.', 'correct' => 'useMemo', 'acceptable_answers' => ['useMemo', 'React.memo']], 'explanation' => 'useMemo للحسابات الثقيلة.'],
                ['title' => 'رتّب خطوات تحسين أداء مكون React.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب خطوات تحسين أداء مكون React.', 'items' => ['تحليل الأداء', 'تطبيق React.memo', 'استخدام useMemo', 'استخدام useCallback', 'اختبار النتائج']], 'explanation' => 'تسلسل منطقي لتحسين الأداء.'],
                ['title' => 'عدد أنواع الـ Hooks الأساسية؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد Hooks الأساسية في React (useState + useEffect + useContext + useRef + useMemo + useCallback)؟', 'correct' => 6, 'tolerance' => 0], 'explanation' => '6 hooks أساسية في React.'],
            ],
        ];
    }

    private function examDockerAdvanced(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'docker',
            'exam' => ['title' => 'اختبار Docker المتقدم', 'description' => 'اختبار متقدم في Docker يشمل الشبكات والأ volumes والإنتاج.', 'duration' => 75, 'passing_score' => 70, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو Docker Swarm؟', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو Docker Swarm؟', 'options' => ['مدير للحاويات الموزعة', 'بروتوكول أمان', 'قاعدة بيانات', 'أداة نسخ'], 'correct' => [0]], 'explanation' => 'Docker Swarm يدير مجموعة من الحاويات.'],
                ['title' => 'الفرق بين Bind Mount و Volume؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما الفرق بين Bind Mount و Volume؟', 'options' => ['Volume يديره Docker و Bind Mount مسار خارجي', 'لا يوجد فرق', 'Bind Mount أمان', 'Volume أسرع'], 'correct' => [0]], 'explanation' => 'Volume آمن ومدعوم رسمياً.'],
                ['title' => 'ما هو Docker Compose؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو Docker Compose؟', 'options' => ['أداة تشغيل حاويات متعددة', 'بروتوكول نقل', 'قاعدة بيانات', 'أداة أمان'], 'correct' => [0]], 'explanation' => 'Docker Compose يُدير تطبيقات متعددة.'],
                ['title' => 'أدوات Docker المتقدمة.', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'أي من التالي من أدوات Docker المتقدمة؟', 'options' => ['Docker Compose', 'Docker Swarm', 'Docker Networks', 'Docker Secrets', 'Docker Configs'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميعها أدوات Docker المتقدمة.'],
                ['title' => 'Docker Secrets يخزن كلمات المرور كنص عادي.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'Docker Secrets يخزن كلمات المرور كنص عادي في Dockerfile.', 'correct' => false], 'explanation' => 'Secrets مشفرة ولا تُخزن كنص عادي.'],
                ['title' => 'ما هو Multi-stage Build؟', 'type' => 'short_answer', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو Multi-stage Build في Docker؟', 'correct' => 'بناء صورة بمراحل لتقليل الحجم', 'acceptable_answers' => ['Multi-stage Build', 'بناء متعدد المراحل']], 'explanation' => 'Multi-stage Build يُقلل حجم الصورة النهائية.'],
                ['title' => 'اشرح كيفية تحسين Dockerfile للإنتاج.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح كيفية تحسين Dockerfile للإنتاج.', 'rubric' => 'التقييم على: تقليل الحجم (2) + الأمان (1) + الأداء (1) + أفضل الممارسات (1).'], 'explanation' => 'يجب استخدام multi-stage و non-root user.'],
                ['title' => 'أكمل: ______ أداة تشغيل حاويات متعددة.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ أداة تشغيل حاويات متعددة بملف تكوين واحد.', 'correct' => 'Docker Compose', 'acceptable_answers' => ['Docker Compose', 'Compose']], 'explanation' => 'Compose يُدير تطبيقات متعددة.'],
                ['title' => 'رتّب خطوات إعداد Docker للإنتاج.', 'type' => 'ordering', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'رتّب خطوات إعداد Docker للإنتاج.', 'items' => ['كتابة Dockerfile', 'تحسين الصورة', 'إعداد Compose', 'تكوين الشبكات', 'النشر والمراقبة']], 'explanation' => 'تسلسل منطقي للإعداد.'],
                ['title' => 'عدد أنواع الشبكات في Docker؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد أنواع الشبكات الأساسية في Docker؟', 'correct' => 3, 'tolerance' => 0], 'explanation' => 'bridge و host و none.'],
            ],
        ];
    }

    private function examLinuxAdvanced(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'linux',
            'exam' => ['title' => 'اختبار Linux المتقدم', 'description' => 'اختبار متقدم في Linux يشمل الإدارة المتقدمة والأمان.', 'duration' => 75, 'passing_score' => 70, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'ما هو systemctl؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو systemctl؟', 'options' => ['مدير خدمات systemd', 'أداة نسخ', 'أداة أمان', 'قاعدة بيانات'], 'correct' => [0]], 'explanation' => 'systemctl يدير خدمات systemd.'],
                ['title' => 'ما هو cgroup؟', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو cgroup في Linux؟', 'options' => ['Control Groups لتقييد موارد العمليات', 'نوع من الشبكات', 'أداة نسخ', 'قاعدة بيانات'], 'correct' => [0]], 'explanation' => 'cgroup تقييد موارد العمليات.'],
                ['title' => 'ما هو journald؟', 'type' => 'single_choice', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو journald في Linux؟', 'options' => ['نظام تسجيل systemd', 'أداة أمان', 'قاعدة بيانات', 'بروتوكول نقل'], 'correct' => [0]], 'explanation' => 'journald يسجل أحداث النظام.'],
                ['title' => 'أدوات إدارة Linux المتقدمة.', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'أي من التالي من أدوات إدارة Linux المتقدمة؟', 'options' => ['systemctl', 'journalctl', 'firewalld', 'SELinux', 'Auditd'], 'correct' => [0,1,2,3,4]], 'explanation' => 'جميعها أدوات إدارة متقدمة.'],
                ['title' => 'SELinux يمكن تعطيله في الإنتاج.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'يمكن تعطيل SELinux في بيئة الإنتاج.', 'correct' => false], 'explanation' => 'SELinux يُنصح بإبقائه مفعلاً للأمان.'],
                ['title' => 'ما هو LVM؟', 'type' => 'short_answer', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو LVM في Linux؟', 'correct' => 'Logical Volume Manager لإدارة الأقراص', 'acceptable_answers' => ['LVM', 'Logical Volume Manager']], 'explanation' => 'LVM يُدير الأقراص المرنة.'],
                ['title' => 'اشرح إدارة الموارد في Linux.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'اشرح كيفية إدارة موارد الخادم في Linux.', 'rubric' => 'التقييم على: الموارد (2) + المراقبة (1) + التحسين (1) + الأمان (1).'], 'explanation' => 'يجب استخدام cgroups و monitoring.'],
                ['title' => 'أكمل: ______ يسجل أحداث النظام في Linux.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ يسجل أحداث النظام في Linux.', 'correct' => 'journalctl', 'acceptable_answers' => ['journalctl', 'journald']], 'explanation' => 'journalctl يعرض سجلات systemd.'],
                ['title' => 'رتّب خطوات إعداد خادم Linux للإنتاج.', 'type' => 'ordering', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'رتّب خطوات إعداد خادم Linux للإنتاج.', 'items' => ['تثبيت النظام', 'تحديث الحزم', 'تكوين الشبكة', 'إعداد الجدار الناري', 'تفعيل المراقبة']], 'explanation' => 'تسلسل منطقي للإعداد.'],
                ['title' => 'عدد أنواع الأنظمة الملفات الشائعة في Linux؟', 'type' => 'numeric', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'كم عدد أنواع الأنظمة الملفات الشائعة (ext4, xfs, btrfs)؟', 'correct' => 3, 'tolerance' => 0], 'explanation' => 'ext4 و xfs و btrfs.'],
            ],
        ];
    }

    private function examFullStack(array $c): array
    {
        return [
            'categories' => $c, 'categorySlug' => 'databases',
            'exam' => ['title' => 'اختبار المعمارية النظيفة المتقدمة', 'description' => 'اختبار متقدم في المعمارية النظيفة والتكامل.', 'duration' => 90, 'passing_score' => 70, 'attempt_limit' => 3],
            'questions' => [
                ['title' => 'التكامل بين الواجهة والخادم.', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما هو التكامل الصحيح بين REST API و React؟', 'options' => ['useEffect مع fetch/axios', '直接 DOM manipulation', 'global state only', 'iframe'], 'correct' => [0]], 'explanation' => 'useEffect + fetch هو النمط الصحيح.'],
                ['title' => 'REST vs GraphQL.', 'type' => 'single_choice', 'difficulty' => 'hard', 'points' => 2, 'content' => ['question' => 'ما الفرق الرئيسي بين REST و GraphQL؟', 'options' => ['GraphQL يُحدد العميل المخرجات', 'REST أحدث', 'GraphQL بدون schema', 'REST يدعم subscriptions'], 'correct' => [0]], 'explanation' => 'GraphQL يُمكّن العميل من تحديد البيانات.'],
                ['title' => 'JWT في Full Stack.', 'type' => 'multiple_choice', 'difficulty' => 'hard', 'points' => 3, 'content' => ['question' => 'أي من التالي من مكونات JWT في Full Stack؟', 'options' => ['Header', 'Payload', 'Signature', 'Cookie', 'Refresh Token'], 'correct' => [0,1,2,3,4]], 'explanation' => 'JWT يشمل هذه المكونات.'],
                ['title' => 'الحالة في الواجهة يجب أن تكون مشتركة دائماً.', 'type' => 'true_false', 'difficulty' => 'medium', 'points' => 1, 'content' => ['question' => 'حالة الواجهة يجب أن تكون مشتركة دائماً.', 'correct' => false], 'explanation' => 'بعض الحالة محلية فقط.'],
                ['title' => 'ما هو State Management؟', 'type' => 'short_answer', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'ما هو State Management في Full Stack؟', 'correct' => 'إدارة حالة التطبيق عبر الطبقات', 'acceptable_answers' => ['State Management', 'إدارة الحالة']], 'explanation' => 'State Management يُدير بيانات التطبيق.'],
                ['title' => 'صمم تطبيق Full Stack مع Laravel و React.', 'type' => 'essay', 'difficulty' => 'hard', 'points' => 5, 'content' => ['question' => 'صمم تطبيق Full Stack مع Laravel و React و Docker.', 'rubric' => 'التقييم على: المعمارية (2) + قاعدة البيانات (1) + الواجهة (1) + النشر (1).'], 'explanation' => 'يجب تحديد المكونات والتكامل والنشر.'],
                ['title' => 'أكمل: ______ يُحدد مخرجات GraphQL من العميل.', 'type' => 'fill_blank', 'difficulty' => 'medium', 'points' => 2, 'content' => ['question' => 'أكمل: ______ يُحدد مخرجات GraphQL من العميل.', 'correct' => 'Query', 'acceptable_answers' => ['Query', 'GraphQL Query']], 'explanation' => 'Query يُحدد ما يطلبه العميل.'],
                ['title' => 'رتّب خطوات بناء تطبيق Full Stack.', 'type' => 'ordering', 'difficulty' => 'medium', 'points' => 3, 'content' => ['question' => 'رتّب خطوات بناء تطبيق Full Stack.', 'items' => ['تصميم المعمارية', 'بناء API', 'بناء الواجهة', 'التكامل', 'الاختبار والنشر']], 'explanation' => 'تسلسل منطقي للبناء.'],
                ['title' => 'عدد مكونات JWT الأساسية؟', 'type' => 'numeric', 'difficulty' => 'easy', 'points' => 1, 'content' => ['question' => 'كم عدد مكونات JWT الأساسية؟', 'correct' => 3, 'tolerance' => 0], 'explanation' => 'Header و Payload و Signature.'],
            ],
        ];
    }
}

