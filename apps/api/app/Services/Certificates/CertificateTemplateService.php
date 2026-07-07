<?php

namespace App\Services\Certificates;

use App\Models\CertificateTemplate;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class CertificateTemplateService
{
    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): CertificateTemplate
    {
        return CertificateTemplate::create([
            'tenant_id' => currentTenant()->id,
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['slug'] ?? $data['name']),
            'status' => 'draft',
            'template_data' => $data['template_data'] ?? [],
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(CertificateTemplate $template, array $data): CertificateTemplate
    {
        if (array_key_exists('slug', $data)) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $template);
        }

        $template->fill(collect($data)->only([
            'name',
            'slug',
            'template_data',
        ])->all())->save();

        return $template->refresh();
    }

    public function changeStatus(CertificateTemplate $template, string $status): CertificateTemplate
    {
        $allowed = [
            'draft' => ['active'],
            'active' => ['archived'],
            'archived' => ['draft'],
        ];

        if (! in_array($status, $allowed[$template->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition certificate template from {$template->status} to {$status}."],
            ]);
        }

        $template->forceFill(['status' => $status])->save();

        return $template->refresh();
    }

    public function delete(CertificateTemplate $template): void
    {
        if ($template->rules()->exists() || $template->issuedCertificates()->exists()) {
            throw ValidationException::withMessages([
                'template' => ['Certificate templates in use cannot be deleted.'],
            ]);
        }

        $template->delete();
    }

    private function uniqueSlug(string $value, ?CertificateTemplate $ignore = null): string
    {
        $slug = Str::slug($value);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => ['The certificate template slug is invalid.'],
            ]);
        }

        $query = CertificateTemplate::query()->where('slug', $slug);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'slug' => ['The certificate template slug has already been taken.'],
            ]);
        }

        return $slug;
    }
}
