<?php

namespace App\Policies;

use App\Models\User;
use App\Services\Authorization\AuthorizationService;

class DashboardPolicy
{
    public function __construct(private readonly AuthorizationService $authorization)
    {
    }

    public function view(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'analytics.view');
    }

    public function viewOverview(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'analytics.view');
    }

    public function viewCourseAnalytics(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'analytics.view');
    }

    public function viewLearnerAnalytics(User $user): bool
    {
        return $this->authorization->hasPermission($user, 'analytics.view');
    }
}
