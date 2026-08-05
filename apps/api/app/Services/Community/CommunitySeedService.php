<?php

namespace App\Services\Community;

use App\Models\CommunityCategory;
use App\Models\CommunityChannel;
use App\Models\Tenant;
use Illuminate\Support\Str;

class CommunitySeedService
{
    /**
     * Default category definitions matching the product spec. Each category
     * gets one default channel with the same slug; question categories allow
     * threaded Q&A.
     *
     * @var array<int, array<string, mixed>>
     */
    private const DEFAULT_CATEGORIES = [
        [
            'slug' => 'announcements',
            'name' => '📢 Announcements',
            'description' => 'Official announcements from teachers and administrators.',
            'icon' => 'megaphone',
            'sort_order' => 1,
            'allows_questions' => false,
            'moderator_only' => true,
            'channel_type' => 'announcements',
        ],
        [
            'slug' => 'questions',
            'name' => '❓ Questions',
            'description' => 'Ask and answer questions about lessons and exams.',
            'icon' => 'help',
            'sort_order' => 2,
            'allows_questions' => true,
            'moderator_only' => false,
            'channel_type' => 'qna',
        ],
        [
            'slug' => 'homework-help',
            'name' => '📝 Homework Help',
            'description' => 'Get help with assignments and homework.',
            'icon' => 'pencil',
            'sort_order' => 3,
            'allows_questions' => true,
            'moderator_only' => false,
            'channel_type' => 'qna',
        ],
        [
            'slug' => 'study-tips',
            'name' => '💡 Study Tips',
            'description' => 'Share study methods, resources and habits.',
            'icon' => 'lightbulb',
            'sort_order' => 4,
            'allows_questions' => false,
            'moderator_only' => false,
            'channel_type' => 'general',
        ],
        [
            'slug' => 'general-discussion',
            'name' => '🎯 General Discussion',
            'description' => 'Talk about anything related to your courses.',
            'icon' => 'chat',
            'sort_order' => 5,
            'allows_questions' => false,
            'moderator_only' => false,
            'channel_type' => 'general',
        ],
        [
            'slug' => 'top-students',
            'name' => '🏆 Top Students',
            'description' => 'Leaderboard and top contributor highlights.',
            'icon' => 'trophy',
            'sort_order' => 6,
            'allows_questions' => false,
            'moderator_only' => false,
            'channel_type' => 'general',
        ],
        [
            'slug' => 'off-topic',
            'name' => '🎉 Off Topic',
            'description' => 'Relaxed conversations beyond academics.',
            'icon' => 'party',
            'sort_order' => 7,
            'allows_questions' => false,
            'moderator_only' => false,
            'channel_type' => 'general',
        ],
        [
            'slug' => 'resources',
            'name' => '📚 Resources',
            'description' => 'Shared files, PDFs and helpful links.',
            'icon' => 'book',
            'sort_order' => 8,
            'allows_questions' => false,
            'moderator_only' => false,
            'channel_type' => 'resources',
        ],
    ];

    public function __construct(
        private readonly CommunitySettingService $settings,
    ) {}

    /**
     * Idempotently create default categories/channels and settings for a tenant.
     *
     * @return array{ categories_created: int, channels_created: int }
     */
    public function seed(Tenant $tenant): array
    {
        $this->bindTenant($tenant);

        $this->settings->forTenant($tenant);

        $categoriesCreated = 0;
        $channelsCreated = 0;

        foreach (self::DEFAULT_CATEGORIES as $definition) {
            $slug = Str::slug($definition['slug']);

            $category = CommunityCategory::query()
                ->where('tenant_id', $tenant->id)
                ->where('slug', $slug)
                ->first();

            if ($category === null) {
                $category = CommunityCategory::create([
                    'tenant_id' => $tenant->id,
                    'slug' => $slug,
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'icon' => $definition['icon'],
                    'sort_order' => $definition['sort_order'],
                    'is_default' => true,
                    'allows_questions' => $definition['allows_questions'],
                    'moderator_only' => $definition['moderator_only'],
                    'status' => 'active',
                ]);
                $categoriesCreated++;
            }

            $channelSlug = $slug;

            $channel = CommunityChannel::query()
                ->where('tenant_id', $tenant->id)
                ->where('slug', $channelSlug)
                ->first();

            if ($channel === null) {
                CommunityChannel::create([
                    'tenant_id' => $tenant->id,
                    'category_id' => $category->id,
                    'slug' => $channelSlug,
                    'name' => $definition['name'],
                    'description' => $definition['description'],
                    'type' => $definition['channel_type'],
                    'sort_order' => $definition['sort_order'],
                    'status' => 'active',
                    'is_locked' => false,
                    'is_pinned' => false,
                    'allows_questions' => $definition['allows_questions'],
                ]);
                $channelsCreated++;
            }
        }

        return [
            'categories_created' => $categoriesCreated,
            'channels_created' => $channelsCreated,
        ];
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
