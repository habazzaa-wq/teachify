<?php

namespace App\Services\ExamBank;

use App\Models\Question;
use App\Models\QuestionCategory;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuestionService
{
    public function create(Tenant $tenant, TenantUser $creator, array $data): Question
    {
        return DB::transaction(function () use ($tenant, $creator, $data): Question {
            $isImage = ($data['question_format'] ?? 'text') === 'image';
            $title = $data['title'] ?? ($isImage ? 'سؤال ممسوح' : null);

            $question = Question::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $creator->id,
                'uuid' => \Illuminate\Support\Str::uuid(),
                'category_id' => $data['category_id'] ?? null,
                'bank_id' => $data['bank_id'] ?? null,
                'title' => $title,
                'slug' => $this->uniqueSlug($data['slug'] ?? $title ?? 'untitled'),
                'description' => $data['description'] ?? null,
                'type' => $data['type'],
                'difficulty' => $data['difficulty'] ?? 'medium',
                'tags' => $data['tags'] ?? null,
                'points' => $data['points'] ?? 1,
                'estimated_time' => $data['estimated_time'] ?? null,
                'language' => $data['language'] ?? 'ar',
                'status' => 'draft',
                'visibility' => $data['visibility'] ?? 'private',
                'shuffle_options' => $data['shuffle_options'] ?? true,
                'explanation' => $data['explanation'] ?? null,
                'hint' => $data['hint'] ?? null,
                'content' => $data['content'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'question_format' => $data['question_format'] ?? 'text',
                'media_asset_id' => $data['media_asset_id'] ?? null,
            ]);

            return $question->refresh();
        });
    }

    public function update(Tenant $tenant, Question $question, array $data): Question
    {
        return DB::transaction(function () use ($tenant, $question, $data): Question {
            if (array_key_exists('slug', $data)) {
                $data['slug'] = $this->uniqueSlug($data['slug'], $question);
            }

            if (array_key_exists('category_id', $data) && $data['category_id'] !== null) {
                $this->assertCategory($tenant, (int) $data['category_id']);
            }

            if (array_key_exists('bank_id', $data) && $data['bank_id'] !== null) {
                $this->assertBank($tenant, (int) $data['bank_id']);
            }

            $question->fill(collect($data)->only([
                'category_id', 'bank_id', 'title', 'slug', 'description', 'type',
                'difficulty', 'tags', 'points', 'estimated_time', 'language',
                'visibility', 'shuffle_options', 'explanation', 'hint', 'content', 'metadata',
                'question_format', 'media_asset_id',
            ])->all())->save();

            return $question->refresh();
        });
    }

    public function changeStatus(Question $question, string $status): Question
    {
        $allowed = [
            'draft' => ['published', 'archived'],
            'published' => ['draft', 'archived'],
            'archived' => ['draft', 'published'],
        ];

        if (! in_array($status, $allowed[$question->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition question from {$question->status} to {$status}."],
            ]);
        }

        $question->forceFill(['status' => $status])->save();

        return $question->refresh();
    }

    public function publish(Question $question): Question
    {
        return $this->changeStatus($question, 'published');
    }

    public function archive(Question $question): Question
    {
        return $this->changeStatus($question, 'archived');
    }

    public function restore(Question $question): Question
    {
        $question->forceFill(['status' => 'draft'])->save();

        return $question->refresh();
    }

    public function createCategory(Tenant $tenant, TenantUser $creator, array $data): QuestionCategory
    {
        $data['tenant_id'] = $tenant->id;
        $data['created_by_tenant_user_id'] = $creator->id;
        $data['slug'] = $this->uniqueCategorySlug($data['slug'] ?? $data['name']);
        $data['status'] = $data['status'] ?? 'active';

        return QuestionCategory::create($data);
    }

    public function updateCategory(Tenant $tenant, QuestionCategory $category, array $data): QuestionCategory
    {
        if (array_key_exists('slug', $data)) {
            $data['slug'] = $this->uniqueCategorySlug($data['slug'], $category);
        }

        $category->fill(collect($data)->only([
            'name', 'slug', 'description', 'color', 'icon', 'parent_id', 'sort_order', 'status',
        ])->all())->save();

        return $category->refresh();
    }

    public function changeCategoryStatus(QuestionCategory $category, string $status): QuestionCategory
    {
        $allowed = [
            'active' => ['inactive', 'archived'],
            'inactive' => ['active', 'archived'],
            'archived' => ['active', 'inactive'],
        ];

        if (! in_array($status, $allowed[$category->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition question category from {$category->status} to {$status}."],
            ]);
        }

        $category->forceFill(['status' => $status])->save();

        return $category->refresh();
    }

    public function archiveCategory(QuestionCategory $category): QuestionCategory
    {
        return $this->changeCategoryStatus($category, 'archived');
    }

    public function restoreCategory(QuestionCategory $category): QuestionCategory
    {
        $category->forceFill(['status' => 'active'])->save();

        return $category->refresh();
    }

    private function uniqueCategorySlug(string $value, ?QuestionCategory $ignore = null): string
    {
        $slug = \Illuminate\Support\Str::slug($value);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => ['The category slug is invalid.'],
            ]);
        }

        $query = QuestionCategory::query()->where('slug', $slug)->where('tenant_id', currentTenant()->id);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            $slug .= '-' . substr((string) \Illuminate\Support\Str::uuid(), 0, 8);
        }

        return $slug;
    }

    public function duplicate(Question $question, TenantUser $creator): Question
    {
        return DB::transaction(function () use ($question, $creator): Question {
            $copy = $question->replicate();
            $copy->created_by_tenant_user_id = $creator->id;
            $copy->uuid = (string) \Illuminate\Support\Str::uuid();
            $copy->slug = $this->uniqueSlug($question->title . '-copy');
            $copy->status = 'draft';

            // Don't share the scan MediaAsset between original and duplicate.
            if ($copy->question_format === 'image') {
                $copy->media_asset_id = null;
            }

            $copy->save();

            return $copy->refresh();
        });
    }

    private function assertCategory(Tenant $tenant, int $categoryId): void
    {
        $exists = QuestionCategory::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $categoryId)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'category_id' => ['The selected category is invalid for this tenant.'],
            ]);
        }
    }

    private function assertBank(Tenant $tenant, int $bankId): void
    {
        $exists = \App\Models\QuestionBank::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $bankId)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'bank_id' => ['The selected question bank is invalid for this tenant.'],
            ]);
        }
    }

    private function uniqueSlug(string $value, ?Question $ignore = null): string
    {
        $slug = \Illuminate\Support\Str::slug($value);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => ['The question slug is invalid.'],
            ]);
        }

        $query = Question::query()->where('slug', $slug)->where('tenant_id', currentTenant()->id);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            $slug .= '-' . substr((string) \Illuminate\Support\Str::uuid(), 0, 8);
        }

        return $slug;
    }
}
