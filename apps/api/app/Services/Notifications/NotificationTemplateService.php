<?php

namespace App\Services\Notifications;

use App\Models\NotificationTemplate;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class NotificationTemplateService
{
    /**
     * @return Collection<int, NotificationTemplate>
     */
    public function list(Tenant $tenant): Collection
    {
        return NotificationTemplate::query()
            ->where('tenant_id', $tenant->id)
            ->orderBy('slug')
            ->orderBy('channel')
            ->get();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(Tenant $tenant, array $data): NotificationTemplate
    {
        $this->bindTenant($tenant);

        return NotificationTemplate::create([
            'tenant_id' => $tenant->id,
            'slug' => $data['slug'],
            'name' => $data['name'],
            'channel' => $data['channel'],
            'subject' => $data['subject'] ?? null,
            'body' => $data['body'],
            'variables' => $data['variables'] ?? [],
            'is_system' => $data['is_system'] ?? false,
            'is_active' => $data['is_active'] ?? true,
        ])->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Tenant $tenant, NotificationTemplate $template, array $data): NotificationTemplate
    {
        $this->bindTenant($tenant);
        $this->ensureTemplateInTenant($tenant, $template);

        $template->forceFill([
            'slug' => $data['slug'] ?? $template->slug,
            'name' => $data['name'] ?? $template->name,
            'channel' => $data['channel'] ?? $template->channel,
            'subject' => array_key_exists('subject', $data) ? $data['subject'] : $template->subject,
            'body' => $data['body'] ?? $template->body,
            'variables' => $data['variables'] ?? $template->variables,
            'is_system' => array_key_exists('is_system', $data) ? $data['is_system'] : $template->is_system,
            'is_active' => array_key_exists('is_active', $data) ? $data['is_active'] : $template->is_active,
        ])->save();

        return $template->refresh();
    }

    public function delete(Tenant $tenant, NotificationTemplate $template): void
    {
        $this->bindTenant($tenant);
        $this->ensureTemplateInTenant($tenant, $template);

        $template->delete();
    }

    /**
     * @param array<string, mixed> $variables
     * @return array{title:string,body:string}
     */
    public function render(Tenant $tenant, string $slug, string $channel, array $variables = []): array
    {
        $template = NotificationTemplate::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $slug)
            ->where('channel', $channel)
            ->where('is_active', true)
            ->first();

        if (! $template) {
            return [
                'title' => str($slug)->replace(['.', '_'], ' ')->headline()->toString(),
                'body' => '',
            ];
        }

        return [
            'title' => $this->replace($template->subject ?: $template->name, $variables),
            'body' => $this->replace($template->body, $variables),
        ];
    }

    private function replace(string $content, array $variables): string
    {
        foreach ($variables as $key => $value) {
            if (is_scalar($value) || $value === null) {
                $content = str_replace('{{ '.$key.' }}', (string) $value, $content);
                $content = str_replace('{{'.$key.'}}', (string) $value, $content);
            }
        }

        return $content;
    }

    private function ensureTemplateInTenant(Tenant $tenant, NotificationTemplate $template): void
    {
        if ($template->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'template' => ['The notification template is invalid for this tenant.'],
            ]);
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
