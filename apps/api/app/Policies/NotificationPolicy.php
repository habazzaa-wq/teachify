<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\NotificationTemplate;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Authorization\TenantAuthorizationService;

class NotificationPolicy
{
    public function __construct(private readonly TenantAuthorizationService $authorization)
    {
    }

    public function viewNotification(TenantUser $viewer, Tenant $tenant, Notification $notification): bool
    {
        if ($notification->tenant_id !== $tenant->id) {
            return false;
        }

        return $notification->tenant_user_id === $viewer->id;
    }

    public function manageTemplate(TenantUser $viewer, Tenant $tenant, ?NotificationTemplate $template = null): bool
    {
        if ($template && $template->tenant_id !== $tenant->id) {
            return false;
        }

        return $this->isTenantOperator($viewer, $tenant);
    }

    private function isTenantOperator(TenantUser $viewer, Tenant $tenant): bool
    {
        return $this->authorization->hasRole($viewer->user, $tenant, 'tenant_owner')
            || $this->authorization->hasRole($viewer->user, $tenant, 'admin');
    }
}
