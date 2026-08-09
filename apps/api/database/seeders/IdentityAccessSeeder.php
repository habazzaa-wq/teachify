<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\News;
use App\Models\EducationalStage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class IdentityAccessSeeder extends Seeder
{
    /**
     * @var array<string, list<string>>
     */
    private array $rolePermissions = [
        'tenant_owner' => [
            'tenant.manage',
            'news.manage',
            'stages.manage',
            'subjects.manage',
            'users.view',
            'users.invite',
            'users.manage',
            'roles.view',
            'roles.assign',
            'permissions.manage',
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
            'categories.restore',
            'categories.feature',
            'categories.activate',
            'courses.view',
            'courses.create',
            'courses.update',
            'courses.publish',
            'courses.archive',
            'courses.assign_instructors',
            'courses.manage_settings',
            'enrollments.view',
            'enrollments.manage',
            'analytics.view',
            'modules.view',
            'modules.create',
            'modules.update',
            'modules.delete',
            'modules.publish',
            'modules.archive',
            'modules.feature',
            'modules.reorder',
            'sections.view',
            'sections.create',
            'sections.update',
            'sections.delete',
            'sections.publish',
            'sections.feature',
            'sections.reorder',
            'lessons.view',
            'lessons.create',
            'lessons.update',
            'lessons.delete',
            'lessons.publish',
            'lessons.archive',
            'lessons.feature',
            'lessons.reorder',
            'questions.view',
            'questions.create',
            'questions.update',
            'questions.delete',
            'questions.publish',
            'questions.archive',
            'questions.restore',
            'exams.view',
            'exams.create',
            'exams.update',
            'exams.delete',
            'exams.publish',
            'exams.archive',
            'exams.restore',
            'banks.view',
            'banks.create',
            'banks.update',
            'banks.delete',
            'banks.archive',
            'banks.restore',
            'question-categories.view',
            'question-categories.create',
            'question-categories.update',
            'question-categories.delete',
            'question-categories.restore',
            'media.view',
            'media.create',
            'media.update',
            'media.delete',
            'media.upload',
            'media.download',
            'media.archive',
            'media.manage',
            'seo.view',
            'seo.create',
            'seo.update',
            'seo.publish',
            'seo.delete',
            'seo.manage_settings',
        ],
        'admin' => [
            'users.view',
            'users.invite',
            'users.manage',
            'roles.view',
            'roles.assign',
            'permissions.manage',
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
            'categories.restore',
            'categories.feature',
            'categories.activate',
            'courses.view',
            'courses.create',
            'courses.update',
            'courses.publish',
            'courses.archive',
            'courses.assign_instructors',
            'courses.manage_settings',
            'enrollments.view',
            'enrollments.manage',
            'analytics.view',
            'modules.view',
            'modules.create',
            'modules.update',
            'modules.delete',
            'modules.publish',
            'modules.archive',
            'modules.feature',
            'modules.reorder',
            'sections.view',
            'sections.create',
            'sections.update',
            'sections.delete',
            'sections.publish',
            'sections.feature',
            'sections.reorder',
            'lessons.view',
            'lessons.create',
            'lessons.update',
            'lessons.delete',
            'lessons.publish',
            'lessons.archive',
            'lessons.feature',
            'lessons.reorder',
            'questions.view',
            'questions.create',
            'questions.update',
            'questions.delete',
            'questions.publish',
            'questions.archive',
            'questions.restore',
            'exams.view',
            'exams.create',
            'exams.update',
            'exams.delete',
            'exams.publish',
            'exams.archive',
            'exams.restore',
            'banks.view',
            'banks.create',
            'banks.update',
            'banks.delete',
            'banks.archive',
            'banks.restore',
            'question-categories.view',
            'question-categories.create',
            'question-categories.update',
            'question-categories.delete',
            'question-categories.restore',
            'news.manage',
            'stages.manage',
            'subjects.manage',
            'media.view',
            'media.create',
            'media.update',
            'media.delete',
            'media.upload',
            'media.download',
            'media.archive',
            'media.manage',
            'seo.view',
            'seo.create',
            'seo.update',
            'seo.publish',
            'seo.delete',
            'seo.manage_settings',
        ],
        'instructor' => [
            'categories.view',
            'courses.view',
            'courses.create',
            'courses.update',
            'enrollments.view',
            'analytics.view',
            'modules.view',
            'modules.create',
            'modules.update',
            'modules.reorder',
            'sections.view',
            'sections.create',
            'sections.update',
            'sections.reorder',
            'lessons.view',
            'lessons.create',
            'lessons.update',
            'questions.view',
            'questions.create',
            'questions.update',
            'exams.view',
            'exams.create',
            'exams.update',
            'banks.view',
            'question-categories.view',
            'media.view',
            'media.upload',
            'media.download',
            'seo.view',
            'seo.create',
            'seo.update',
        ],
        'student' => [
            'categories.view',
            'courses.view',
            'enrollments.view',
            'modules.view',
            'sections.view',
            'lessons.view',
            'exams.view',
            'banks.view',
            'question-categories.view',
            'media.view',
        ],
    ];

    public function run(): void
    {
        $permissions = collect($this->allPermissionSlugs())
            ->mapWithKeys(fn (string $slug) => [
                $slug => Permission::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => Str::headline(str_replace('.', ' ', $slug)),
                        'description' => null,
                    ],
                ),
            ]);

        Tenant::query()->each(function (Tenant $tenant) use ($permissions): void {
            foreach ($this->rolePermissions as $roleSlug => $permissionSlugs) {
                $role = Role::updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'slug' => $roleSlug,
                    ],
                    [
                        'name' => Str::headline(str_replace('_', ' ', $roleSlug)),
                    ],
                );

                $role->permissions()->sync(
                    $permissions->only($permissionSlugs)->pluck('id')->all(),
                );
            }

            $this->seedDemoNews($tenant);
            $this->seedDemoStages($tenant);
        });
    }

    /**
     * Add a few realistic educational stages so the homepage section has
     * content out of the box. Skipped when the tenant already has stages.
     */
    private function seedDemoStages(Tenant $tenant): void
    {
        // The EducationalStage model auto-sets tenant_id from the current
        // tenant context, so we must bind it here (seeders run outside a request).
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        if (EducationalStage::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $samples = [
            [
                'name' => 'رياض الأطفال',
                'description' => 'أساس متين لعالم التعلم عبر اللعب والأنشطة الحركية التي تنمّي الذكاء والإبداع لدى الطفل.',
                'image' => 'https://picsum.photos/seed/kindergarten-stage/800/500',
                'sort_order' => 0,
            ],
            [
                'name' => 'المرحلة الابتدائية',
                'description' => 'بناء المهارات الأساسية في القراءة والكتابة والحساب بأسلوب شائق يناسب الصفوف الأولى.',
                'image' => 'https://picsum.photos/seed/primary-stage/800/500',
                'sort_order' => 1,
            ],
            [
                'name' => 'المرحلة الإعدادية',
                'description' => 'تعزيز الفهم وتوسيع المدارك عبر مواد متنوعة تؤسّس لشخصية الطالب وقدراته البحثية.',
                'image' => 'https://picsum.photos/seed/preparatory-stage/800/500',
                'sort_order' => 2,
            ],
            [
                'name' => 'المرحلة الثانوية',
                'description' => 'التحصّص الأكاديمي والاستعداد الجاد للمرحلة الجامعية وشهادات المعادلة بثقة وكفاءة.',
                'image' => 'https://picsum.photos/seed/secondary-stage/800/500',
                'sort_order' => 3,
            ],
        ];

        foreach ($samples as $index => $sample) {
            EducationalStage::create([
                'tenant_id' => $tenant->id,
                'name' => $sample['name'],
                'description' => $sample['description'],
                'image' => $sample['image'],
                'link' => null,
                'is_active' => true,
                'sort_order' => $sample['sort_order'],
            ]);
        }
    }

    /**
     * Add a few sample headlines so the homepage news ticker has content
     * out of the box. Skipped when the tenant already has news.
     */
    private function seedDemoNews(Tenant $tenant): void
    {
        // The News model auto-sets tenant_id from the current tenant context,
        // so we must bind it here (seeders run outside a request).
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        if (News::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $samples = [
            'مرحباً بك في أكاديمية ' . $tenant->name . ' 🎓',
            'ابدأ رحلتك التعليمية اليوم مع أحدث الدورات التفاعلية',
            'تابع تقدّمك خطوة بخطوة واحصل على شهادات معتمدة',
            'مدرّبون خبراء في انتظارك لاكتشاف أفضل ما لديك',
        ];

        foreach ($samples as $index => $title) {
            News::create([
                'tenant_id' => $tenant->id,
                'title' => $title,
                'is_active' => true,
                'sort_order' => $index,
            ]);
        }
    }

    /**
     * @return list<string>
     */
    private function allPermissionSlugs(): array
    {
        return collect($this->rolePermissions)
            ->flatten()
            ->unique()
            ->values()
            ->all();
    }
}
