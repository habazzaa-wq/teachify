<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Models\User;
use App\Support\StudentFields;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class StudentProfileController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        [$user, $tenantUser] = $this->currentMembership($request);

        return response()->json([
            'data' => $this->formatProfile($user, $tenantUser),
        ]);
    }

    /**
     * Self-service profile edit. Email and phone are deliberately absent from
     * the validation rules so they can never be changed here. Guardian phone
     * can only be set once: after the first save it becomes read-only.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        [$user, $tenantUser] = $this->currentMembership($request);

        // Validate only fields this platform actually supports. A disabled
        // field is ignored even if a client sends it explicitly.
        $rules = ['name' => ['sometimes', 'required', 'string', 'max:255']]
            + StudentFields::rulesFor(currentTenant()->id);
        $validated = Validator::make($request->all(), $rules)->validate();

        // Guardian phone can be set once. After that it is read-only even if a
        // client sends a new value.
        if (array_key_exists('parent_phone', $validated) && filled($tenantUser->parent_phone)) {
            unset($validated['parent_phone']);
        }

        foreach ($validated as $key => $value) {
            if (is_string($value)) {
                $validated[$key] = trim($value);
            }
        }

        if (array_key_exists('name', $validated) && $validated['name'] === '') {
            throw ValidationException::withMessages(['name' => ['الاسم مطلوب.']]);
        }

        DB::transaction(function () use ($user, $tenantUser, $validated): void {
            if (array_key_exists('name', $validated)) {
                $user->update(['name' => $validated['name']]);
            }

            $membershipFields = array_intersect_key($validated, array_flip(StudentFields::OPTIONAL));
            if ($membershipFields !== []) {
                $tenantUser->update($membershipFields);
            }
        });

        return response()->json([
            'message' => 'تم تحديث المعلومات الشخصية بنجاح.',
            'data' => $this->formatProfile($user->refresh(), $tenantUser->refresh()),
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

    /**
     * @return array{0: User, 1: TenantUser}
     */
    private function currentMembership(Request $request): array
    {
        $user = $request->user();

        $tenantUser = TenantUser::where('tenant_id', currentTenant()->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $tenantUser) {
            throw ValidationException::withMessages([
                'profile' => ['لم يتم العثور على حسابك في هذه الأكاديمية.'],
            ]);
        }

        return [$user, $tenantUser];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatProfile(User $user, TenantUser $tenantUser): array
    {
        return [
            'id' => (string) $tenantUser->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $tenantUser->phone ?? '',
            'parentPhone' => $tenantUser->parent_phone ?? '',
            'gender' => $tenantUser->gender ?? '',
            'studyType' => $tenantUser->study_type ?? '',
            'nationality' => $tenantUser->nationality ?? '',
            'studyLevel' => $tenantUser->study_level ?? '',
            'governorate' => $tenantUser->governorate ?? '',
            'city' => $tenantUser->city ?? '',
            'avatar' => $tenantUser->avatar ?: ($user->avatar ?: null),
            'status' => $tenantUser->status,
            'joinedAt' => $tenantUser->joined_at?->toIso8601String(),
            'createdAt' => $tenantUser->created_at->toIso8601String(),
        ];
    }
}
