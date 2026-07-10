<?php

namespace App\Services\ExamBank;

use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\QuestionCategory;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExamService
{
    public function create(Tenant $tenant, TenantUser $creator, array $data): Exam
    {
        return DB::transaction(function () use ($tenant, $creator, $data): Exam {
            if (! empty($data['category'])) {
                $data['category'] = $this->resolveCategory($tenant, (string) $data['category'], $creator);
            }

            $exam = Exam::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $creator->id,
                'uuid' => \Illuminate\Support\Str::uuid(),
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($data['slug'] ?? $data['title']),
                'description' => $data['description'] ?? null,
                'category' => $data['category'] ?? null,
                'status' => 'draft',
                'visibility' => $data['visibility'] ?? 'private',
                'language' => $data['language'] ?? 'ar',
                'duration' => $data['duration'] ?? null,
                'passing_score' => $data['passing_score'] ?? 60,
                'total_points' => 0,
                'question_count' => 0,
                'attempt_limit' => $data['attempt_limit'] ?? null,
                'shuffle_questions' => $data['shuffle_questions'] ?? false,
                'shuffle_choices' => $data['shuffle_choices'] ?? false,
                'show_results' => $data['show_results'] ?? true,
                'show_correct_answers' => $data['show_correct_answers'] ?? true,
                'allow_review' => $data['allow_review'] ?? true,
                'negative_marking' => $data['negative_marking'] ?? false,
                'certificate_eligible' => $data['certificate_eligible'] ?? false,
                'random_question_pool' => $data['random_question_pool'] ?? null,
                'pinned' => $data['pinned'] ?? false,
                'featured' => $data['featured'] ?? false,
            ]);

            return $exam->refresh();
        });
    }

    public function update(Tenant $tenant, Exam $exam, array $data): Exam
    {
        return DB::transaction(function () use ($tenant, $exam, $data): Exam {
            if (array_key_exists('slug', $data)) {
                $data['slug'] = $this->uniqueSlug($data['slug'], $exam);
            }

            if (array_key_exists('category', $data) && ! empty($data['category'])) {
                $data['category'] = $this->resolveCategory($tenant, (string) $data['category']);
            }

            $exam->fill(collect($data)->only([
                'title', 'slug', 'description', 'category', 'visibility', 'language',
                'duration', 'passing_score', 'attempt_limit', 'shuffle_questions',
                'shuffle_choices', 'show_results', 'show_correct_answers',
                'allow_review', 'negative_marking', 'certificate_eligible',
                'random_question_pool', 'pinned', 'featured',
            ])->all())->save();

            return $exam->refresh();
        });
    }

    public function changeStatus(Exam $exam, string $status): Exam
    {
        $allowed = [
            'draft' => ['published', 'archived'],
            'published' => ['draft', 'archived'],
            'archived' => ['draft', 'published'],
        ];

        if (! in_array($status, $allowed[$exam->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition exam from {$exam->status} to {$status}."],
            ]);
        }

        $updates = ['status' => $status];

        if ($status === 'published') {
            $updates['published_at'] = now();
            $updates['archived_at'] = null;
        }

        if ($status === 'archived') {
            $updates['archived_at'] = now();
        }

        if ($status === 'draft') {
            $updates['archived_at'] = null;
        }

        $exam->forceFill($updates)->save();

        return $exam->refresh();
    }

    public function publish(Exam $exam): Exam
    {
        return $this->changeStatus($exam, 'published');
    }

    public function archive(Exam $exam): Exam
    {
        return $this->changeStatus($exam, 'archived');
    }

    public function restore(Exam $exam): Exam
    {
        $exam->forceFill(['status' => 'draft', 'archived_at' => null])->save();

        return $exam->refresh();
    }

    public function duplicate(Exam $exam, TenantUser $creator): Exam
    {
        return DB::transaction(function () use ($exam, $creator): Exam {
            $copy = $exam->replicate();
            $copy->created_by_tenant_user_id = $creator->id;
            $copy->uuid = (string) \Illuminate\Support\Str::uuid();
            $copy->slug = $this->uniqueSlug($exam->title . '-copy');
            $copy->status = 'draft';
            $copy->pinned = false;
            $copy->featured = false;
            $copy->published_at = null;
            $copy->archived_at = null;
            $copy->save();

            $links = $exam->examQuestions()->get();
            foreach ($links as $link) {
                ExamQuestion::create([
                    'tenant_id' => $exam->tenant_id,
                    'created_by_tenant_user_id' => $creator->id,
                    'exam_id' => $copy->id,
                    'question_id' => $link->question_id,
                    'section' => $link->section,
                    'order' => $link->order,
                    'points' => $link->points,
                ]);
            }

            $this->recompute($copy);

            return $copy->refresh();
        });
    }

    public function addQuestion(Exam $exam, int $questionId, ?string $section = null, ?int $points = null): Exam
    {
        return DB::transaction(function () use ($exam, $questionId, $section, $points): Exam {
            $question = Question::query()
                ->where('tenant_id', $exam->tenant_id)
                ->where('id', $questionId)
                ->firstOrFail();

            $exists = ExamQuestion::query()
                ->where('exam_id', $exam->id)
                ->where('question_id', $question->id)
                ->exists();

            if ($exists) {
                throw ValidationException::withMessages([
                    'question_id' => ['This question is already part of the exam.'],
                ]);
            }

            $maxOrder = (int) ExamQuestion::query()
                ->where('exam_id', $exam->id)
                ->max('order');

            ExamQuestion::create([
                'tenant_id' => $exam->tenant_id,
                'created_by_tenant_user_id' => $exam->created_by_tenant_user_id,
                'exam_id' => $exam->id,
                'question_id' => $question->id,
                'section' => $section,
                'order' => $maxOrder + 1,
                'points' => $points ?? $question->points,
            ]);

            return $this->recompute($exam);
        });
    }

    public function updateQuestionLink(Exam $exam, int $questionId, array $data): Exam
    {
        $link = ExamQuestion::query()
            ->where('exam_id', $exam->id)
            ->where('question_id', $questionId)
            ->firstOrFail();

        if (array_key_exists('section', $data)) {
            $link->section = $data['section'];
        }

        if (array_key_exists('points', $data)) {
            $link->points = $data['points'];
        }

        if (array_key_exists('order', $data)) {
            $link->order = $data['order'];
        }

        $link->save();

        return $this->recompute($exam);
    }

    public function removeQuestion(Exam $exam, int $questionId): Exam
    {
        return DB::transaction(function () use ($exam, $questionId): Exam {
            ExamQuestion::query()
                ->where('exam_id', $exam->id)
                ->where('question_id', $questionId)
                ->delete();

            $this->normalizeOrder($exam);

            return $this->recompute($exam);
        });
    }

    public function reorderQuestions(Exam $exam, array $orderedIds): Exam
    {
        return DB::transaction(function () use ($exam, $orderedIds): Exam {
            foreach ($orderedIds as $index => $questionId) {
                ExamQuestion::query()
                    ->where('exam_id', $exam->id)
                    ->where('question_id', $questionId)
                    ->update(['order' => $index + 1]);
            }

            return $this->recompute($exam);
        });
    }

    public function setQuestions(Exam $exam, array $items): Exam
    {
        return DB::transaction(function () use ($exam, $items): Exam {
            ExamQuestion::query()->where('exam_id', $exam->id)->delete();

            foreach ($items as $index => $item) {
                $question = Question::query()
                    ->where('tenant_id', $exam->tenant_id)
                    ->where('id', $item['question_id'])
                    ->firstOrFail();

                ExamQuestion::create([
                    'tenant_id' => $exam->tenant_id,
                    'created_by_tenant_user_id' => $exam->created_by_tenant_user_id,
                    'exam_id' => $exam->id,
                    'question_id' => $question->id,
                    'section' => $item['section'] ?? null,
                    'order' => $index + 1,
                    'points' => $item['points'] ?? $question->points,
                ]);
            }

            return $this->recompute($exam);
        });
    }

    public function togglePinned(Exam $exam): Exam
    {
        $exam->forceFill(['pinned' => ! $exam->pinned])->save();

        return $exam->refresh();
    }

    public function toggleFeatured(Exam $exam): Exam
    {
        $exam->forceFill(['featured' => ! $exam->featured])->save();

        return $exam->refresh();
    }

    public function toggleFavorite(Exam $exam): Exam
    {
        $metadata = $exam->metadata ?? [];
        $metadata['favorite'] = ! ($metadata['favorite'] ?? false);
        $exam->forceFill(['metadata' => $metadata])->save();

        return $exam->refresh();
    }

    public function recompute(Exam $exam): Exam
    {
        $links = $exam->examQuestions()->with('question')->get();

        $totalPoints = (int) $links->sum(fn ($link) => $link->points ?? $link->question?->points ?? 0);

        $exam->forceFill([
            'question_count' => $links->count(),
            'total_points' => $totalPoints,
        ])->save();

        return $exam->refresh();
    }

    protected function normalizeOrder(Exam $exam): void
    {
        $links = $exam->examQuestions()->orderBy('order')->get();

        foreach ($links as $index => $link) {
            $link->update(['order' => $index + 1]);
        }
    }

    private function resolveCategory(Tenant $tenant, string $category, ?TenantUser $creator = null): string
    {
        $category = trim($category);
        $slug = \Illuminate\Support\Str::slug($category);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'category' => ['The selected category is invalid for this tenant.'],
            ]);
        }

        $existing = QuestionCategory::query()
            ->where('tenant_id', $tenant->id)
            ->where(function ($query) use ($slug, $category) {
                $query->where('slug', $slug)->orWhere('name', $category);
            })
            ->first();

        if ($existing) {
            return $existing->slug;
        }

        $created = QuestionCategory::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator?->id,
            'name' => $category,
            'slug' => $slug,
            'status' => 'active',
        ]);

        return $created->slug;
    }

    private function uniqueSlug(string $value, ?Exam $ignore = null): string
    {
        $slug = \Illuminate\Support\Str::slug($value);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => ['The exam slug is invalid.'],
            ]);
        }

        $query = Exam::query()->where('slug', $slug)->where('tenant_id', currentTenant()->id);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            $slug .= '-' . substr((string) \Illuminate\Support\Str::uuid(), 0, 8);
        }

        return $slug;
    }
}
