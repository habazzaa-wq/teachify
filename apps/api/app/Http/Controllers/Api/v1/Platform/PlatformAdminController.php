<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformAdmin;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PlatformAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlatformAdmin::query()
            ->with('user')
            ->latest();

        if ($search = $request->string('search')) {
            $query->whereHas('user', fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 25))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(['super_admin', 'support', 'analyst'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $admin = PlatformAdmin::create([
            'user_id' => $user->id,
            'role' => $validated['role'] ?? 'super_admin',
            'status' => 'active',
            'granted_at' => now(),
            'granted_by_user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Platform admin created.',
            'admin' => $admin->load('user'),
        ], 201);
    }

    public function show(PlatformAdmin $platformAdmin): JsonResponse
    {
        return response()->json([
            'admin' => $platformAdmin->load('user'),
        ]);
    }

    public function update(Request $request, PlatformAdmin $platformAdmin): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['sometimes', Rule::in(['super_admin', 'support', 'analyst'])],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $platformAdmin->fill(collect($validated)->only(['role', 'status'])->all())->save();

        return response()->json([
            'message' => 'Platform admin updated.',
            'admin' => $platformAdmin->refresh()->load('user'),
        ]);
    }

    public function destroy(PlatformAdmin $platformAdmin): JsonResponse
    {
        $platformAdmin->delete();

        return response()->json(['message' => 'Platform admin removed.']);
    }
}
