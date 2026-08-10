<?php

namespace App\Services\Platform;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantIntegration;
use App\Models\TenantProvisioningStep;
use App\Models\TenantSetting;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Security\AuditLogger;
use App\Services\Support\EmailNormalizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantCreationService
{
    /**
     * @var array<string, list<string>>
     */
    private array $rolePermissions = [
        'tenant_owner' => [
            'tenant.manage',
            'users.view',
            'users.invite',
            'users.manage',
            'roles.view',
            'roles.assign',
            'courses.view',
            'courses.create',
            'courses.update',
            'courses.publish',
            'courses.archive',
            'courses.assign_instructors',
            'courses.manage_settings',
            'enrollments.view',
            'enrollments.manage',
        ],
        'admin' => [
            'users.view',
            'users.invite',
            'users.manage',
            'roles.view',
            'roles.assign',
            'courses.view',
            'courses.create',
            'courses.update',
            'courses.publish',
            'courses.archive',
            'courses.assign_instructors',
            'courses.manage_settings',
            'enrollments.view',
            'enrollments.manage',
        ],
        'instructor' => [
            'courses.view',
            'courses.create',
            'courses.update',
            'enrollments.view',
        ],
        'student' => [
            'courses.view',
            'enrollments.view',
        ],
    ];

    public function __construct(
        private readonly EmailNormalizer $emails,
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * @param  array{
     *     academy_name: string,
     *     academy_slug: string,
     *     owner_name: string,
     *     owner_email: string,
     *     owner_password: string
     * }  $data
     * @return array{tenant: Tenant, owner: User, membership: TenantUser}
     */
    public function create(array $data, ?User $createdBy = null): array
    {
        return DB::transaction(function () use ($data, $createdBy): array {
            $slug = Str::slug($data['academy_slug']);
            $ownerEmail = $this->emails->normalize($data['owner_email']);

            $owner = User::firstOrCreate(
                ['email' => $ownerEmail],
                [
                    'name' => $data['owner_name'],
                    'password' => $data['owner_password'],
                ],
            );

            $tenant = Tenant::create([
                'name' => $data['academy_name'],
                'slug' => $slug,
                'status' => 'provisioning',
                'owner' => [
                    'name' => $data['owner_name'],
                    'email' => $ownerEmail,
                    'phone' => '',
                ],
                'owner_account' => [
                    'name' => $data['owner_name'],
                    'email' => $ownerEmail,
                    'phone' => '',
                    'password' => $data['owner_password'],
                    'passwordChanged' => false,
                    'welcomeEmail' => false,
                    'twoFactorEnabled' => false,
                    'status' => 'active',
                ],
                'branding' => [
                    'logo' => null,
                    'darkLogo' => null,
                    'favicon' => null,
                    'primaryColor' => '#2563eb',
                    'secondaryColor' => '#111827',
                    'accentColor' => '#f59e0b',
                    'fonts' => 'Cairo',
                    'loginBackground' => null,
                    'emailBranding' => false,
                    'whiteLabel' => false,
                ],
            ]);
            $this->completeStep($tenant, 'tenant_created');

            $membership = TenantUser::create([
                'tenant_id' => $tenant->id,
                'user_id' => $owner->id,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            $roles = $this->createDefaultRoles($tenant);
            $this->completeStep($tenant, 'roles_created');

            $this->attachDefaultPermissions($roles);
            $this->completeStep($tenant, 'permissions_attached');

            $membership->roles()->attach($roles['tenant_owner']->id, ['tenant_id' => $tenant->id]);

            $this->createDefaultSettings($tenant);
            $this->completeStep($tenant, 'settings_created');

            $this->createDefaultDomain($tenant);
            $this->completeStep($tenant, 'domain_created');

            $this->createPendingIntegrations($tenant);

            $tenant->forceFill(['status' => 'active'])->save();

            $this->audit->record('tenant_created', [
                'tenant_id' => $tenant->id,
                'created_by_user_id' => $createdBy?->id,
            ]);

            return [
                'tenant' => $tenant->refresh(),
                'owner' => $owner->refresh(),
                'membership' => $membership->refresh(),
            ];
        });
    }

    /**
     * @return array<string, Role>
     */
    private function createDefaultRoles(Tenant $tenant): array
    {
        $roles = [];

        foreach (array_keys($this->rolePermissions) as $slug) {
            $roles[$slug] = Role::create([
                'tenant_id' => $tenant->id,
                'slug' => $slug,
                'name' => Str::headline(str_replace('_', ' ', $slug)),
            ]);
        }

        return $roles;
    }

    /**
     * @param  array<string, Role>  $roles
     */
    private function attachDefaultPermissions(array $roles): void
    {
        $permissions = collect($this->allPermissionSlugs())
            ->mapWithKeys(fn (string $slug) => [
                $slug => Permission::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => Str::headline(str_replace('.', ' ', $slug)),
                        'description' => null,
                    ],
                ),
            ]);

        foreach ($this->rolePermissions as $roleSlug => $permissionSlugs) {
            $roles[$roleSlug]->permissions()->sync(
                $permissions->only($permissionSlugs)->pluck('id')->all(),
            );
        }
    }

    private function createDefaultSettings(Tenant $tenant): void
    {
        foreach ($this->defaultSettings($tenant) as $group => $values) {
            TenantSetting::create([
                'tenant_id' => $tenant->id,
                'group' => $group,
                'values' => $values,
            ]);
        }
    }

    private function createDefaultDomain(Tenant $tenant): TenantDomain
    {
        $baseDomain = config('app.base_domain', config('services.platform.domain', 'localhost'));
        $subdomain = $tenant->slug;
        $domain = $subdomain.'.'.$baseDomain;

        return TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => $domain,
            'subdomain' => $subdomain,
            'type' => 'platform_subdomain',
            'status' => 'active',
            'is_primary' => true,
        ]);
    }

    private function createPendingIntegrations(Tenant $tenant): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'storage',
            'status' => 'pending',
            'external_id' => null,
            'config' => [
                'base_path' => "tenants/{$tenant->id}",
                'paths' => [
                    'assets' => "tenants/{$tenant->id}/assets",
                    'courses' => "tenants/{$tenant->id}/courses",
                    'lessons' => "tenants/{$tenant->id}/lessons",
                    'certificates' => "tenants/{$tenant->id}/certificates",
                    'imports' => "tenants/{$tenant->id}/imports",
                    'exports' => "tenants/{$tenant->id}/exports",
                ],
            ],
        ]);

        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'stream',
            'status' => 'pending',
            'external_id' => null,
            'config' => [
                'library_strategy' => 'shared',
                'collection' => "tenant-{$tenant->id}",
                'metadata' => ['tenant_id' => $tenant->id],
            ],
        ]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function completeStep(Tenant $tenant, string $step, array $metadata = []): void
    {
        TenantProvisioningStep::create([
            'tenant_id' => $tenant->id,
            'step' => $step,
            'status' => 'completed',
            'attempts' => 1,
            'started_at' => now(),
            'completed_at' => now(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function defaultSettings(Tenant $tenant): array
    {
        return [
            'profile' => [
                'name' => $tenant->name,
                'description' => null,
                'support_email' => null,
                'website_url' => null,
            ],
            'branding' => [
                'logo_path' => null,
                'favicon_path' => null,
                'primary_color' => '#D87B63',
                'secondary_color' => '#FFB50E',
                'theme' => 'system',
            ],
            'locale' => [
                'timezone' => 'UTC',
                'language' => 'en',
                'date_format' => 'Y-m-d',
                'time_format' => 'H:i',
            ],
            'notifications' => [
                'sender_name' => $tenant->name,
                'reply_to_email' => null,
                'welcome_email_enabled' => true,
                'enrollment_notifications_enabled' => true,
            ],
            'enrollment' => [
                'approval_required' => false,
                'self_enrollment_enabled' => true,
            ],
            'video' => [
                'downloads_enabled' => false,
                'privacy' => 'private',
            ],
            'storage' => [
                'provider' => 'bunny',
                'base_path' => "tenants/{$tenant->id}",
            ],
            'setup' => [
                'completed' => false,
                'completed_steps' => [],
            ],
        ];
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
