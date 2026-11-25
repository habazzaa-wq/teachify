<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Auth\PublicEmailVerificationService;
use App\Services\AvatarGenerator;
use App\Support\StudentFields;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PublicStudentRegisterController extends Controller
{
    public function register(Request $request, PublicEmailVerificationService $verification): JsonResponse
    {
        $tenant = currentTenant();

        if (! $tenant || $tenant->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant' => ['الأكاديمية غير متاحة.'],
            ]);
        }

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'email_notifications_enabled' => ['nullable', 'boolean'],
            'phone' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'string', 'same:password'],
        ] + StudentFields::rulesFor($tenant->id);
        $validated = Validator::make($request->all(), $rules)->validate();

        $tenantId = $tenant->id;
        // Only fields enabled for this platform are persisted.
        $studentAttributes = StudentFields::onlyEnabled($tenantId, $validated);
        $phone = trim((string) $validated['phone']);
        $email = mb_strtolower(trim((string) $validated['email']));

        $existingMembership = TenantUser::query()
            ->where('tenant_id', $tenantId)
            ->where('phone', $phone)
            ->exists();

        if ($existingMembership) {
            throw ValidationException::withMessages([
                'phone' => ['هذا الرقم مسجل بالفعل في هذه الأكاديمية.'],
            ]);
        }

        $existingUser = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
        if ($existingUser) {
            if ($existingUser->email_verified_at) {
                throw ValidationException::withMessages([
                    'email' => ['هذا البريد الإلكتروني مستخدم بالفعل.'],
                ]);
            }

            $membership = TenantUser::query()
                ->where('tenant_id', $tenantId)
                ->where('user_id', $existingUser->id)
                ->first();

            if (! $membership) {
                $avatar = AvatarGenerator::generate($studentAttributes['gender'] ?? null, $existingUser->id);
                $membership = TenantUser::create(array_merge([
                    'tenant_id' => $tenantId,
                    'user_id' => $existingUser->id,
                    'status' => 'active',
                    'phone' => $phone,
                    'avatar' => $avatar,
                    'joined_at' => now(),
                ], $studentAttributes));
                $studentRole = Role::where('tenant_id', $tenantId)->where('slug', 'student')->first();
                if ($studentRole) {
                    $membership->roles()->attach($studentRole->id, ['tenant_id' => $tenantId]);
                }
            }

            try {
                $verification->resend($existingUser, $tenant);
                $msg = 'هذا البريد الإلكتروني مسجل بالفعل لكنه غير مفعّل. أعدنا إرسال رمز التفعيل.';
            } catch (\Illuminate\Validation\ValidationException $e) {
                $msg = 'هذا البريد الإلكتروني مسجل بالفعل لكنه غير مفعّل. تحقق من بريدك الإلكتروني أو انتظر قليلًا قبل إعادة الإرسال.';
            } catch (\Throwable $e) {
                $msg = 'هذا البريد الإلكتروني مسجل بالفعل لكنه غير مفعّل. يرجى استخدام رمز التفعيل الذي تم إرساله سابقًا.';
            }

            return response()->json([
                'message' => $msg,
                'verification_required' => true,
                'email' => $email,
            ], 200);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => Hash::make($validated['password']),
        ]);

        $avatar = AvatarGenerator::generate($studentAttributes['gender'] ?? null, $user->id);

        $membership = TenantUser::create(array_merge([
            'tenant_id' => $tenantId,
            'user_id' => $user->id,
            'status' => 'active',
            'phone' => $phone,
            'avatar' => $avatar,
            'joined_at' => now(),
        ], $studentAttributes));

        $studentRole = Role::where('tenant_id', $tenantId)->where('slug', 'student')->first();
        if ($studentRole) {
            $membership->roles()->attach($studentRole->id, ['tenant_id' => $tenantId]);
        }

        $emailEnabled = array_key_exists('email_notifications_enabled', $validated)
            ? (bool) $validated['email_notifications_enabled']
            : true;
        foreach (['session.scheduled', 'session.rescheduled', 'session.cancelled'] as $type) {
            \App\Models\NotificationPreference::updateOrCreate(
                ['tenant_id' => $tenantId, 'tenant_user_id' => $membership->id, 'notification_type' => $type],
                ['in_app_enabled' => true, 'email_enabled' => $emailEnabled, 'whatsapp_enabled' => false]
            );
        }

        $verification->issue($user, $tenant);

        return response()->json([
            'message' => 'تم إنشاء الحساب. يرجى تفعيل بريدك الإلكتروني لإكمال التسجيل.',
            'verification_required' => true,
            'email' => $email,
        ], 201);
    }
}
