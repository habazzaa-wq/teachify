<?php

namespace App\Services\ExamBank;

use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\QuestionCategory;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuestionService
{
    public function __construct(
        private readonly ExamCacheService $cache = new ExamCacheService(),
    ) {}

    public function create(Tenant $tenant, TenantUser $creator, array $data): Question
    {
        return DB::transaction(function () use ($tenant, $creator, $data): Question {
            $contentDocument = isset($data['content_document']) && is_string($data['content_document']) && trim($data['content_document']) !== ''
                ? json_decode($data['content_document'], true)
                : ($data['content_document'] ?? null);

            $format = $contentDocument !== null
                ? 'structured'
                : ($data['question_format'] ?? 'text');

            $title = trim((string) ($data['title'] ?? ''));
            if ($title === '') {
                $title = match ($format) {
                    'image' => 'سؤال مصوّر',
                    'structured' => 'سؤال مستورد',
                    default => 'سؤال بدون عنوان',
                };
            }
            $slugSource = trim((string) ($data['slug'] ?? ''));
            if ($slugSource === '') {
                $slugSource = in_array($format, ['image', 'structured'], true)
                    ? $title.'-'.strtolower(\Illuminate\Support\Str::random(6))
                    : $title;
            }
            $question = Question::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $creator->id,
                'uuid' => \Illuminate\Support\Str::uuid(),
                'category_id' => $data['category_id'] ?? null,
                'bank_id' => $data['bank_id'] ?? null,
                'title' => $title,
                'slug' => $this->uniqueSlug($slugSource),
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
                'content_document' => $contentDocument,
                'metadata' => $data['metadata'] ?? null,
                'question_format' => $format,
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
                'visibility', 'shuffle_options', 'explanation', 'hint', 'content',
                'metadata', 'question_format',
            ])->all());

            if (array_key_exists('content_document', $data)) {
                $document = $data['content_document'];

                $question->content_document = is_string($document) && trim($document) !== ''
                    ? json_decode($document, true)
                    : (is_array($document) ? $document : null);

                // Keep format consistent with the presence of a document.
                if ($question->content_document !== null && ($question->question_format ?? 'text') === 'text') {
                    $question->question_format = 'structured';
                } elseif ($question->content_document === null && $question->question_format === 'structured') {
                    $question->question_format = 'text';
                }
            }

            $question->save();

            $this->bumpExamsForQuestion($question);

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

        $this->bumpExamsForQuestion($question);

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

        $this->bumpExamsForQuestion($question);

        return $question->refresh();
    }

    /**
     * Invalidate every exam cache that references this question. Only published
     * exams actually serve cached question content, but bumping all referenced
     * exams is harmless and keeps the version counter authoritative.
     */
    private function bumpExamsForQuestion(Question $question): void
    {
        $examIds = ExamQuestion::query()
            ->where('tenant_id', $question->tenant_id)
            ->where('question_id', $question->id)
            ->pluck('exam_id')
            ->unique()
            ->all();

        foreach ($examIds as $examId) {
            $this->cache->bump($question->tenant_id, (int) $examId);
        }
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
