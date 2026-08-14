<?php

namespace Database\Seeders;

use App\Models\EducationalStage;
use App\Models\News;
use App\Models\Tenant;
use App\Support\DefaultRolePermissions;
use Illuminate\Database\Seeder;

class IdentityAccessSeeder extends Seeder
{
    public function run(): void
    {
        DefaultRolePermissions::syncAllTenants();

        Tenant::query()->each(function (Tenant $tenant): void {
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
            'مرحباً بك في أكاديمية '.$tenant->name.' 🎓',
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
}
