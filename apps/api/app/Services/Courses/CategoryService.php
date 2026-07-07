<?php

namespace App\Services\Courses;

use App\Models\Category;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public function create(Tenant $tenant, TenantUser $creator, array $data): Category
    {
        return DB::transaction(function () use ($tenant, $creator, $data): Category {
            $slug = $this->uniqueSlug($data['slug'] ?? $data['name'], $tenant);

            if (array_key_exists('parent_id', $data) && $data['parent_id']) {
                $this->validateParent($data['parent_id'], null, $tenant);
            }

            $category = Category::create([
                'tenant_id' => $tenant->id,
                'parent_id' => $data['parent_id'] ?? null,
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'thumbnail_path' => $data['thumbnail_path'] ?? null,
                'icon' => $data['icon'] ?? null,
                'color' => $data['color'] ?? null,
                'sort_order' => $data['sort_order'] ?? 0,
                'featured' => $data['featured'] ?? false,
                'active' => $data['active'] ?? true,
                'seo_title' => $data['seo_title'] ?? null,
                'seo_description' => $data['seo_description'] ?? null,
                'seo_keywords' => $data['seo_keywords'] ?? null,
            ]);

            return $category->refresh()->load(['parent', 'children']);
        });
    }

    public function update(Tenant $tenant, Category $category, array $data): Category
    {
        return DB::transaction(function () use ($tenant, $category, $data): Category {
            if (array_key_exists('slug', $data)) {
                $data['slug'] = $this->uniqueSlug($data['slug'], $tenant, $category);
            } elseif (array_key_exists('name', $data)) {
                $data['slug'] = $this->uniqueSlug($data['name'], $tenant, $category);
            }

            if (array_key_exists('parent_id', $data)) {
                $this->validateParent($data['parent_id'], $category, $tenant);
            }

            $category->fill(collect($data)->only($category->getFillable())->all())->save();

            return $category->refresh()->load(['parent', 'children']);
        });
    }

    public function duplicate(Category $category, TenantUser $creator): Category
    {
        return DB::transaction(function () use ($category, $creator): Category {
            $data = [
                'parent_id' => $category->parent_id,
                'name' => $category->name . ' (نسخة)',
                'slug' => $this->uniqueSlug($category->slug . '-copy', currentTenant()),
                'description' => $category->description,
                'thumbnail_path' => $category->thumbnail_path,
                'icon' => $category->icon,
                'color' => $category->color,
                'sort_order' => $category->sort_order + 1,
                'featured' => false,
                'active' => true,
                'seo_title' => $category->seo_title,
                'seo_description' => $category->seo_description,
                'seo_keywords' => $category->seo_keywords,
            ];

            return Category::create([
                'tenant_id' => $category->tenant_id,
                ...$data,
            ])->refresh()->load(['parent', 'children']);
        });
    }

    public function toggleFeatured(Category $category): Category
    {
        $category->forceFill(['featured' => ! $category->featured])->save();
        return $category->refresh();
    }

    public function toggleActive(Category $category): Category
    {
        $category->forceFill(['active' => ! $category->active])->save();
        return $category->refresh();
    }

    private function validateParent(?int $parentId, ?Category $category, Tenant $tenant): void
    {
        if (! $parentId) {
            return;
        }

        $parent = Category::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $parentId)
            ->first();

        if (! $parent) {
            throw ValidationException::withMessages([
                'parent_id' => ['The selected parent category is invalid.'],
            ]);
        }

        if ($category && $parent->id === $category->id) {
            throw ValidationException::withMessages([
                'parent_id' => ['A category cannot be its own parent.'],
            ]);
        }

        if ($category) {
            $descendantIds = $this->getDescendantIds($category);
            if (in_array($parentId, $descendantIds, true)) {
                throw ValidationException::withMessages([
                    'parent_id' => ['A category cannot be a descendant of itself.'],
                ]);
            }
        }
    }

    private function getDescendantIds(Category $category): array
    {
        $ids = [];
        $children = Category::query()
            ->where('tenant_id', $category->tenant_id)
            ->where('parent_id', $category->id)
            ->get();

        foreach ($children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $this->getDescendantIds($child));
        }

        return $ids;
    }

    private function uniqueSlug(string $value, Tenant $tenant, ?Category $ignore = null): string
    {
        $slug = Str::slug($value);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => ['The category slug is invalid.'],
            ]);
        }

        $query = Category::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $slug);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'slug' => ['The category slug has already been taken.'],
            ]);
        }

        return $slug;
    }
}
