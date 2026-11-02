<?php

namespace App\Http\Controllers\Api\v1\Instructor;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Services\Instructors\InstructorAuthenticationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstructorAuthController extends Controller
{
    public function login(Request $request, InstructorAuthenticationService $auth): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ]);
        $result = $auth->login(currentTenant(), $validated['email'], $validated['password']);
        $membership = $result['membership'];

        return response()->json([
            'message' => 'Authenticated.',
            'access_token' => $result['access_token']->plainTextToken,
            'refresh_token' => $result['refresh_token']?->plainTextToken,
            'token_type' => 'Bearer',
            'must_change_password' => $membership->must_change_password,
            'user' => [
                'id' => $result['user']->id,
                'name' => $result['user']->name,
                'email' => $result['user']->email,
                'avatar' => $membership->avatar ?? $result['user']->avatar,
            ],
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'status' => $membership->status,
                'joined_at' => $membership->joined_at?->toIso8601String(),
                'last_login_at' => $membership->last_login_at?->toIso8601String(),
                'first_name' => $membership->first_name,
                'last_name' => $membership->last_name,
                'job_title' => $membership->job_title,
                'department' => $membership->department,
                'phone' => $membership->phone,
                'bio' => $membership->bio,
                'expertise' => $membership->expertise,
                'experience_years' => $membership->experience_years,
                'website_url' => $membership->website_url,
                'linkedin_url' => $membership->linkedin_url,
                'youtube_url' => $membership->youtube_url,
            ],
        ]);
    }

    public function refresh(Request $request, InstructorAuthenticationService $auth): JsonResponse
    {
        $validated = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $tokens = $auth->refresh(currentTenant(), $validated['refresh_token']);

        return response()->json([
            'message' => 'Token refreshed.',
            'access_token' => $tokens['access_token']->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var TenantUser $membership */
        $membership = $request->attributes->get('instructorMembership');

        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'avatar' => $membership->avatar ?? $request->user()->avatar,
            ],
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'must_change_password' => $membership->must_change_password,
                'joined_at' => $membership->joined_at?->toIso8601String(),
                'last_login_at' => $membership->last_login_at?->toIso8601String(),
                'first_name' => $membership->first_name,
                'last_name' => $membership->last_name,
                'job_title' => $membership->job_title,
                'department' => $membership->department,
                'phone' => $membership->phone,
                'bio' => $membership->bio,
                'expertise' => $membership->expertise,
                'experience_years' => $membership->experience_years,
                'website_url' => $membership->website_url,
                'linkedin_url' => $membership->linkedin_url,
                'youtube_url' => $membership->youtube_url,
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var TenantUser $membership */
        $membership = $request->attributes->get('instructorMembership');
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'avatar' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'department' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'expertise' => ['sometimes', 'nullable', 'string', 'max:255'],
            'experience_years' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:80'],
            'website_url' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'linkedin_url' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'youtube_url' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
        ]);

        $validated['first_name'] = trim($validated['first_name']);
        $validated['last_name'] = trim($validated['last_name']);
        abort_if($validated['first_name'] === '' || $validated['last_name'] === '', 422, 'الاسم الأول واسم العائلة مطلوبان.');

        DB::transaction(function () use ($request, $membership, $validated): void {
            $request->user()->forceFill([
                'name' => trim($validated['first_name'].' '.$validated['last_name']),
            ])->save();
            $membership->forceFill(collect($validated)->only([
                'avatar',
                'job_title',
                'department',
                'first_name',
                'last_name',
                'phone',
                'bio',
                'expertise',
                'experience_years',
                'website_url',
                'linkedin_url',
                'youtube_url',
            ])->all())->save();
        });

        return response()->json([
            'message' => 'Profile updated.',
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'avatar' => $membership->avatar ?? $request->user()->avatar,
            ],
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'must_change_password' => $membership->must_change_password,
                'joined_at' => $membership->joined_at?->toIso8601String(),
                'last_login_at' => $membership->last_login_at?->toIso8601String(),
                'first_name' => $membership->first_name,
                'last_name' => $membership->last_name,
                'job_title' => $membership->job_title,
                'department' => $membership->department,
                'phone' => $membership->phone,
                'bio' => $membership->bio,
                'expertise' => $membership->expertise,
                'experience_years' => $membership->experience_years,
                'website_url' => $membership->website_url,
                'linkedin_url' => $membership->linkedin_url,
                'youtube_url' => $membership->youtube_url,
            ],
        ]);
    }

    public function changePassword(Request $request, InstructorAuthenticationService $auth): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        /** @var TenantUser $membership */
        $membership = $request->attributes->get('instructorMembership');
        $tokens = $auth->changePassword($request->user(), $membership, $validated['password']);

        return response()->json([
            'message' => 'Password changed.',
            'access_token' => $tokens['access_token']->plainTextToken,
            'refresh_token' => $tokens['refresh_token']->plainTextToken,
            'token_type' => 'Bearer',
            'must_change_password' => false,
        ]);
    }

    public function logout(Request $request, InstructorAuthenticationService $auth): JsonResponse
    {
        $auth->revokeCurrentToken($request->user());

        return response()->json(['message' => 'Logged out.']);
    }
}
