<?php

namespace App\Policies;

use App\Models\User;
use App\Services\Authorization\AuthorizationService;
use Illuminate\Auth\Access\HandlesAuthorization;

class MediaLibraryPolicy
{
    use HandlesAuthorization;

    public function __construct(
        private readonly AuthorizationService $auth,
    ) {
    }

    public function view(User $user): bool
    {
        return $this->auth->hasPermission($user, 'media.view');
    }

    public function create(User $user): bool
    {
        return $this->auth->hasPermission($user, 'media.create');
    }

    public function update(User $user): bool
    {
        return $this->auth->hasPermission($user, 'media.update');
    }

    public function delete(User $user): bool
    {
        return $this->auth->hasPermission($user, 'media.delete');
    }

    public function upload(User $user): bool
    {
        return $this->auth->hasPermission($user, 'media.upload')
            || $this->auth->hasPermission($user, 'media.create')
            || $this->auth->hasPermission($user, 'courses.update')
            || $this->auth->hasPermission($user, 'courses.create');
    }

    public function download(User $user): bool
    {
        return $this->auth->hasPermission($user, 'media.download');
    }

    public function archive(User $user): bool
    {
        return $this->auth->hasPermission($user, 'media.archive');
    }

    public function manage(User $user): bool
    {
        return $this->auth->hasPermission($user, 'media.manage');
    }
}
