<?php

namespace App\Services\ExamBank;

use App\Models\QuestionBank;
use App\Models\QuestionCategory;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuestionBankService
{
    public function create(Tenant $tenant, TenantUser $creator, array $data): QuestionBank
    {
        return DB::transaction(function () use ($tenant, $creator, $data): QuestionBank {
            if (! empty($data['category_id'])) {
                $this->assertCategory($tenant, (int) $data['category_id']);
            }

            return QuestionBank::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $creator->id,
                'uuid' => \Illuminate\Support\Str::uuid(),
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['slug'] ?? $data['name']),
                'description' => $data['description'] ?? null,
                'category_id' => $data['category_id'] ?? null,
                'status' => 'active',
                'visibility' => $data['visibility'] ?? 'private',
            ]);
        });
    }

    public function update(Tenant $tenant, QuestionBank $bank, array $data): QuestionBank
    {
        return DB::transaction(function () use ($tenant, $bank, $data): QuestionBank {
            if (array_key_exists('slug', $data)) {
                $data['slug'] = $this->uniqueSlug($data['slug'], $bank);
            }

            if (array_key_exists('category_id', $data) && $data['category_id'] !== null) {
                $this->assertCategory($tenant, (int) $data['category_id']);
            }

            $bank->fill(collect($data)->only([
                'name', 'slug', 'description', 'category_id', 'visibility',
            ])->all())->save();

            return $bank->refresh();
        });
    }

    public function changeStatus(QuestionBank $bank, string $status): QuestionBank
    {
        $allowed = [
            'active' => ['archived', 'inactive'],
            'inactive' => ['active', 'archived'],
            'archived' => ['active', 'inactive'],
        ];

        if (! in_array($status, $allowed[$bank->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition question bank from {$bank->status} to {$status}."],
            ]);
        }

        $bank->forceFill(['status' => $status])->save();

        return $bank->refresh();
    }

    public function archive(QuestionBank $bank): QuestionBank
    {
        return $this->changeStatus($bank, 'archived');
    }

    public function restore(QuestionBank $bank): QuestionBank
    {
        $bank->forceFill(['status' => 'active'])->save();

        return $bank->refresh();
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

    private function uniqueSlug(string $value, ?QuestionBank $ignore = null): string
    {
        $slug = \Illuminate\Support\Str::slug($value);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => ['The question bank slug is invalid.'],
            ]);
        }

        $query = QuestionBank::query()->where('slug', $slug)->where('tenant_id', currentTenant()->id);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            $slug .= '-' . substr((string) \Illuminate\Support\Str::uuid(), 0, 8);
        }

        return $slug;
    }
}
