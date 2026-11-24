<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StudentProfileController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $membership = app('currentTenantMembership')->load('roles');

        $tenantUser = TenantUser::where('tenant_id', currentTenant()->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $tenantUser) {
            throw ValidationException::withMessages([
                'profile' => ['لم يتم العثور على حسابك في هذه الأكاديمية.'],
            ]);
        }

        return response()->json([
            'data' => [
                'id' => (string) $tenantUser->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $tenantUser->phone ?? '',
                'parentPhone' => $tenantUser->parent_phone ?? '',
                'gender' => $tenantUser->gender ?? '',
                'nationality' => $tenantUser->nationality ?? '',
                'studyLevel' => $tenantUser->study_level ?? '',
                'governorate' => $tenantUser->governorate ?? '',
                'city' => $tenantUser->city ?? '',
                'avatar' => $tenantUser->avatar ?? $user->avatar ?? null,
                'status' => $tenantUser->status,
                'joinedAt' => $tenantUser->joined_at?->toIso8601String(),
                'createdAt' => $tenantUser->created_at->toIso8601String(),
            ],
        ]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $user = $request->user();
        $membership = app('currentTenantMembership');

        $tenantUser = TenantUser::where('tenant_id', currentTenant()->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $tenantUser) {
            throw ValidationException::withMessages([
                'profile' => ['لم يتم العثور على حسابك في هذه الأكاديمية.'],
            ]);
        }

        $media = app(\App\Services\Media\MediaStorage::class);
        $disk = $media->diskName();

        // Delete old avatar file if it's a local storage file. Both the legacy
        // /storage URL and the current media-proxy URL point at the same path.
        if ($tenantUser->avatar && preg_match('#^/(?:storage|api/v1/media/serve)/avatars/(.+)$#', $tenantUser->avatar, $matches)) {
            $media->delete('avatars/' . $matches[1]);
        }

        // Store new avatar
        $file = $request->file('avatar');
        $filename = 'tenant_' . currentTenant()->id . '_user_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('avatars', $filename, $disk);

        // MediaStorage returns a same-origin proxy URL for the public disk, so
        // avatars load on tenant domains without depending on APP_URL or a
        // /storage mount in the front proxy.
        $avatarUrl = $media->url($path);

        // Update tenant_users table
        $tenantUser->update(['avatar' => $avatarUrl]);

        return response()->json([
            'message' => 'تم تحديث الصورة الشخصية بنجاح.',
            'data' => [
                'avatar' => $avatarUrl,
            ],
        ]);
    }
}
